/**
 * Live pack resolution (HADIRAN-SSOT-2.1.0).
 *
 * The direction of authority flipped in migration 0030: PostgreSQL owns the canonical graph,
 * and the code manifest is only its first seed. `analyzer_packs.pack` is now a compiled
 * projection of the newest published revision — a read model the runtime scores from,
 * rewritten by publishing rather than by a code deploy.
 *
 * Consequence worth stating plainly: bumping an instrument version in code no longer overwrites
 * a deployed database on its own. An owner promotes the new seed with `reseedGraphFromCode()`.
 */

import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { analyzerPacks } from "@/db/schema";
import { ensureAnalyzerAuthoringSchema } from "@/lib/auth/schema-guard";
import type { AnalyzerPack } from "@/lib/analyzers/pack";
import { buildAllCanonicalPacks, getCanonicalPackBySlug } from "@/lib/analyzers/ssot-registry";
import { RESERVED_SLUGS, sanitizePack } from "@/lib/analyzers/sanitize";
import {
  ensureGraphSeeded,
  hasPublishedRevision,
  publishGraphDraft,
} from "@/lib/analyzers/graph/repository";
import type { SsotDomainCode } from "@/lib/analyzers/graph/types";

export function domainCodeForSlug(slug: string): SsotDomainCode | null {
  if (slug === "casio-ss") return "DOM.CASIO_SS";
  if (slug === "mindset-gate") return "DOM.MINDSET_GATE";
  return null;
}

let canonicalBootstrapped = false;

/**
 * Seed the graph and publish revision 1 for any domain with nothing in force.
 * Runs once per process; a missing database is a silent no-op so callers fall back to code.
 */
export async function bootstrapCanonicalGraph(): Promise<{ seeded: boolean; published: string[] }> {
  const result = { seeded: false, published: [] as string[] };
  if (canonicalBootstrapped) return result;
  // Flip the flag first: a failing connection must not turn every request into a retry.
  canonicalBootstrapped = true;
  try {
    await ensureAnalyzerAuthoringSchema();
    const seed = await ensureGraphSeeded();
    result.seeded = seed.seeded;
    for (const pack of buildAllCanonicalPacks()) {
      const domainCode = domainCodeForSlug(pack.slug);
      if (!domainCode) continue;
      if (await hasPublishedRevision(domainCode)) continue;
      const published = await publishGraphDraft({
        domainCode,
        noteFa: "انتشار اولیه از بذر مخزن (HADIRAN-SSOT-2.1.0)",
      });
      if (published.ok) result.published.push(`${pack.slug}#${published.revision}`);
    }
  } catch {
    // fall through to the code packs
  }
  return result;
}

/** Test seam: the bootstrap is memoised per process. */
export function resetCanonicalGraphBootstrap(): void {
  canonicalBootstrapped = false;
}

export async function listAuthoredPacks(): Promise<AnalyzerPack[]> {
  await bootstrapCanonicalGraph();
  const rows = await db.select().from(analyzerPacks).orderBy(desc(analyzerPacks.updatedAt));
  return rows.map((row) => row.pack).filter((pack) => pack?.slug && !RESERVED_SLUGS.has(pack.slug));
}

export async function readAuthoredPack(slug: string): Promise<AnalyzerPack | null> {
  if (!slug || RESERVED_SLUGS.has(slug)) return null;
  await bootstrapCanonicalGraph();
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
