/**
 * Repository for the canonical graph (HADIRAN-SSOT-2.1.0).
 *
 * Three roles, deliberately separated:
 *   draft tables (`ssot_*`)  = the working copy the workspace editor mutates
 *   `ssot_graph_revision`     = frozen, hashed snapshots; publishing is the only promotion path
 *   `analyzer_packs.pack`     = compiled projection the runtime scores from (disposable)
 *
 * The code manifest is inserted once, when the graph is still empty. It never overwrites a
 * row afterwards — that is what makes PostgreSQL the source of truth rather than a cache.
 */

import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  analyzerPacks,
  ssotCausalEdge,
  ssotConcept,
  ssotContextRule,
  ssotGraphAudit,
  ssotGraphEdge,
  ssotGraphRevision,
  ssotItem,
  ssotKeyword,
  ssotKeywordOntology,
  ssotLayer,
  ssotProcess,
  ssotSource,
  ssotSubKeyword,
} from "@/db/schema";
import { MIGRATION_FILES } from "@/db/migration-files";
import type { AnalyzerPack } from "@/lib/analyzers/pack";
import { buildGraphManifest, sliceManifestByDomain } from "./manifest";
import { compilePack } from "./compile";
import { errorsOnly, validateGraphManifest } from "./integrity";
import { manifestDigest } from "./hash";
import { countManifest, type GraphManifest, type SsotDomainCode } from "./types";

export const GRAPH_MIGRATION_ID = "0030_ssot_graph.sql";

let graphSchemaReady = false;

/**
 * Safety net when pre-start skipped 0030. Runs the migration text itself instead of a
 * second copy of the DDL, so schema and guard cannot drift apart.
 */
export async function ensureSsotGraphSchema(): Promise<void> {
  if (graphSchemaReady) return;
  // node-postgres returns a QueryResult; accept the array form too so this works on either handle.
  const probe = (await db.execute(
    sql`SELECT to_regclass('public.ssot_item') IS NULL AS missing`,
  )) as unknown as { rows?: { missing?: boolean }[] } | { missing?: boolean }[];
  const missingRow = Array.isArray(probe) ? probe[0] : probe.rows?.[0];
  if (missingRow?.missing !== true) {
    graphSchemaReady = true;
    return;
  }
  const entry = MIGRATION_FILES.find((row) => row.id === GRAPH_MIGRATION_ID);
  if (!entry) throw new Error(`migration ${GRAPH_MIGRATION_ID} is missing from the bundle`);
  await db.execute(sql.raw(entry.sql));
  graphSchemaReady = true;
}

function chunk<T>(rows: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < rows.length; i += size) out.push(rows.slice(i, i + size));
  return out;
}

export async function graphIsSeeded(domainCode?: SsotDomainCode): Promise<boolean> {
  await ensureSsotGraphSchema();
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(ssotItem)
    .where(domainCode ? eq(ssotItem.domainCode, domainCode) : undefined);
  return (row?.n ?? 0) > 0;
}

/** `db` and a transaction handle share the query surface this module needs. */
type GraphExecutor = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

async function insertRows(executor: GraphExecutor, manifest: GraphManifest): Promise<void> {
  for (const part of chunk(manifest.sources, 100)) {
    await executor.insert(ssotSource).values(part).onConflictDoNothing();
  }
  for (const part of chunk(manifest.concepts, 100)) {
    await executor.insert(ssotConcept).values(part).onConflictDoNothing();
  }
  for (const part of chunk(manifest.processes, 100)) {
    await executor.insert(ssotProcess).values(part).onConflictDoNothing();
  }
  for (const part of chunk(manifest.layers, 50)) {
    await executor.insert(ssotLayer).values(part).onConflictDoNothing();
  }
  for (const part of chunk(manifest.keywords, 50)) {
    await executor.insert(ssotKeyword).values(part).onConflictDoNothing();
  }
  for (const part of chunk(manifest.keywordOntology, 50)) {
    await executor.insert(ssotKeywordOntology).values(part).onConflictDoNothing();
  }
  for (const part of chunk(manifest.subKeywords, 50)) {
    await executor.insert(ssotSubKeyword).values(part).onConflictDoNothing();
  }
  for (const part of chunk(manifest.items, 25)) {
    await executor.insert(ssotItem).values(part).onConflictDoNothing();
  }
  for (const part of chunk(manifest.edges, 100)) {
    await executor.insert(ssotGraphEdge).values(part).onConflictDoNothing();
  }
  for (const part of chunk(manifest.causalEdges, 50)) {
    await executor.insert(ssotCausalEdge).values(part).onConflictDoNothing();
  }
  for (const part of chunk(manifest.contextRules, 50)) {
    await executor.insert(ssotContextRule).values(part).onConflictDoNothing();
  }
}

/** Only the casio graph is what the scoring engine reads today. */
function domainCodeIsCasio(domainCode: SsotDomainCode): boolean {
  return domainCode === "DOM.CASIO_SS";
}

async function clearDraft(executor: GraphExecutor): Promise<void> {
  // Children first: keyword -> sub-keyword and item -> link are FK cascades, but the
  // explicit order keeps this statement usable on a partially built database.
  await executor.delete(ssotContextRule);
  await executor.delete(ssotCausalEdge);
  await executor.delete(ssotGraphEdge);
  await executor.delete(ssotItem);
  await executor.delete(ssotSubKeyword);
  await executor.delete(ssotKeywordOntology);
  await executor.delete(ssotKeyword);
  await executor.delete(ssotLayer);
  await executor.delete(ssotProcess);
  await executor.delete(ssotConcept);
  await executor.delete(ssotSource);
}

export async function loadDraftGraph(): Promise<GraphManifest> {
  await ensureSsotGraphSchema();
  const [
    sources,
    concepts,
    processes,
    layers,
    keywords,
    keywordOntology,
    subKeywords,
    items,
    edges,
    causalEdges,
    contextRules,
  ] = await Promise.all([
      db.select().from(ssotSource),
      db.select().from(ssotConcept),
      db.select().from(ssotProcess),
      db.select().from(ssotLayer),
      db.select().from(ssotKeyword),
      db.select().from(ssotKeywordOntology),
      db.select().from(ssotSubKeyword),
      db.select().from(ssotItem),
      db.select().from(ssotGraphEdge),
      db.select().from(ssotCausalEdge),
      db.select().from(ssotContextRule),
    ]);

  const seed = buildGraphManifest();
  return {
    ssotVersion: seed.ssotVersion,
    codingVersion: seed.codingVersion,
    sources: sources.map((row) => ({
      canonicalCode: row.canonicalCode,
      legacyId: row.legacyId,
      title: row.title,
      authors: row.authors ?? null,
      year: row.year ?? null,
      kind: row.kind as GraphManifest["sources"][number]["kind"],
      locator: row.locator ?? null,
      claimFa: row.claimFa ?? null,
    })),
    concepts: concepts.map((row) => ({
      canonicalCode: row.canonicalCode,
      legacyId: row.legacyId,
      labelFa: row.labelFa,
      summaryFa: row.summaryFa ?? null,
      model: row.model ?? null,
      sourceCodes: row.sourceCodes ?? [],
    })),
    processes: processes.map((row) => ({
      canonicalCode: row.canonicalCode,
      legacyId: row.legacyId,
      labelFa: row.labelFa,
      summaryFa: row.summaryFa ?? null,
      keywordCodes: row.keywordCodes ?? [],
    })),
    layers: layers
      .slice()
      .sort((a, b) => a.layerNo - b.layerNo)
      .map((row) => ({
        canonicalCode: row.canonicalCode,
        legacyId: row.legacyId,
        domainCode: row.domainCode as SsotDomainCode,
        layerNo: row.layerNo,
        yamlKey: row.yamlKey ?? null,
        titleFa: row.titleFa,
        constructFa: row.constructFa ?? null,
        asIsFa: row.asIsFa ?? null,
        toBeFa: row.toBeFa ?? null,
        actionsFa: row.actionsFa ?? null,
        active: row.active,
      })),
    keywords: keywords
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((row) => ({
        canonicalCode: row.canonicalCode,
        legacyId: row.legacyId,
        domainCode: row.domainCode as SsotDomainCode,
        layerCode: row.layerCode ?? null,
        layerNo: row.layerNo,
        keywordNo: row.keywordNo,
        labelFa: row.labelFa,
        constructFa: row.constructFa ?? null,
        ownerRoleFa: row.ownerRoleFa ?? null,
        horizonFa: row.horizonFa ?? null,
        whyFa: row.whyFa ?? null,
        asIsWeakFa: row.asIsWeakFa ?? null,
        asIsGrowingFa: row.asIsGrowingFa ?? null,
        asIsStrongFa: row.asIsStrongFa ?? null,
        toBeFa: row.toBeFa ?? null,
        actionStepFa: row.actionStepFa ?? null,
        rummlerLevel: row.rummlerLevel as GraphManifest["keywords"][number]["rummlerLevel"],
        rummlerNeed: row.rummlerNeed as GraphManifest["keywords"][number]["rummlerNeed"],
        rummlerCellLabelFa: row.rummlerCellLabelFa ?? null,
        nadlerPairFa: row.nadlerPairFa ?? null,
        vaultRefs: row.vaultRefs ?? [],
        sourceCodes: row.sourceCodes ?? [],
        ismLevel: row.ismLevel ?? null,
        micmacQuadrant: row.micmacQuadrant ?? null,
        active: row.active,
        sortOrder: row.sortOrder,
      })),
    keywordOntology: keywordOntology.map((row) => ({
      keywordCode: row.keywordCode,
      rummlerLevel: row.rummlerLevel as GraphManifest["keywordOntology"][number]["rummlerLevel"],
      rummlerNeed: row.rummlerNeed as GraphManifest["keywordOntology"][number]["rummlerNeed"],
      rummlerCellLabelFa: row.rummlerCellLabelFa ?? null,
      nadlerPairFa: row.nadlerPairFa ?? null,
      vaultRefs: row.vaultRefs ?? [],
      sourceCodes: row.sourceCodes ?? [],
    })),
    subKeywords: subKeywords
      .slice()
      .sort((a, b) => (a.keywordCode === b.keywordCode ? a.sortOrder - b.sortOrder : a.keywordCode.localeCompare(b.keywordCode)))
      .map((row) => ({
        canonicalCode: row.canonicalCode,
        legacyId: row.legacyId,
        keywordCode: row.keywordCode,
        subNo: row.subNo,
        labelFa: row.labelFa,
        sortOrder: row.sortOrder,
      })),
    items: items
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((row) => ({
        canonicalCode: row.canonicalCode,
        legacyId: row.legacyId,
        axis: row.axis as GraphManifest["items"][number]["axis"],
        tier: row.tier as GraphManifest["items"][number]["tier"],
        domainCode: row.domainCode as SsotDomainCode,
        layerNo: row.layerNo ?? null,
        dimensionCode: row.dimensionCode ?? null,
        sectionId: row.sectionId,
        sectionTitleFa: row.sectionTitleFa ?? null,
        sectionIntroFa: row.sectionIntroFa ?? null,
        textFa: row.textFa,
        helpFa: row.helpFa ?? null,
        reverse: row.reverse,
        kind: row.kind as GraphManifest["items"][number]["kind"],
        scaleMin: row.scaleMin,
        scaleMax: row.scaleMax,
        critical: row.critical,
        anchors: row.anchors ?? null,
        options: row.options ?? null,
        maxLength: row.maxLength ?? null,
        routing: row.routing ?? null,
        sourceCodes: row.sourceCodes ?? [],
        sortOrder: row.sortOrder,
        active: row.active,
      })),
    edges: edges
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((row) => ({
        domainCode: row.domainCode as SsotDomainCode,
        edgeKind: row.edgeKind as GraphManifest["edges"][number]["edgeKind"],
        sourceCode: row.sourceCode,
        sourceKind: row.sourceKind as GraphManifest["edges"][number]["sourceKind"],
        targetCode: row.targetCode,
        targetKind: row.targetKind as GraphManifest["edges"][number]["targetKind"],
        weight: Number(row.weight),
        transform: row.transform as "identity" | "reverse",
        sortOrder: row.sortOrder,
        rationaleFa: row.rationaleFa ?? null,
      })),
    causalEdges: causalEdges
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((row) => ({
        edgeKey: row.edgeKey,
        domainCode: row.domainCode as SsotDomainCode,
        fromCode: row.fromCode,
        toCode: row.toCode,
        weight: Number(row.weight),
        edgeType: row.edgeType as GraphManifest["causalEdges"][number]["edgeType"],
        ismLevel: row.ismLevel ?? null,
        mechanismFa: row.mechanismFa ?? null,
        sourceCodes: row.sourceCodes ?? [],
        sortOrder: row.sortOrder,
      })),
    contextRules: contextRules.map((row) => ({
      ruleKind: row.ruleKind as "size" | "type",
      contextCode: row.contextCode,
      targetCode: row.targetCode,
      factor: Number(row.factor),
      noteFa: row.noteFa ?? null,
    })),
  };
}

export type SeedResult = {
  seeded: boolean;
  published: boolean;
  hash: string;
  counts: ReturnType<typeof countManifest>;
  reason?: string;
};

/**
 * Insert the code manifest exactly once, then publish revision 1 so the runtime reads a
 * database-derived pack from the first boot. Never touches an existing graph.
 */
export async function ensureGraphSeeded(): Promise<SeedResult> {
  const manifest = buildGraphManifest();
  const { hash, counts } = manifestDigest(manifest);
  if (await graphIsSeeded()) {
    return { seeded: false, published: false, hash, counts, reason: "already_seeded" };
  }
  await db.transaction(async (tx) => {
    await insertRows(tx, manifest);
  });
  return { seeded: true, published: false, hash, counts };
}

export type PublishResult =
  | { ok: true; revision: number; hash: string; counts: ReturnType<typeof countManifest> }
  | { ok: false; error: string; issues?: ReturnType<typeof validateGraphManifest> };

/**
 * Freeze the current draft into an immutable revision and rewrite the compiled projection.
 * Publishing is the only path from "edited" to "in force for the next respondent".
 */
export async function publishGraphDraft(input: {
  domainCode: SsotDomainCode;
  noteFa?: string;
  actorId?: number | null;
  actorRole?: string | null;
}): Promise<PublishResult> {
  await ensureSsotGraphSchema();
  const manifest = await loadDraftGraph();
  const issues = validateGraphManifest(manifest);
  const blocking = errorsOnly(issues);
  if (blocking.length) return { ok: false, error: "integrity_failed", issues };

  const { hash, counts } = manifestDigest(manifest);
  const [previous] = await db
    .select({ revision: ssotGraphRevision.revision })
    .from(ssotGraphRevision)
    .where(and(eq(ssotGraphRevision.domainCode, input.domainCode), eq(ssotGraphRevision.status, "published")))
    .orderBy(desc(ssotGraphRevision.revision))
    .limit(1);
  const revision = (previous?.revision ?? 0) + 1;

  const template =
    input.domainCode === "DOM.CASIO_SS"
      ? ((await import("@/lib/analyzers/casio-ss/authored-pack")).buildCasioAuthoredPack() as AnalyzerPack)
      : ((await import("@/lib/analyzers/mindset-gate/instrument")).mindsetGatePack as AnalyzerPack);
  const compiled = compilePack(manifest, template);

  await db.transaction(async (tx) => {
    await tx.insert(ssotGraphRevision).values({
      domainCode: input.domainCode,
      revision,
      status: "published",
      ssotVersion: manifest.ssotVersion,
      codingVersion: manifest.codingVersion,
      payloadHash: hash,
      counts,
      snapshot: manifest,
      noteFa: input.noteFa ?? null,
      createdBy: input.actorId ?? null,
      publishedAt: new Date(),
    });
    const [existing] = await tx
      .select({ slug: analyzerPacks.slug })
      .from(analyzerPacks)
      .where(eq(analyzerPacks.slug, compiled.pack.slug))
      .limit(1);
    if (existing) {
      await tx
        .update(analyzerPacks)
        .set({ status: compiled.pack.status, pack: compiled.pack, updatedAt: new Date() })
        .where(eq(analyzerPacks.slug, compiled.pack.slug));
    } else {
      await tx
        .insert(analyzerPacks)
        .values({ slug: compiled.pack.slug, status: compiled.pack.status, pack: compiled.pack, createdBy: input.actorId ?? null })
        .onConflictDoNothing();
    }
    await tx.insert(ssotGraphAudit).values({
      domainCode: input.domainCode,
      action: "publish",
      entity: "ssot_graph_revision",
      entityCode: `${input.domainCode}#${revision}`,
      actorId: input.actorId ?? null,
      actorRole: input.actorRole ?? null,
      diff: { counts, noteFa: input.noteFa ?? null },
      payloadHash: hash,
    });
  });

  // The engine reads through an in-process cache. Drop it and re-warm straight away, so the next
  // report on this process is built from what was just published rather than from the previous
  // revision (or, if we only cleared it, from the code fallback).
  const { invalidateGraphContext, warmGraphContext } = await import("./runtime");
  invalidateGraphContext();
  if (domainCodeIsCasio(input.domainCode)) await warmGraphContext();

  return { ok: true, revision, hash, counts };
}

/** Draft save from the workspace editor: replace rows, record the change, publish separately. */
export async function writeDraftGraph(
  manifest: GraphManifest,
  input: { actorId?: number | null; actorRole?: string | null; noteFa?: string } = {},
): Promise<{ ok: true; counts: ReturnType<typeof countManifest>; hash: string } | { ok: false; issues: ReturnType<typeof validateGraphManifest> }> {
  await ensureSsotGraphSchema();
  const issues = validateGraphManifest(manifest);
  if (errorsOnly(issues).length) return { ok: false, issues };
  const { hash, counts } = manifestDigest(manifest);
  await db.transaction(async (tx) => {
    await clearDraft(tx);
    await insertRows(tx, manifest);
    await tx.insert(ssotGraphAudit).values({
      domainCode: "DOM.CASIO_SS",
      action: "save_draft",
      entity: "graph",
      entityCode: null,
      actorId: input.actorId ?? null,
      actorRole: input.actorRole ?? null,
      diff: { counts, noteFa: input.noteFa ?? null },
      payloadHash: hash,
    });
  });
  return { ok: true, counts, hash };
}

export async function latestPublishedRevision(domainCode: SsotDomainCode) {
  await ensureSsotGraphSchema();
  const [row] = await db
    .select()
    .from(ssotGraphRevision)
    .where(and(eq(ssotGraphRevision.domainCode, domainCode), eq(ssotGraphRevision.status, "published")))
    .orderBy(desc(ssotGraphRevision.revision))
    .limit(1);
  return row ?? null;
}

export async function listGraphAudit(domainCode: SsotDomainCode, limit = 50) {
  await ensureSsotGraphSchema();
  return db
    .select()
    .from(ssotGraphAudit)
    .where(eq(ssotGraphAudit.domainCode, domainCode))
    .orderBy(desc(ssotGraphAudit.id))
    .limit(Math.min(Math.max(limit, 1), 200));
}

/** True when a domain already has something in force — the bootstrap must not re-publish. */
export async function hasPublishedRevision(domainCode: SsotDomainCode): Promise<boolean> {
  await ensureSsotGraphSchema();
  const [row] = await db
    .select({ id: ssotGraphRevision.id })
    .from(ssotGraphRevision)
    .where(and(eq(ssotGraphRevision.domainCode, domainCode), eq(ssotGraphRevision.status, "published")))
    .limit(1);
  return Boolean(row);
}

export type ReseedResult = {
  ok: boolean;
  published: { domainCode: SsotDomainCode; revision: number; hash: string }[];
  skippedReason?: string;
};

/**
 * Owner-initiated promotion of the repository seed over a live database.
 *
 * This is deliberately not automatic. PostgreSQL owns the graph, so a code deploy must never
 * quietly roll back weights an editor tuned in the workspace. The caller has to ask for it,
 * the previous draft is replaced inside one transaction, and every domain that publishes gets
 * a new immutable revision — nothing in the history is rewritten.
 */
export async function reseedGraphFromCode(
  input: { actorId?: number | null; actorRole?: string | null; noteFa?: string } = {},
): Promise<ReseedResult> {
  await ensureSsotGraphSchema();
  const manifest = buildGraphManifest();
  const issues = validateGraphManifest(manifest);
  if (errorsOnly(issues).length) return { ok: false, published: [], skippedReason: "seed_integrity_failed" };

  await db.transaction(async (tx) => {
    await clearDraft(tx);
    await insertRows(tx, manifest);
    await tx.insert(ssotGraphAudit).values({
      domainCode: "DOM.CASIO_SS",
      action: "reseed",
      entity: "graph",
      entityCode: null,
      actorId: input.actorId ?? null,
      actorRole: input.actorRole ?? null,
      diff: { counts: countManifest(manifest), noteFa: input.noteFa ?? null },
      payloadHash: manifestDigest(manifest).hash,
    });
  });

  const published: ReseedResult["published"] = [];
  for (const domainCode of ["DOM.CASIO_SS", "DOM.MINDSET_GATE"] as SsotDomainCode[]) {
    const result = await publishGraphDraft({
      domainCode,
      noteFa: input.noteFa ?? "ارتقا از بذر مخزن",
      actorId: input.actorId ?? null,
      actorRole: input.actorRole ?? null,
    });
    if (result.ok) published.push({ domainCode, revision: result.revision, hash: result.hash });
  }
  return { ok: published.length > 0, published };
}

/** Draft-vs-published drift, for the workspace header. */
export async function graphDrift(domainCode: SsotDomainCode): Promise<{ draftHash: string; publishedHash: string | null; dirty: boolean }> {
  const draft = await loadDraftGraph();
  const draftHash = manifestDigest(sliceManifestForDomain(draft, domainCode)).hash;
  const revision = await latestPublishedRevision(domainCode);
  const publishedSnapshot = revision?.snapshot as GraphManifest | undefined;
  const publishedHash = publishedSnapshot
    ? manifestDigest(sliceManifestForDomain(publishedSnapshot, domainCode)).hash
    : null;
  return { draftHash, publishedHash, dirty: publishedHash !== null && draftHash !== publishedHash };
}

function sliceManifestForDomain(manifest: GraphManifest, domainCode: SsotDomainCode): GraphManifest {
  return sliceManifestByDomain(manifest, domainCode);
}
