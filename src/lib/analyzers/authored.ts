import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { analyzerPacks } from "@/db/schema";
import { ensureAnalyzerAuthoringSchema } from "@/lib/auth/schema-guard";
import type { AnalyzerPack } from "@/lib/analyzers/pack";
import { buildCasioAuthoredPack } from "@/lib/analyzers/casio-ss/authored-pack";
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

export async function listAuthoredPacks(): Promise<AnalyzerPack[]> {
  await ensureCasioSeed();
  const rows = await db.select().from(analyzerPacks).orderBy(desc(analyzerPacks.updatedAt));
  return rows.map((row) => row.pack).filter((pack) => pack?.slug && !RESERVED_SLUGS.has(pack.slug));
}

export async function readAuthoredPack(slug: string): Promise<AnalyzerPack | null> {
  if (!slug || RESERVED_SLUGS.has(slug)) return null;
  await ensureCasioSeed();
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
