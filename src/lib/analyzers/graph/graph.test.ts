/**
 * Tests for the canonical graph data layer (HADIRAN-SSOT-2.1.0).
 *
 * These run without a database: the seed manifest, the integrity gate and the compiler are
 * pure. The database-bound behaviour (seed-once, publish, immutable revision) is exercised by
 * the last group, which skips itself unless DATABASE_URL points at a live Postgres.
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { buildCasioAuthoredPack } from "@/lib/analyzers/casio-ss/authored-pack";
import { mindsetGatePack } from "@/lib/analyzers/mindset-gate/instrument";
import {
  normalizedKeywordFormulaWeights,
  casioKeywordEdges,
} from "@/lib/analyzers/casio-ss/interpretation";
import { MIGRATION_FILES } from "@/db/migration-files";
import { buildGraphManifest, sliceManifestByDomain } from "./manifest";
import { compileKeywordFormulaWeights, compilePack, compileSections } from "./compile";
import { canPublish, errorsOnly, validateGraphManifest } from "./integrity";
import { canonicalJson, hashManifest, manifestDigest } from "./hash";
import { countManifest } from "./types";
import type { GraphManifest } from "./types";
import { buildGraphContext, overlayCausalEdges, overlayLayers, overlayTensors } from "./overlay";
import { CODE_GRAPH_CONTEXT } from "@/lib/analyzers/casio-ss/graph-context";
import { buildCasioReport } from "@/lib/analyzers/casio-ss/report";
import { scorePack } from "@/lib/analyzers/score";
import { layerCopy } from "@/lib/analyzers/casio-ss/interpretation";
import { KEYWORD_ONTOLOGY } from "@/lib/analyzers/casio-ss/ontology-graph";

const seed = buildGraphManifest();

test("seed manifest carries the whole canonical graph", () => {
  const counts = countManifest(seed);
  assert.equal(counts.sources, 55, "S001..S055 must all be declared");
  assert.equal(counts.keywords, 15, "20 FL questions measure 15 keywords");
  assert.equal(counts.subKeywords, 75, "15 keywords x 5 weighted sub-keywords");
  assert.equal(counts.layers, 5);
  assert.equal(counts.processes, 9, "C1..C9 solo-org core processes");
  assert.equal(counts.items, 107, "6 CTX + 20 FL + 15 SCR + 54 DIAG + 12 MND");
  assert.ok(counts.causalEdges > 0);
  assert.ok(counts.edges > 0);
  assert.equal(seed.ssotVersion, "HADIRAN-SSOT-2.0.0");
});

test("seed manifest passes the integrity gate with zero errors", () => {
  const issues = validateGraphManifest(seed);
  assert.deepEqual(errorsOnly(issues), [], `unexpected errors: ${JSON.stringify(errorsOnly(issues))}`);
  assert.ok(canPublish(issues));
});

test("every canonical code is unique across both domains", () => {
  const codes = seed.items.map((item) => item.canonicalCode);
  assert.equal(new Set(codes).size, codes.length);
  const keywordCodes = seed.keywords.map((keyword) => keyword.canonicalCode);
  assert.equal(new Set(keywordCodes).size, keywordCodes.length);
  const subCodes = seed.subKeywords.map((sub) => sub.canonicalCode);
  assert.equal(new Set(subCodes).size, subCodes.length);
});

test("items are distributed across the five tiers", () => {
  const byTier = new Map<string, number>();
  for (const item of seed.items) byTier.set(item.tier, (byTier.get(item.tier) ?? 0) + 1);
  assert.equal(byTier.get("BIZ"), 6);
  assert.equal(byTier.get("FL"), 20);
  assert.equal(byTier.get("SCR"), 15);
  assert.equal(byTier.get("DIAG"), 54);
  assert.equal(byTier.get("MND"), 12);
});

test("domain slice keeps each domain standalone but connected by shared references", () => {
  const casio = sliceManifestByDomain(seed, "DOM.CASIO_SS");
  const mind = sliceManifestByDomain(seed, "DOM.MINDSET_GATE");
  assert.equal(casio.items.length, 95);
  assert.equal(mind.items.length, 12);
  assert.equal(mind.causalEdges.length, 0, "the causal graph belongs to the diagnostic domain");
  assert.equal(casio.sources.length, seed.sources.length, "sources are declared globally");
});

test("the compiled pack is byte-identical to the published casio-ss instrument", () => {
  const compiled = compilePack(seed, buildCasioAuthoredPack());
  assert.deepEqual(compiled.pack, buildCasioAuthoredPack());
});

test("the compiled pack is byte-identical to the mindset-gate instrument", () => {
  const compiled = compilePack(seed, mindsetGatePack);
  assert.deepEqual(compiled.pack, mindsetGatePack);
});

test("compiled measurement matrix reproduces every keyword weight vector", () => {
  for (const keyword of seed.keywords) {
    const fromDb = compileKeywordFormulaWeights(keyword.legacyId, seed);
    const fromCode = normalizedKeywordFormulaWeights(keyword.legacyId);
    assert.deepEqual(fromDb, fromCode, `weights drifted for ${keyword.legacyId}`);
    assert.ok(fromCode.length > 0);
  }
});

test("compiled edge count matches the authored matrix, deep-dive bank excluded", () => {
  const sections = compileSections(seed, "DOM.CASIO_SS");
  const scoredItems = sections.filter((section) => section.id !== "business").flatMap((s) => s.items).length;
  const compiled = compilePack(seed, buildCasioAuthoredPack());
  assert.equal(compiled.pack.edges.length, scoredItems + casioKeywordEdges.length);
});

test("sections rebuild order and intros from item rows", () => {
  const sections = compileSections(seed, "DOM.CASIO_SS");
  assert.equal(sections.length, 6);
  assert.equal(sections[0]?.id, "business");
  assert.equal(typeof sections[0]?.introFa, "string", "section intro must survive the round trip");
  assert.equal(sections[0]?.items.length, 6);
  assert.equal(sections[1]?.items.length, 4);
});

test("manifest hashing is deterministic and content-sensitive", () => {
  const first = hashManifest(buildGraphManifest());
  const second = hashManifest(buildGraphManifest());
  assert.equal(first, second);
  assert.match(first, /^[0-9a-f]{64}$/);

  const edited: GraphManifest = {
    ...seed,
    edges: seed.edges.map((edge, index) => (index === 0 ? { ...edge, weight: edge.weight + 0.01 } : edge)),
  };
  assert.notEqual(hashManifest(edited), first, "a weight edit must change the fingerprint");
});

test("canonicalisation is key-order independent", () => {
  const a = canonicalJson({ b: 1, a: { d: 2, c: 3 } });
  const b = canonicalJson({ a: { c: 3, d: 2 }, b: 1 });
  assert.equal(a, b);
  assert.equal(a, '{"a":{"c":3,"d":2},"b":1}');
});

test("integrity gate blocks a publish when the graph is structurally broken", () => {
  const broken: GraphManifest = {
    ...seed,
    // An item that loads on nothing cannot move a single keyword score.
    edges: seed.edges.filter(
      (edge) => !(edge.edgeKind === "item_keyword" && edge.sourceCode === "ITM.FL.L1.Q1"),
    ),
  };
  const issues = validateGraphManifest(broken);
  assert.ok(errorsOnly(issues).length > 0);
  assert.equal(canPublish(issues), false);
  assert.ok(
    errorsOnly(issues).some((issue) => issue.code === "unloaded_item"),
    "the dropped loading must be reported as an error, not a warning",
  );
});

test("integrity gate refuses to invent research sources", () => {
  const broken: GraphManifest = {
    ...seed,
    keywords: seed.keywords.map((keyword, index) =>
      index === 0 ? { ...keyword, sourceCodes: [...keyword.sourceCodes, "SRC.S999"] } : keyword,
    ),
  };
  const issues = errorsOnly(validateGraphManifest(broken));
  assert.ok(issues.some((issue) => issue.code === "undeclared_source"));
});

test("integrity gate catches dangling measurement edges", () => {
  const broken: GraphManifest = {
    ...seed,
    edges: [...seed.edges, { ...seed.edges[0]!, targetCode: "KW.L9.K9" }],
  };
  const issues = errorsOnly(validateGraphManifest(broken));
  assert.ok(issues.some((issue) => issue.code === "dangling_target"));
});

test("integrity gate catches duplicate and orphan sub-keywords", () => {
  const broken: GraphManifest = {
    ...seed,
    subKeywords: [...seed.subKeywords, { ...seed.subKeywords[0]!, keywordCode: "KW.L5.K3" }],
  };
  const codes = errorsOnly(validateGraphManifest(broken)).map((issue) => issue.code);
  assert.ok(codes.includes("duplicate_sub_keyword"));
});

test("the graph migration ships inside the bundle the pre-start script applies", () => {
  const entry = MIGRATION_FILES.find((row) => row.id === "0030_ssot_graph.sql");
  assert.ok(entry, "0030 must be compiled into src/db/migration-files.ts");
  for (const table of [
    "ssot_graph_revision",
    "ssot_source",
    "ssot_concept",
    "ssot_process",
    "ssot_layer",
    "ssot_keyword",
    "ssot_sub_keyword",
    "ssot_item",
    "ssot_graph_edge",
    "ssot_causal_edge",
    "ssot_context_rule",
    "ssot_graph_audit",
  ]) {
    assert.match(entry.sql, new RegExp(`CREATE TABLE IF NOT EXISTS ${table}\\b`), `${table} missing`);
  }
  assert.match(entry.sql, /ssot_graph_audit_no_mutation/, "the audit journal must be append-only");
  assert.match(entry.sql, /ssot_graph_revision_no_republish/, "published revisions must be immutable");
  assert.match(entry.sql, /DELETE FROM analyzer_packs/, "clean break: the code-seeded projection is dropped");
});

test("digest binds counts to the hash so a tampered snapshot cannot pass as intact", () => {
  const withCounts = manifestDigest(seed);
  const edited: GraphManifest = { ...seed, items: seed.items.slice(0, -1) };
  const editedDigest = manifestDigest(edited);
  assert.notEqual(withCounts.hash, editedDigest.hash);
  assert.equal(withCounts.counts.items, seed.items.length);
  assert.equal(editedDigest.counts.items, seed.items.length - 1);
});

function baseAnswers(value = 5): Record<string, number | string> {
  const answers: Record<string, number | string> = {
    "BIZ.1": "شرکت نمونه",
    "BIZ.2": "service",
    "BIZ.3": "نرم‌افزار",
    "BIZ.4": "6-20",
    "BIZ.5": "3-5",
    "BIZ.6": "3-5",
  };
  for (let l = 1; l <= 5; l += 1) {
    for (let q = 1; q <= 4; q += 1) answers[`FL.L${l}.Q${q}`] = value;
  }
  return answers;
}

/**
 * A database row cannot hold `undefined`, so a key the code omits and a key the overlay sets to
 * `undefined` are the same fact. Comparing through JSON is the only way to ask "same content?"
 * without `deepStrictEqual` calling every absent key a drift.
 */
function jsonOf(value: unknown): unknown {
  return JSON.parse(JSON.stringify(value === undefined ? null : value));
}

/**
 * Compare only the fields the code actually authored, so overlay-only extras stay legal.
 * `questionIds` is excluded: the graph owns which items load a keyword, and the order of the
 * authored list carries no meaning, so it is asserted as a set above instead.
 */
function comparable(rebuilt: Record<string, unknown>, authored: object): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(authored)) {
    if (key === "questionIds") continue;
    const value = jsonOf((rebuilt as Record<string, unknown>)[key]);
    if (value !== null) out[key] = value;
  }
  return out;
}

test("the overlay rebuilds every layer, keyword and sub-keyword the engine reads", () => {
  const context = buildGraphContext(seed);
  assert.equal(context.layers.length, 5);
  assert.deepEqual(
    context.layers.map((layer) => layer.findingId),
    layerCopy.map((layer) => layer.findingId),
  );
  assert.equal(context.keywords.size, 15);
  for (const layer of layerCopy) {
    const rebuiltLayer = context.layers.find((candidate) => candidate.findingId === layer.findingId);
    assert.ok(rebuiltLayer, `${layer.findingId} missing from the overlay`);
    assert.deepEqual(
      comparable(rebuiltLayer as unknown as Record<string, unknown>, {
        yamlKey: layer.yamlKey,
        findingId: layer.findingId,
        titleFa: layer.titleFa,
        constructFa: layer.constructFa,
        asIsFa: layer.asIsFa,
        toBeFa: layer.toBeFa,
        actionsFa: layer.actionsFa,
      }),
      jsonOf({
        yamlKey: layer.yamlKey,
        findingId: layer.findingId,
        titleFa: layer.titleFa,
        constructFa: layer.constructFa,
        asIsFa: layer.asIsFa,
        toBeFa: layer.toBeFa,
        actionsFa: layer.actionsFa,
      }),
      `${layer.findingId} layer copy drifted`,
    );
    for (const keyword of layer.keywords) {
      const rebuilt = context.keywords.get(keyword.id);
      assert.ok(rebuilt, `${keyword.id} missing from the overlay`);
      assert.deepEqual(rebuilt.children, keyword.children, `${keyword.id} children drifted`);
      // Membership is what the graph owns; the authored list carries no meaningful order, and the
      // engine recomputes questionIds from the measurement edges anyway.
      assert.deepEqual(
        rebuilt.questionIds.slice().sort(),
        keyword.questionIds.slice().sort(),
        `${keyword.id} question set drifted`,
      );
      assert.deepEqual(
        comparable(rebuilt as unknown as Record<string, unknown>, keyword),
        comparable(keyword as unknown as Record<string, unknown>, keyword),
        `${keyword.id} keyword copy drifted`,
      );
      assert.deepEqual(
        (rebuilt.subKeywords ?? []).map((sub) => [sub.id, sub.titleFa, sub.weights]),
        (keyword.subKeywords ?? []).map((sub) => [sub.id, sub.titleFa, sub.weights]),
        `${keyword.id} sub-keyword weights drifted`,
      );
      // The ontology is read ahead of the copy, so it must round-trip as its own rows.
      assert.deepEqual(
        jsonOf(context.ontology(keyword.id)),
        jsonOf(KEYWORD_ONTOLOGY.find((entry) => entry.keywordId === keyword.id)),
        `${keyword.id} ontology drifted`,
      );
    }
  }
});

test("feeding the report engine the published graph changes nothing until an edit is made", () => {
  const pack = buildCasioAuthoredPack();
  const answers = baseAnswers(6);
  const scored = scorePack(pack, answers);
  const fromCode = buildCasioReport(pack, answers, scored, CODE_GRAPH_CONTEXT);
  const fromGraph = buildCasioReport(pack, answers, scored, buildGraphContext(seed));
  assert.deepEqual(fromGraph, fromCode, "the seed graph must reproduce the shipped report exactly");
  assert.equal(fromGraph.layers.length, 5);
});

test("a published causal edit changes who is the driver and who is the symptom", () => {
  const context = buildGraphContext(seed);
  const baseline = context.causalProfiles["L4-K3"];
  assert.ok(baseline);

  // Flatten the corrective loop into L2-K2 and watch the DEMATEL totals move.
  const edited: GraphManifest = {
    ...seed,
    causalEdges: seed.causalEdges.map((edge) =>
      edge.fromCode === "KW.L4.K3" && edge.toCode === "KW.L2.K2" ? { ...edge, weight: 1 } : edge,
    ),
  };
  const editedContext = buildGraphContext(edited);
  assert.notDeepEqual(
    editedContext.causalProfiles["L4-K3"],
    baseline,
    "strengthening a causal edge must change that keyword's driving power",
  );
  assert.notEqual(
    JSON.stringify(buildCasioReport(buildCasioAuthoredPack(), baseAnswers(6), null, editedContext)),
    JSON.stringify(buildCasioReport(buildCasioAuthoredPack(), baseAnswers(6), null, context)),
    "the report narrative must follow the published graph",
  );
});

test("a published context-tensor edit retunes intervention priority", () => {
  const tensors = overlayTensors(seed);
  assert.ok(Object.keys(tensors.size).length > 0, "size tensor must be rebuilt from rows");
  const before = tensors.size["6-20"]?.["L1-K2"] ?? 1;
  const edited: GraphManifest = {
    ...seed,
    contextRules: seed.contextRules.map((rule) =>
      rule.ruleKind === "size" && rule.contextCode === "6-20" && rule.targetCode === "KW.L1.K2"
        ? { ...rule, factor: before + 1.5 }
        : rule,
    ),
  };
  const after = overlayTensors(edited).size["6-20"]?.["L1-K2"] ?? 1;
  assert.equal(after, before + 1.5);
});

test("causal edges and their ISM levels come from rows, not from frozen constants", () => {
  const edges = overlayCausalEdges(seed);
  assert.equal(edges.length, seed.causalEdges.length);
  assert.ok(edges.every((edge) => edge.fromCanonicalCode.startsWith("KW.L")));
  assert.ok(edges.every((edge) => edge.mechanismFa.length > 0));
  const context = buildGraphContext(seed);
  for (const keyword of seed.keywords) {
    const profile = context.causalProfiles[keyword.legacyId];
    if (!profile || !keyword.ismLevel) continue;
    assert.equal(profile.ismLevel, keyword.ismLevel, `${keyword.legacyId} ISM level must come from the row`);
  }
});

// ── database-bound checks: skipped unless a live Postgres is configured ─────────
const live = process.env.DATABASE_URL ? test : test.skip;

live("seeding is idempotent: a second call never overwrites the graph", async () => {
  const { ensureGraphSeeded, graphIsSeeded } = await import("./repository");
  const first = await ensureGraphSeeded();
  assert.ok(first.counts.items > 0);
  assert.equal(await graphIsSeeded(), true);
  const second = await ensureGraphSeeded();
  assert.equal(second.seeded, false, "the seed must never run twice");
});

live("published revision compiles a projection the runtime can score", async () => {
  const { ensureGraphSeeded, loadDraftGraph, publishGraphDraft, latestPublishedRevision } = await import("./repository");
  await ensureGraphSeeded();
  const published = await publishGraphDraft({ domainCode: "DOM.CASIO_SS", noteFa: "test publish" });
  assert.equal(published.ok, true, JSON.stringify(published));
  const draft = await loadDraftGraph();
  assert.equal(hashManifest(draft), hashManifest(buildGraphManifest()), "the seeded draft must equal the code manifest");
  const revision = await latestPublishedRevision("DOM.CASIO_SS");
  assert.ok(revision);
  assert.equal(revision!.payloadHash.length, 64);
});
