import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { analyzerPacks } from "@/db/schema";
import { ensureAnalyzerAuthoringSchema } from "@/lib/auth/schema-guard";
import type { AnalyzerPack } from "@/lib/analyzers/pack";
import { RESERVED_SLUGS } from "@/lib/analyzers/sanitize";

export async function listAuthoredPacks(): Promise<AnalyzerPack[]> {
  await ensureAnalyzerAuthoringSchema();
  const rows = await db.select().from(analyzerPacks).orderBy(desc(analyzerPacks.updatedAt));
  return rows
    .map((row) => row.pack)
    .filter((pack) => pack?.slug && !RESERVED_SLUGS.has(pack.slug));
}

export async function readAuthoredPack(slug: string): Promise<AnalyzerPack | null> {
  if (!slug || RESERVED_SLUGS.has(slug)) return null;
  await ensureAnalyzerAuthoringSchema();
  const [row] = await db.select().from(analyzerPacks).where(eq(analyzerPacks.slug, slug)).limit(1);
  return row?.pack ?? null;
}

export async function insertAuthoredPack(pack: AnalyzerPack): Promise<AnalyzerPack> {
  await ensureAnalyzerAuthoringSchema();
  await db.insert(analyzerPacks).values({
    slug: pack.slug,
    status: pack.status,
    pack,
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
