/**
 * Row shapes of the canonical diagnostic graph (HADIRAN-SSOT-2.1.0).
 *
 * These mirror the `ssot_*` tables one-to-one. The manifest is what the code seeds once
 * and what the workspace editor reads/writes afterwards: after the first insert the
 * database owns the content, this module only owns its shape.
 */

export type SsotDomainCode = "DOM.CASIO_SS" | "DOM.MINDSET_GATE";

export type SourceRow = {
  canonicalCode: string;
  legacyId: string;
  title: string;
  authors: string | null;
  year: number | null;
  kind: "paper" | "book" | "framework" | "tool" | "report" | "dataset";
  locator: string | null;
  claimFa: string | null;
};

export type ConceptRow = {
  canonicalCode: string;
  labelFa: string;
  summaryFa: string | null;
  model: string | null;
  sourceCodes: string[];
};

export type ProcessRow = {
  canonicalCode: string;
  legacyId: string;
  labelFa: string;
  summaryFa: string | null;
  keywordCodes: string[];
};

export type LayerRow = {
  canonicalCode: string;
  /** The finding id the runtime scores by, e.g. `layer-foundation`. */
  legacyId: string;
  domainCode: SsotDomainCode;
  layerNo: number;
  yamlKey: string | null;
  titleFa: string;
  constructFa: string | null;
  asIsFa: string | null;
  toBeFa: string | null;
  actionsFa: string | null;
  active: boolean;
};

export type KeywordRow = {
  canonicalCode: string;
  legacyId: string;
  domainCode: SsotDomainCode;
  layerCode: string | null;
  layerNo: number;
  keywordNo: number;
  labelFa: string;
  constructFa: string | null;
  ownerRoleFa: string | null;
  horizonFa: string | null;
  whyFa: string | null;
  asIsWeakFa: string | null;
  asIsGrowingFa: string | null;
  asIsStrongFa: string | null;
  toBeFa: string | null;
  actionStepFa: string | null;
  rummlerLevel: "organization" | "process_whitespace" | "job_performer" | null;
  rummlerNeed: "goals" | "design" | "management" | null;
  rummlerCellLabelFa: string | null;
  nadlerPairFa: string | null;
  vaultCodes: string[];
  sourceCodes: string[];
  ismLevel: number | null;
  micmacQuadrant: string | null;
  active: boolean;
  sortOrder: number;
};

export type SubKeywordRow = {
  canonicalCode: string;
  legacyId: string;
  keywordCode: string;
  subNo: number;
  labelFa: string;
  sortOrder: number;
};

export type ItemTier = "BIZ" | "FL" | "SCR" | "DIAG" | "MND";

export type ItemRow = {
  canonicalCode: string;
  legacyId: string;
  axis: "CTX" | "ITM";
  tier: ItemTier;
  domainCode: SsotDomainCode;
  layerNo: number | null;
  dimensionCode: string | null;
  sectionId: string;
  sectionTitleFa: string | null;
  sectionIntroFa: string | null;
  textFa: string;
  helpFa: string | null;
  reverse: boolean;
  kind: "range" | "text" | "choice";
  scaleMin: number;
  scaleMax: number;
  critical: boolean;
  anchors: { 0: string; 5: string; 10: string } | null;
  options: { value: string; label: string }[] | null;
  maxLength: number | null;
  routing: Record<string, unknown> | null;
  sourceCodes: string[];
  sortOrder: number;
  active: boolean;
};

export type EdgeKind =
  | "item_keyword"
  | "keyword_sub_keyword"
  | "sub_keyword_item"
  | "keyword_layer"
  | "dimension_keyword";

/** One loading in the many-to-many measurement network. */
export type GraphEdgeRow = {
  domainCode: SsotDomainCode;
  edgeKind: EdgeKind;
  sourceCode: string;
  sourceKind: "ITM" | "KW" | "SKW" | "DIM";
  targetCode: string;
  targetKind: "KW" | "SKW" | "LAYER" | "ITM";
  weight: number;
  transform: "identity" | "reverse";
  /** Preserves the published order of a weight vector — scoring is order-sensitive. */
  sortOrder: number;
  rationaleFa: string | null;
};

export type CausalEdgeRow = {
  edgeKey: string;
  domainCode: SsotDomainCode;
  fromCode: string;
  toCode: string;
  weight: number;
  edgeType: "prerequisite" | "cybernetic_feedback" | "reinforcing";
  ismLevel: number | null;
  mechanismFa: string | null;
  sourceCodes: string[];
  sortOrder: number;
};

export type ContextRuleRow = {
  ruleKind: "size" | "type";
  contextCode: string;
  targetCode: string;
  factor: number;
  noteFa: string | null;
};

export type GraphManifest = {
  ssotVersion: string;
  codingVersion: string;
  sources: SourceRow[];
  concepts: ConceptRow[];
  processes: ProcessRow[];
  layers: LayerRow[];
  keywords: KeywordRow[];
  subKeywords: SubKeywordRow[];
  items: ItemRow[];
  edges: GraphEdgeRow[];
  causalEdges: CausalEdgeRow[];
  contextRules: ContextRuleRow[];
};

export type ManifestCounts = {
  sources: number;
  concepts: number;
  processes: number;
  layers: number;
  keywords: number;
  subKeywords: number;
  items: number;
  edges: number;
  causalEdges: number;
  contextRules: number;
};

export type IntegrityIssue = {
  level: "error" | "warning";
  code: string;
  entity: string;
  messageFa: string;
};

export function countManifest(manifest: GraphManifest): ManifestCounts {
  return {
    sources: manifest.sources.length,
    concepts: manifest.concepts.length,
    processes: manifest.processes.length,
    layers: manifest.layers.length,
    keywords: manifest.keywords.length,
    subKeywords: manifest.subKeywords.length,
    items: manifest.items.length,
    edges: manifest.edges.length,
    causalEdges: manifest.causalEdges.length,
    contextRules: manifest.contextRules.length,
  };
}
