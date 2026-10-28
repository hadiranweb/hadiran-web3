/**
 * Published graph → the context the report engine reads (HADIRAN-SSOT-2.1.0).
 *
 * This is the piece that makes "PostgreSQL is the source of truth" true for the *narrative*,
 * not only for the number. Before it, a published revision could change a keyword score while
 * the interpretation printed underneath it still came from a constant frozen in code.
 */

import { toCanonicalCode, fromCanonicalCode } from "@/lib/analyzers/casio-ss/coding-causal-graph";
import type { CausalKeywordEdge, KeywordCausalProfile } from "@/lib/analyzers/casio-ss/coding-causal-graph";
import {
  buildCanonicalKeywordCausalProfiles,
  KEYWORD_ISM_LEVELS,
} from "@/lib/analyzers/casio-ss/coding-causal-graph";
import {
  crossPatterns as codeCrossPatterns,
  layerBands as codeLayerBands,
  type LayerCopy,
  type LayerKeyword,
  type RummlerLevel,
  type SubKeywordDef,
} from "@/lib/analyzers/casio-ss/interpretation";
import type { BusinessTypeCode, ContextTensors, TeamSizeCode } from "@/lib/analyzers/casio-ss/context-modulation";
import type {
  KeywordOntologyEntry,
  ResearchSourceNode,
  VaultConceptNode,
} from "@/lib/analyzers/casio-ss/ontology-graph";
import type { CasioGraphContext } from "@/lib/analyzers/casio-ss/graph-context";
import { codeToSource, sourceToCode } from "./manifest";
import type { GraphManifest, KeywordRow } from "./types";

function keywordNoOf(row: KeywordRow): number {
  return row.keywordNo;
}

/** Sub-keyword weight vectors, in the published order, rebuilt from the edge rows. */
function subKeywordDefs(row: KeywordRow, manifest: GraphManifest): SubKeywordDef[] {
  return manifest.subKeywords
    .filter((sub) => sub.keywordCode === row.canonicalCode)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((sub) => ({
      id: sub.legacyId,
      titleFa: sub.labelFa,
      weights: manifest.edges
        .filter((edge) => edge.edgeKind === "sub_keyword_item" && edge.sourceCode === sub.canonicalCode)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((edge) => ({ item: fromCanonicalCode(edge.targetCode), weight: edge.weight })),
    }));
}

/** The FL questions loading on a keyword, ordered as the measurement matrix lists them. */
function questionIdsOf(row: KeywordRow, manifest: GraphManifest): string[] {
  return manifest.edges
    .filter(
      (edge) =>
        edge.edgeKind === "item_keyword" &&
        edge.targetCode === row.canonicalCode &&
        edge.sourceCode.startsWith("ITM.FL."),
    )
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((edge) => fromCanonicalCode(edge.sourceCode));
}

/** Rebuild the five-layer interpretation the report prints. */
export function overlayLayers(manifest: GraphManifest): LayerCopy[] {
  return manifest.layers
    .slice()
    .sort((a, b) => a.layerNo - b.layerNo)
    .map((layer) => {
      const keywords: LayerKeyword[] = manifest.keywords
        .filter((keyword) => keyword.domainCode === layer.domainCode && keyword.layerNo === layer.layerNo && keyword.active)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((keyword) => ({
          id: keyword.legacyId,
          canonicalCode: keyword.canonicalCode,
          titleFa: keyword.labelFa,
          children: subKeywordDefs(keyword, manifest).map((sub) => sub.titleFa),
          questionIds: questionIdsOf(keyword, manifest),
          ownerRoleFa: keyword.ownerRoleFa ?? undefined,
          horizonFa: (keyword.horizonFa as "کوتاه‌مدت" | "میان‌مدت" | undefined) ?? undefined,
          whyFa: keyword.whyFa ?? undefined,
          asIsWeakFa: keyword.asIsWeakFa ?? undefined,
          asIsGrowingFa: keyword.asIsGrowingFa ?? undefined,
          asIsStrongFa: keyword.asIsStrongFa ?? undefined,
          toBeFa: keyword.toBeFa ?? undefined,
          actionStepFa: keyword.actionStepFa ?? undefined,
          rummlerLevel: (keyword.rummlerLevel as RummlerLevel | null) ?? undefined,
          rummlerNeed: keyword.rummlerNeed ?? undefined,
          rummlerCellLabelFa: keyword.rummlerCellLabelFa ?? undefined,
          nadlerPairFa: keyword.nadlerPairFa ?? undefined,
          vaultConceptsFa: keyword.vaultRefs.length ? keyword.vaultRefs : undefined,
          sourceIds: keyword.sourceCodes.map(codeToSource),
          ismLevel: (keyword.ismLevel as 1 | 2 | 3 | 4 | 5 | null) ?? undefined,
          micmacQuadrant: (keyword.micmacQuadrant as LayerKeyword["micmacQuadrant"]) ?? undefined,
          subKeywords: subKeywordDefs(keyword, manifest),
        }));
      return {
        yamlKey: layer.yamlKey ?? "",
        findingId: layer.legacyId,
        titleFa: layer.titleFa,
        constructFa: layer.constructFa ?? "",
        asIsFa: layer.asIsFa ?? "",
        toBeFa: layer.toBeFa ?? "",
        actionsFa: layer.actionsFa ?? "",
        keywords,
      };
    });
}

/** Causal edges as the DEMATEL solver expects them. */
export function overlayCausalEdges(manifest: GraphManifest): CausalKeywordEdge[] {
  return manifest.causalEdges
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((edge) => ({
      id: edge.edgeKey,
      fromKeywordId: fromCanonicalCode(edge.fromCode),
      fromCanonicalCode: edge.fromCode,
      toKeywordId: fromCanonicalCode(edge.toCode),
      toCanonicalCode: edge.toCode,
      weight: edge.weight,
      edgeType: edge.edgeType,
      mechanismFa: edge.mechanismFa ?? "",
      sourceIds: edge.sourceCodes.map(codeToSource),
    }));
}

/** Context modulation tensor rebuilt from `ssot_context_rule`. */
export function overlayTensors(manifest: GraphManifest): ContextTensors {
  const size = {} as Record<TeamSizeCode, Record<string, number>>;
  const type = {} as Record<BusinessTypeCode, Record<string, number>>;
  for (const rule of manifest.contextRules) {
    const keywordId = fromCanonicalCode(rule.targetCode);
    if (rule.ruleKind === "size") {
      const code = rule.contextCode as TeamSizeCode;
      size[code] = { ...(size[code] ?? {}), [keywordId]: rule.factor };
    } else {
      const code = rule.contextCode as BusinessTypeCode;
      type[code] = { ...(type[code] ?? {}), [keywordId]: rule.factor };
    }
  }
  return { size, type };
}

/**
 * The ontology half of each keyword, from `ssot_keyword_ontology` — never from the keyword copy.
 * The report prefers these assertions over the fields the layer authored, so reading them off the
 * copy would silently rewrite which citation wins.
 */
function overlayOntology(manifest: GraphManifest): Map<string, KeywordOntologyEntry> {
  const legacyOf = new Map(manifest.keywords.map((keyword) => [keyword.canonicalCode, keyword.legacyId] as const));
  const map = new Map<string, KeywordOntologyEntry>();
  for (const entry of manifest.keywordOntology) {
    const keywordId = legacyOf.get(entry.keywordCode) ?? entry.keywordCode;
    map.set(keywordId, {
      keywordId,
      rummlerLevel: (entry.rummlerLevel ?? "process_whitespace") as RummlerLevel,
      rummlerNeed: (entry.rummlerNeed ?? "management") as KeywordOntologyEntry["rummlerNeed"],
      rummlerCellLabelFa: entry.rummlerCellLabelFa ?? "",
      nadlerPairFa: entry.nadlerPairFa ?? "",
      vaultConceptIds: [...entry.vaultRefs],
      sourceIds: entry.sourceCodes.map(codeToSource),
    });
  }
  return map;
}

export type OverlayInput = {
  revision: number | null;
  payloadHash: string | null;
};

/**
 * Build the engine context from a graph manifest. `bands` and `crossPatterns` still come from
 * code — they are document configuration, not graph, and are listed as the next migration.
 */
export function buildGraphContext(manifest: GraphManifest, origin: OverlayInput = { revision: null, payloadHash: null }): CasioGraphContext {
  const layers = overlayLayers(manifest);
  const titles: Record<string, string> = {};
  const keywords = new Map<string, LayerKeyword>();
  for (const layer of layers) {
    for (const keyword of layer.keywords) {
      titles[keyword.id] = keyword.titleFa;
      keywords.set(keyword.id, keyword);
    }
  }
  const causalEdges = overlayCausalEdges(manifest);
  const ismLevels: Record<string, 1 | 2 | 3 | 4 | 5> = { ...KEYWORD_ISM_LEVELS };
  for (const row of manifest.keywords) {
    if (row.ismLevel) ismLevels[row.legacyId] = row.ismLevel as 1 | 2 | 3 | 4 | 5;
  }
  const causalProfiles: Record<string, KeywordCausalProfile> = buildCanonicalKeywordCausalProfiles(
    titles,
    causalEdges,
    ismLevels,
  );
  const ontology = overlayOntology(manifest);
  // Keyed by the authored label, exactly like VAULT_CONCEPTS in code — not by the display title.
  const concepts = new Map(manifest.concepts.map((row) => [row.legacyId, row] as const));
  const sources = new Map(manifest.sources.map((row) => [row.legacyId, row] as const));

  return {
    origin: origin.revision == null ? "code" : "database",
    revision: origin.revision,
    payloadHash: origin.payloadHash,
    layers,
    keywords,
    titles,
    causalEdges,
    causalProfiles,
    bands: codeLayerBands,
    patterns: codeCrossPatterns,
    tensors: overlayTensors(manifest),
    ontology: (keywordId) => ontology.get(keywordId),
    resolvers: {
      ontology: (keywordId) => ontology.get(keywordId),
      conceptFor: (label): VaultConceptNode | undefined => {
        const row = concepts.get(label);
        if (!row) return undefined;
        return {
          id: row.canonicalCode,
          titleFa: row.labelFa,
          layerFamily: (row.model ?? "methodology") as VaultConceptNode["layerFamily"],
          summaryFa: row.summaryFa ?? "",
          sourceIds: row.sourceCodes.map(codeToSource),
        };
      },
      sourceFor: (id): ResearchSourceNode | undefined => {
        const row = sources.get(id);
        if (!row) return undefined;
        return {
          id: row.legacyId,
          shortCitation: row.locator ?? row.canonicalCode,
          titleFa: row.title,
          coreTakeawayFa: row.claimFa ?? "",
        };
      },
    },
  };
}

export { sourceToCode, toCanonicalCode };
