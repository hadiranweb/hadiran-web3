import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { analyzerPacks } from "@/db/schema";
import { ensureAnalyzerAuthoringSchema } from "@/lib/auth/schema-guard";
import type { AnalyzerPack } from "@/lib/analyzers/pack";
import {
  buildAllCanonicalPacks,
  getCanonicalPackBySlug,
} from "@/lib/analyzers/ssot-registry";
import { RESERVED_SLUGS, sanitizePack } from "@/lib/analyzers/sanitize";

function needsCanonicalSync(existing: AnalyzerPack | null | undefined, canonical: AnalyzerPack): boolean {
  if (!existing) return true;
  if (existing.version !== canonical.version) return true;
  if (
    canonical.slug === "casio-ss" &&
    existing.sections.some((section) => section.id.startsWith("gate-"))
  ) {
    return true;
  }
  return false;
}

async function ensureCanonicalSeeds() {
  await ensureAnalyzerAuthoringSchema();
  const canonicalPacks = buildAllCanonicalPacks();
  for (const canonical of canonicalPacks) {
    const [row] = await db
      .select({ slug: analyzerPacks.slug, pack: analyzerPacks.pack })
      .from(analyzerPacks)
      .where(eq(analyzerPacks.slug, canonical.slug))
      .limit(1);
    if (row && !needsCanonicalSync(row.pack, canonical)) continue;
    try {
      if (row) {
        await db
          .update(analyzerPacks)
          .set({ status: canonical.status, pack: canonical, updatedAt: new Date() })
          .where(eq(analyzerPacks.slug, canonical.slug));
      } else {
        await db.insert(analyzerPacks).values({
          slug: canonical.slug,
          status: canonical.status,
          pack: canonical,
          updatedAt: new Date(),
        });
      }
    } catch {
      // concurrent seed
    }
  }
}

export async function listAuthoredPacks(): Promise<AnalyzerPack[]> {
  await ensureCanonicalSeeds();
  const rows = await db.select().from(analyzerPacks).orderBy(desc(analyzerPacks.updatedAt));
  return rows.map((row) => row.pack).filter((pack) => pack?.slug && !RESERVED_SLUGS.has(pack.slug));
}

export async function readAuthoredPack(slug: string): Promise<AnalyzerPack | null> {
  if (!slug || RESERVED_SLUGS.has(slug)) return null;
  await ensureCanonicalSeeds();
  const [row] = await db.select().from(analyzerPacks).where(eq(analyzerPacks.slug, slug)).limit(1);
  return row?.pack ?? getCanonicalPackBySlug(slug);
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
  if (!raw) return getCanonicalPackBySlug(slug);
  const clean = sanitizePack(raw, slug);
  if (clean.ok) return clean.pack;
  return getCanonicalPackBySlug(slug);
}
