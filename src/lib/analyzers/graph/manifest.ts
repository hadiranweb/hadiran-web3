/**
 * The repository seed manifest (HADIRAN-SSOT-2.1.0).
 *
 * This module is the ONLY place the canonical graph is authored in code, and it is a
 * one-way seed: `ensureGraphSeeded()` inserts it when a domain has no rows yet and never
 * overwrites afterwards. From that point on PostgreSQL is the source of truth and the
 * workspace editor is the writer.
 *
 * Everything here is read from the existing engine constants, so seeding cannot drift
 * from the instrument that shipped — `graph.test.ts` asserts the round trip.
 */

import { itemsOf, type AnalyzerPack } from "@/lib/analyzers/pack";
import { buildCasioAuthoredPack } from "@/lib/analyzers/casio-ss/authored-pack";
import { mindsetGatePack } from "@/lib/analyzers/mindset-gate/instrument";
import {
  CAUSAL_KEYWORD_EDGES,
  CODING_STANDARD_VERSION,
  KEYWORD_ISM_LEVELS,
  toCanonicalCode,
} from "@/lib/analyzers/casio-ss/coding-causal-graph";
import {
  SOLO_CORE_PROCESSES,
  SIZE_WEIGHT_MATRIX,
  TYPE_WEIGHT_MATRIX,
} from "@/lib/analyzers/casio-ss/context-modulation";
import { DIAG_DIMENSIONS, SCR_ITEMS } from "@/lib/analyzers/casio-ss/deep-dive-a3";
import {
  casioKeywordEdges,
  layerCopy,
  type LayerKeyword,
} from "@/lib/analyzers/casio-ss/interpretation";
import {
  KEYWORD_ONTOLOGY,
  RESEARCH_SOURCES,
  VAULT_CONCEPTS,
} from "@/lib/analyzers/casio-ss/ontology-graph";
import { HADIRAN_SSOT_VERSION } from "@/lib/analyzers/ssot-registry";
import type {
  ConceptRow,
  GraphEdgeRow,
  GraphManifest,
  ItemRow,
  KeywordRow,
  LayerRow,
  ProcessRow,
  SsotDomainCode,
  SubKeywordRow,
} from "./types";

export const GRAPH_SEED_VERSION = HADIRAN_SSOT_VERSION;
export const GRAPH_CODING_VERSION = CODING_STANDARD_VERSION;

/** Source ids stay readable: `S036` ⇄ `SRC.S036`. */
export function sourceToCode(sourceId: string): string {
  return sourceId.startsWith("SRC.") ? sourceId : `SRC.${sourceId}`;
}

export function codeToSource(code: string): string {
  return code.replace(/^SRC\./, "");
}

function layerCodeFor(layerNo: number): string {
  return `LYR.L${layerNo}`;
}

function keywordCodesOf(keyword: LayerKeyword, layerNo: number): string[] {
  return keyword.children.map((_, index) => `SKW.L${layerNo}.K${keywordIndex(keyword)}.S${index + 1}`);
}

function keywordIndex(keyword: LayerKeyword): number {
  const match = keyword.id.match(/^L\d-K(\d+)$/);
  return match ? Number(match[1]) : 1;
}

function domainOfPack(pack: AnalyzerPack): SsotDomainCode {
  return pack.slug === "casio-ss" ? "DOM.CASIO_SS" : "DOM.MINDSET_GATE";
}

function tierOfItem(legacyId: string): ItemRow["tier"] {
  if (legacyId.startsWith("BIZ.")) return "BIZ";
  if (legacyId.startsWith("FL.")) return "FL";
  if (legacyId.startsWith("SCR.")) return "SCR";
  if (legacyId.startsWith("DIAG.")) return "DIAG";
  return "MND";
}

function layerNoOfItem(legacyId: string): number | null {
  const match = legacyId.match(/^FL\.L(\d)\./);
  return match ? Number(match[1]) : null;
}

/** Items that belong to a published pack: the answer sheet the respondent sees. */
function itemRowsFromPack(pack: AnalyzerPack): ItemRow[] {
  const domainCode = domainOfPack(pack);
  const rows: ItemRow[] = [];
  let order = 0;
  for (const section of pack.sections) {
    for (const item of section.items) {
      const legacyId = item.id;
      const tier = tierOfItem(legacyId);
      rows.push({
        canonicalCode: toCanonicalCode(legacyId),
        legacyId,
        axis: tier === "BIZ" ? "CTX" : "ITM",
        tier,
        domainCode,
        layerNo: layerNoOfItem(legacyId),
        dimensionCode: null,
        sectionId: section.id,
        sectionTitleFa: section.titleFa ?? null,
        sectionIntroFa: section.introFa ?? null,
        textFa: item.text,
        helpFa: null,
        reverse: item.kind === "range" ? item.reverse : false,
        kind: item.kind,
        scaleMin: 0,
        scaleMax: 10,
        critical: false,
        anchors: item.kind === "range" ? item.anchors : null,
        options: item.kind === "choice" ? item.options : null,
        maxLength: item.kind === "text" ? item.maxLength : null,
        routing: null,
        sourceCodes: [],
        sortOrder: order++,
        active: true,
      });
    }
  }
  return rows;
}

/**
 * The deep-dive bank (15 screening + 54 diagnostic items) never enters `pack.sections`;
 * it is the routed follow-up the Stage 5 engine asks. It is still an item, so it is stored
 * as one — otherwise the editor could not change a question without a code release.
 */
function deepDiveItemRows(): { items: ItemRow[]; edges: GraphEdgeRow[] } {
  const items: ItemRow[] = [];
  const edges: GraphEdgeRow[] = [];
  let order = 0;

  for (const scr of SCR_ITEMS) {
    const code = toCanonicalCode(scr.id);
    items.push({
      canonicalCode: code,
      legacyId: scr.id,
      axis: "ITM",
      tier: "SCR",
      domainCode: "DOM.CASIO_SS",
      layerNo: null,
      dimensionCode: null,
      sectionId: "screening",
      sectionTitleFa: "غربالگری سریع",
      sectionIntroFa: null,
      textFa: scr.text,
      helpFa: null,
      reverse: Boolean(scr.reverse),
      kind: "range",
      scaleMin: 0,
      scaleMax: 10,
      critical: Boolean(scr.critical),
      anchors: null,
      options: null,
      maxLength: null,
      routing: null,
      sourceCodes: [],
      sortOrder: order++,
      active: true,
    });
    scr.keywordWeights.forEach((link, index) => {
      edges.push({
        domainCode: "DOM.CASIO_SS",
        edgeKind: "item_keyword",
        sourceCode: code,
        sourceKind: "ITM",
        targetCode: toCanonicalCode(link.keywordId),
        targetKind: "KW",
        weight: link.weight,
        transform: "identity",
        sortOrder: index,
        rationaleFa: null,
      });
    });
  }

  DIAG_DIMENSIONS.forEach((dimension, dimensionIndex) => {
    const dimensionCode = `DIM.D${dimensionIndex + 1}`;
    dimension.keywordLinks.forEach((link, index) => {
      edges.push({
        domainCode: "DOM.CASIO_SS",
        edgeKind: "dimension_keyword",
        sourceCode: dimensionCode,
        sourceKind: "DIM",
        targetCode: toCanonicalCode(link.keywordId),
        targetKind: "KW",
        weight: link.weight,
        transform: "identity",
        sortOrder: index,
        rationaleFa: null,
      });
    });
    for (const diag of dimension.items) {
      const code = toCanonicalCode(diag.id);
      items.push({
        canonicalCode: code,
        legacyId: diag.id,
        axis: "ITM",
        tier: "DIAG",
        domainCode: "DOM.CASIO_SS",
        layerNo: null,
        dimensionCode,
        sectionId: `deep-dive-${dimension.id}`,
        sectionTitleFa: dimension.titleFa,
        sectionIntroFa: dimension.summaryFa,
        textFa: diag.text,
        helpFa: null,
        reverse: Boolean(diag.reverse),
        kind: "range",
        scaleMin: 0,
        scaleMax: 10,
        critical: Boolean(diag.critical),
        anchors: null,
        options: null,
        maxLength: null,
        routing: null,
        sourceCodes: dimension.sourceIds.map(sourceToCode),
        sortOrder: order++,
        active: true,
      });
      diag.keywordWeights.forEach((link, index) => {
        edges.push({
          domainCode: "DOM.CASIO_SS",
          edgeKind: "item_keyword",
          sourceCode: code,
          sourceKind: "ITM",
          targetCode: toCanonicalCode(link.keywordId),
          targetKind: "KW",
          weight: link.weight,
          transform: "identity",
          sortOrder: index,
          rationaleFa: null,
        });
      });
    }
  });

  return { items, edges };
}

/**
 * `casioKeywordEdges` is the measurement matrix: keyword -> layer structural links plus
 * the item -> keyword loadings. Order is preserved because the compiled weight vectors
 * must match the published instrument byte for byte.
 */
/**
 * `casioKeywordEdges` is a single ordered array: structural links first, then the loadings.
 * sort_order keeps that original index for every row, so the compiled array (and therefore
 * every normalised weight vector) is reproduced byte for byte.
 */
function measurementEdgeRows(): GraphEdgeRow[] {
  const rows: GraphEdgeRow[] = [];
  casioKeywordEdges.forEach((edge, index) => {
    const structural = edge.to.startsWith("layer-");
    rows.push({
      domainCode: "DOM.CASIO_SS",
      edgeKind: structural ? "keyword_layer" : "item_keyword",
      sourceCode: toCanonicalCode(edge.from),
      sourceKind: structural ? "KW" : "ITM",
      targetCode: toCanonicalCode(edge.to),
      targetKind: structural ? "LAYER" : "KW",
      weight: edge.weight,
      transform: structural ? "identity" : edge.transform,
      sortOrder: index,
      rationaleFa: null,
    });
  });
  return rows;
}

function subKeywordRows(): { rows: SubKeywordRow[]; edges: GraphEdgeRow[] } {
  const rows: SubKeywordRow[] = [];
  const edges: GraphEdgeRow[] = [];
  for (const layer of layerCopy) {
    for (const keyword of layer.keywords) {
      const keywordCode = toCanonicalCode(keyword.id);
      (keyword.subKeywords ?? []).forEach((sub, index) => {
        const code = `SKW.L${layerNoOfKeyword(keyword)}.K${keywordIndex(keyword)}.S${index + 1}`;
        rows.push({
          canonicalCode: code,
          legacyId: sub.id,
          keywordCode,
          subNo: index + 1,
          labelFa: sub.titleFa,
          sortOrder: index,
        });
        sub.weights.forEach((weight, weightIndex) => {
          edges.push({
            domainCode: "DOM.CASIO_SS",
            edgeKind: "sub_keyword_item",
            sourceCode: code,
            sourceKind: "SKW",
            targetCode: toCanonicalCode(weight.item),
            targetKind: "ITM",
            weight: weight.weight,
            transform: "identity",
            sortOrder: weightIndex,
            rationaleFa: null,
          });
        });
        edges.push({
          domainCode: "DOM.CASIO_SS",
          edgeKind: "keyword_sub_keyword",
          sourceCode: keywordCode,
          sourceKind: "KW",
          targetCode: code,
          targetKind: "SKW",
          weight: 1,
          transform: "identity",
          sortOrder: index,
          rationaleFa: null,
        });
      });
    }
  }
  return { rows, edges };
}

/**
 * The ontology half of a keyword. `layerCopy` carries what the report prints; this carries how
 * the keyword is classified (Rummler cell, Nadler pair) and which sources back that claim.
 * The engine consults this first, so it is stored as its own rows rather than folded into the
 * keyword copy — whichever was written last would otherwise decide what wins.
 */
function keywordOntologyRows(): GraphManifest["keywordOntology"] {
  const keywordCodes = new Map(
    layerCopy.flatMap((layer) => layer.keywords.map((kw) => [kw.id, toCanonicalCode(kw.id)] as const)),
  );
  return KEYWORD_ONTOLOGY.filter((entry) => keywordCodes.has(entry.keywordId)).map((entry) => ({
    keywordCode: keywordCodes.get(entry.keywordId)!,
    rummlerLevel: entry.rummlerLevel,
    rummlerNeed: entry.rummlerNeed,
    rummlerCellLabelFa: entry.rummlerCellLabelFa,
    nadlerPairFa: entry.nadlerPairFa,
    vaultRefs: [...entry.vaultConceptIds],
    sourceCodes: entry.sourceIds.map(sourceToCode),
  }));
}

function layerNoOfKeyword(keyword: LayerKeyword): number {
  const match = keyword.id.match(/^L(\d)-K\d+$/);
  return match ? Number(match[1]) : 1;
}

function keywordRows(): KeywordRow[] {
  const rows: KeywordRow[] = [];
  let order = 0;
  for (const layer of layerCopy) {
    for (const keyword of layer.keywords) {
      rows.push({
        canonicalCode: toCanonicalCode(keyword.id),
        legacyId: keyword.id,
        domainCode: "DOM.CASIO_SS",
        layerCode: layerCodeFor(layerNoOfKeyword(keyword)),
        layerNo: layerNoOfKeyword(keyword),
        keywordNo: keywordIndex(keyword),
        labelFa: keyword.titleFa,
        constructFa: null,
        ownerRoleFa: keyword.ownerRoleFa ?? null,
        horizonFa: keyword.horizonFa ?? null,
        whyFa: keyword.whyFa ?? null,
        asIsWeakFa: keyword.asIsWeakFa ?? null,
        asIsGrowingFa: keyword.asIsGrowingFa ?? null,
        asIsStrongFa: keyword.asIsStrongFa ?? null,
        toBeFa: keyword.toBeFa ?? null,
        actionStepFa: keyword.actionStepFa ?? null,
        rummlerLevel: keyword.rummlerLevel ?? null,
        rummlerNeed: keyword.rummlerNeed ?? null,
        rummlerCellLabelFa: keyword.rummlerCellLabelFa ?? null,
        nadlerPairFa: keyword.nadlerPairFa ?? null,
        vaultRefs: [...(keyword.vaultConceptsFa ?? [])],
        sourceCodes: (keyword.sourceIds ?? []).map(sourceToCode),
        ismLevel: KEYWORD_ISM_LEVELS[keyword.id] ?? null,
        micmacQuadrant: null,
        active: true,
        sortOrder: order++,
      });
    }
  }
  return rows;
}

function layerRows(): LayerRow[] {
  const pack = buildCasioAuthoredPack();
  const findingById = new Map(pack.findings.map((finding) => [finding.id, finding]));
  return layerCopy.map((layer, index) => {
    const finding = findingById.get(layer.findingId);
    return {
      canonicalCode: layerCodeFor(index + 1),
      legacyId: layer.findingId,
      domainCode: "DOM.CASIO_SS",
      layerNo: index + 1,
      yamlKey: layer.yamlKey,
      titleFa: finding?.titleFa ?? layer.titleFa,
      constructFa: layer.constructFa,
      asIsFa: layer.asIsFa,
      toBeFa: layer.toBeFa,
      actionsFa: layer.actionsFa,
      active: true,
    };
  });
}

function contextRuleRows() {
  const rows: GraphManifest["contextRules"] = [];
  for (const [sizeCode, weights] of Object.entries(SIZE_WEIGHT_MATRIX)) {
    for (const [keywordId, factor] of Object.entries(weights)) {
      rows.push({
        ruleKind: "size",
        contextCode: sizeCode,
        targetCode: toCanonicalCode(keywordId),
        factor,
        noteFa: null,
      });
    }
  }
  for (const [typeCode, weights] of Object.entries(TYPE_WEIGHT_MATRIX)) {
    for (const [keywordId, factor] of Object.entries(weights)) {
      rows.push({
        ruleKind: "type",
        contextCode: typeCode,
        targetCode: toCanonicalCode(keywordId),
        factor,
        noteFa: null,
      });
    }
  }
  return rows;
}

/**
 * The full seed manifest. Deterministic: same code, same rows, same order, same hash.
 */
export function buildGraphManifest(): GraphManifest {
  const casio = buildCasioAuthoredPack();
  const mindset = mindsetGatePack;
  const sub = subKeywordRows();
  const deep = deepDiveItemRows();

  const sources: GraphManifest["sources"] = Object.values(RESEARCH_SOURCES).map((source) => ({
    canonicalCode: sourceToCode(source.id),
    legacyId: source.id,
    title: source.titleFa,
    authors: null,
    year: null,
    kind: "paper" as const,
    locator: source.shortCitation,
    claimFa: source.coreTakeawayFa,
  }));

  const concepts: ConceptRow[] = Object.entries(VAULT_CONCEPTS).map(([authoredLabel, concept]) => ({
    canonicalCode: concept.id,
    legacyId: authoredLabel,
    labelFa: concept.titleFa,
    summaryFa: concept.summaryFa,
    model: concept.layerFamily,
    sourceCodes: concept.sourceIds.map(sourceToCode),
  }));

  const processes: ProcessRow[] = SOLO_CORE_PROCESSES.map((process) => ({
    canonicalCode: process.canonicalCode,
    legacyId: process.id,
    labelFa: process.titleFa,
    summaryFa: null,
    keywordCodes: process.linkedKeywords.map(toCanonicalCode),
  }));

  const causalEdges: GraphManifest["causalEdges"] = CAUSAL_KEYWORD_EDGES.map((edge, index) => ({
    edgeKey: edge.id,
    domainCode: "DOM.CASIO_SS",
    fromCode: edge.fromCanonicalCode,
    toCode: edge.toCanonicalCode,
    weight: edge.weight,
    edgeType: edge.edgeType,
    ismLevel: KEYWORD_ISM_LEVELS[edge.toKeywordId] ?? null,
    mechanismFa: edge.mechanismFa,
    sourceCodes: edge.sourceIds.map(sourceToCode),
    sortOrder: index,
  }));

  return {
    ssotVersion: GRAPH_SEED_VERSION,
    codingVersion: GRAPH_CODING_VERSION,
    sources,
    concepts,
    processes,
    layers: layerRows(),
    keywords: keywordRows(),
    keywordOntology: keywordOntologyRows(),
    subKeywords: sub.rows,
    items: [...itemRowsFromPack(casio), ...itemRowsFromPack(mindset), ...deep.items],
    edges: [...measurementEdgeRows(), ...sub.edges, ...deep.edges],
    causalEdges,
    contextRules: contextRuleRows(),
  };
}

/** Only the rows a single domain owns; shared references stay global. */
export function sliceManifestByDomain(manifest: GraphManifest, domainCode: SsotDomainCode): GraphManifest {
  const keywordCodes = new Set(
    manifest.keywords.filter((row) => row.domainCode === domainCode).map((row) => row.canonicalCode),
  );
  return {
    ...manifest,
    layers: manifest.layers.filter((row) => row.domainCode === domainCode),
    keywords: manifest.keywords.filter((row) => row.domainCode === domainCode),
    keywordOntology: (() => {
      const codes = new Set(
        manifest.keywords.filter((row) => row.domainCode === domainCode).map((row) => row.canonicalCode),
      );
      return manifest.keywordOntology.filter((row) => codes.has(row.keywordCode));
    })(),
    subKeywords: manifest.subKeywords.filter((row) => keywordCodes.has(row.keywordCode)),
    items: manifest.items.filter((row) => row.domainCode === domainCode),
    edges: manifest.edges.filter((row) => row.domainCode === domainCode),
    causalEdges: manifest.causalEdges.filter((row) => row.domainCode === domainCode),
    contextRules: manifest.contextRules.filter((row) => {
      const target = row.targetCode;
      return keywordCodes.size === 0 ? true : keywordCodes.has(target);
    }),
  };
}

export { itemsOf };
