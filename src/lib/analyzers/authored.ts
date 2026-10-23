import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { accounts, analyzerPacks } from "@/db/schema";
import { ensureAnalyzerAuthoringSchema } from "@/lib/auth/schema-guard";
import type { AnalyzerPack } from "@/lib/analyzers/pack";
import { buildCasioAuthoredPack } from "@/lib/analyzers/casio-ss/authored-pack";
import { buildMindsetAuthoredPack } from "@/lib/analyzers/mindset-gate/authored-pack";
import { buildSystemDiagnosisAuthoredPack } from "@/lib/analyzers/system-diagnosis/authored-pack";
import { RESERVED_SLUGS, sanitizePack } from "@/lib/analyzers/sanitize";

async function ensureCasioSeed() {
  await ensureAnalyzerAuthoringSchema();
  const [row] = await db
    .select({ slug: analyzerPacks.slug })
    .from(analyzerPacks)
    .where(eq(analyzerPacks.slug, "casio-ss"))
    .limit(1);
  if (row) return;
  const pack = buildCasioAuthoredPack();
  try {
    await db.insert(analyzerPacks).values({
      slug: pack.slug,
      status: pack.status,
      pack,
      updatedAt: new Date(),
    });
  } catch {
    // concurrent seed
  }
}

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

/**
 * بذر مدیر را یک بار در analyzer_packs می‌نشاند؛ هرگز روی ویرایش بعدی مدیر overwrite نمی‌کند.
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
      const pack = seed.build();
      try {
        await db
          .insert(analyzerPacks)
          .values({ slug: pack.slug, status: pack.status, pack, createdBy: ownerId, updatedAt: new Date() })
          .onConflictDoNothing();
      } catch {
        // concurrent seed
      }
    } else if (existing.createdBy == null && ownerId != null) {
      await db
        .update(analyzerPacks)
        .set({ createdBy: ownerId })
        .where(and(eq(analyzerPacks.slug, seed.slug), isNull(analyzerPacks.createdBy)));
    }
  }
}

export async function listAuthoredPacks(): Promise<AnalyzerPack[]> {
  await ensureCasioSeed();
  await ensureManagerSeeds();
  const rows = await db.select().from(analyzerPacks).orderBy(desc(analyzerPacks.updatedAt));
  return rows.map((row) => row.pack).filter((pack) => pack?.slug && !RESERVED_SLUGS.has(pack.slug));
}

export async function readAuthoredPack(slug: string): Promise<AnalyzerPack | null> {
  if (!slug || RESERVED_SLUGS.has(slug)) return null;
  await ensureCasioSeed();
  await ensureManagerSeeds();
  const [row] = await db.select().from(analyzerPacks).where(eq(analyzerPacks.slug, slug)).limit(1);
  return row?.pack ?? null;
}

export async function insertAuthoredPack(pack: AnalyzerPack, createdBy?: number | null): Promise<AnalyzerPack> {
  await ensureAnalyzerAuthoringSchema();
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
  const [row] = await db
    .update(analyzerPacks)
    .set({ status: pack.status, pack, updatedAt: new Date() })
    .where(eq(analyzerPacks.slug, slug))
    .returning();
  if (!row) throw new Error("not_found");
  return row.pack;
}

export async function resolveLivePack(slug: string): Promise<AnalyzerPack | null> {
  const raw = await readAuthoredPack(slug);
  if (!raw) return slug === "casio-ss" ? buildCasioAuthoredPack() : null;
  const clean = sanitizePack(raw, slug);
  if (clean.ok) return clean.pack;
  return slug === "casio-ss" ? buildCasioAuthoredPack() : null;
}
