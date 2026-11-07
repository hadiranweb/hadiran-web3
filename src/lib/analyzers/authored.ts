import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { accounts, analyzerPacks } from "@/db/schema";
import { ensureAnalyzerAuthoringSchema } from "@/lib/auth/schema-guard";
import type { AnalyzerPack } from "@/lib/analyzers/pack";
import { buildMindsetAuthoredPack } from "@/lib/analyzers/mindset-gate/authored-pack";
import { buildSystemDiagnosisAuthoredPack } from "@/lib/analyzers/system-diagnosis/authored-pack";
import { RESERVED_SLUGS, sanitizePack } from "@/lib/analyzers/sanitize";
import {
  hasRelationalAuthoringSchema,
  insertAuthoredPackInTransaction,
  readAuthoredPacksFromRelational,
  updateAuthoredPackRelational,
} from "@/lib/analyzers/relational-store";

/** آزمون‌های ساختهٔ مدیر: تعریف در کد فقط بذر اولیه است؛ از اولین بذر، DB منبع اجراست. */
const MANAGER_SEED_BUILDERS: { slug: string; build: () => AnalyzerPack }[] = [
  { slug: "mindset-gate", build: buildMindsetAuthoredPack },
  { slug: "system-diagnosis", build: buildSystemDiagnosisAuthoredPack },
];

async function firstOwnerId(): Promise<number | null> {
  const [row] = await db
    .select({ id: accounts.id })
    .from(accounts)
    .where(eq(accounts.role, "owner"))
    .orderBy(asc(accounts.id))
    .limit(1);
  return row?.id ?? null;
}

function isUniqueViolation(error: unknown): boolean {
  const row = error && typeof error === "object" ? (error as Record<string, unknown>) : {};
  if (row.code === "23505") return true;
  const cause = row.cause;
  return cause !== error && cause != null ? isUniqueViolation(cause) : false;
}

function legacyPack(row: typeof analyzerPacks.$inferSelect): AnalyzerPack | null {
  if (!row.pack || typeof row.pack !== "object") return null;
  return { ...row.pack, slug: row.slug, status: row.status as AnalyzerPack["status"] };
}

/**
 * بذر مدیر را یک بار در DB می‌نشاند؛ هرگز روی ویرایش بعدی مدیر overwrite نمی‌کند.
 * اگر بذر پیش از ساخته‌شدن حساب مدیر نشسته باشد (createdBy خالی)، به نام اولین مدیر claim می‌شود؛
 * پکی که از میز ساخته شده باشد createdBy دارد و این مسیر هرگز به آن دست نمی‌زند.
 */
async function ensureManagerSeeds() {
  await ensureAnalyzerAuthoringSchema();
  const ownerId = await firstOwnerId().catch(() => null);
  for (const seed of MANAGER_SEED_BUILDERS) {
    const [existing] = await db
      .select({ createdBy: analyzerPacks.createdBy })
      .from(analyzerPacks)
      .where(eq(analyzerPacks.slug, seed.slug))
      .limit(1);
    if (!existing) {
      try {
        await insertAuthoredPack(seed.build(), ownerId);
      } catch (error) {
        if (!isUniqueViolation(error)) throw error;
        // Another request inserted the one-time seed concurrently.
      }
    } else if (existing.createdBy == null && ownerId != null) {
      await db
        .update(analyzerPacks)
        .set({ createdBy: ownerId })
        .where(and(eq(analyzerPacks.slug, seed.slug), isNull(analyzerPacks.createdBy)));
    }
  }
}

async function readRows(rows: (typeof analyzerPacks.$inferSelect)[]): Promise<AnalyzerPack[]> {
  if (!(await hasRelationalAuthoringSchema())) {
    return rows.map(legacyPack).filter((pack): pack is AnalyzerPack => Boolean(pack && pack.slug && !RESERVED_SLUGS.has(pack.slug)));
  }
  const normalized = await readAuthoredPacksFromRelational(rows);
  return rows
    .map((row) => normalized.get(row.slug) ?? legacyPack(row))
    .filter((pack): pack is AnalyzerPack => Boolean(pack && pack.slug && !RESERVED_SLUGS.has(pack.slug)));
}

export async function listAuthoredPacks(): Promise<AnalyzerPack[]> {
  await ensureManagerSeeds();
  const rows = await db.select().from(analyzerPacks).orderBy(desc(analyzerPacks.updatedAt));
  return readRows(rows);
}

export async function readAuthoredPack(slug: string): Promise<AnalyzerPack | null> {
  if (!slug || RESERVED_SLUGS.has(slug)) return null;
  await ensureManagerSeeds();
  const [row] = await db.select().from(analyzerPacks).where(eq(analyzerPacks.slug, slug)).limit(1);
  if (!row) return null;
  const [pack] = await readRows([row]);
  return pack ?? null;
}

export async function insertAuthoredPack(pack: AnalyzerPack, createdBy?: number | null): Promise<AnalyzerPack> {
  await ensureAnalyzerAuthoringSchema();
  if (await hasRelationalAuthoringSchema()) {
    return db.transaction((tx) => insertAuthoredPackInTransaction(tx, pack, createdBy ?? null));
  }
  await db.insert(analyzerPacks).values({
    slug: pack.slug,
    status: pack.status,
    pack,
    createdBy: createdBy ?? null,
    updatedAt: new Date(),
  });
  return pack;
}

export async function updateAuthoredPack(slug: string, pack: AnalyzerPack): Promise<AnalyzerPack> {
  await ensureAnalyzerAuthoringSchema();
  if (await hasRelationalAuthoringSchema()) return updateAuthoredPackRelational(slug, pack);
  const [row] = await db
    .update(analyzerPacks)
    .set({ status: pack.status, pack, updatedAt: new Date() })
    .where(eq(analyzerPacks.slug, slug))
    .returning();
  if (!row) throw new Error("not_found");
  return { ...row.pack, slug: row.slug, status: row.status as AnalyzerPack["status"] };
}

export async function resolveLivePack(slug: string): Promise<AnalyzerPack | null> {
  const raw = await readAuthoredPack(slug);
  if (!raw) return null;
  const clean = sanitizePack(raw, slug);
  if (!clean.ok) return null;
  return raw.packVersionId == null ? clean.pack : { ...clean.pack, packVersionId: raw.packVersionId };
}
