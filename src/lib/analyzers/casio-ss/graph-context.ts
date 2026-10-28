/**
 * The graph the reporting engine reads (HADIRAN-SSOT-2.1.0).
 *
 * Until now the report engine reached for module constants (`layerCopy`,
 * `BASE_CAUSAL_PROFILES`, the weight matrices) — which meant the published revision in
 * PostgreSQL could change a score but not the interpretation printed under it. Threading one
 * context object through the engine removes that split: the same rows the editor writes are
 * the rows the report reads.
 *
 * `CODE_GRAPH_CONTEXT` is the fallback for a database that is absent or not yet seeded.
 * Lives in its own module so report.ts, the overlay and the runtime cache can all depend on it
 * without importing each other.
 */

import {
  crossPatterns as codeCrossPatterns,
  layerBands as codeLayerBands,
  layerCopy as codeLayerCopy,
  type CrossPattern,
  type LayerBand,
  type LayerCopy,
  type LayerKeyword,
  type RummlerLevel,
} from "./interpretation";
import {
  CODE_CONTEXT_TENSORS,
  type ContextTensors,
} from "./context-modulation";
import {
  CAUSAL_KEYWORD_EDGES,
  KEYWORD_ISM_LEVELS,
  buildCanonicalKeywordCausalProfiles,
  type CausalKeywordEdge,
  type KeywordCausalProfile,
} from "./coding-causal-graph";
import {
  CODE_ONTOLOGY_RESOLVERS,
  KEYWORD_ONTOLOGY,
  VAULT_CONCEPTS,
  RESEARCH_SOURCES,
  type KeywordOntologyEntry,
  type OntologyGraphResolvers,
} from "./ontology-graph";

export type CasioGraphContext = {
  /** Which graph produced this view — the shipped code or a published revision. */
  origin: "code" | "database";
  revision: number | null;
  payloadHash: string | null;
  layers: LayerCopy[];
  keywords: Map<string, LayerKeyword>;
  titles: Record<string, string>;
  causalEdges: CausalKeywordEdge[];
  causalProfiles: Record<string, KeywordCausalProfile>;
  bands: LayerBand[];
  patterns: CrossPattern[];
  tensors: ContextTensors;
  ontology(keywordId: string): KeywordOntologyEntry | undefined;
  resolvers: OntologyGraphResolvers;
};

const codeOntology = new Map<string, KeywordOntologyEntry>(
  KEYWORD_ONTOLOGY.map((entry) => [entry.keywordId, entry] as const),
);

/** Exactly what the engine used before the database owned the graph — the behaviour-preserving default. */
export const CODE_GRAPH_CONTEXT: CasioGraphContext = {
  origin: "code",
  revision: null,
  payloadHash: null,
  layers: codeLayerCopy,
  keywords: new Map(
    codeLayerCopy.flatMap((layer) => layer.keywords.map((kw) => [kw.id, kw] as const)),
  ),
  titles: Object.fromEntries(
    codeLayerCopy.flatMap((layer) => layer.keywords.map((kw) => [kw.id, kw.titleFa] as const)),
  ),
  causalEdges: CAUSAL_KEYWORD_EDGES,
  causalProfiles: buildCanonicalKeywordCausalProfiles(
    Object.fromEntries(
      codeLayerCopy.flatMap((layer) => layer.keywords.map((kw) => [kw.id, kw.titleFa] as const)),
    ),
  ),
  bands: codeLayerBands,
  patterns: codeCrossPatterns,
  tensors: CODE_CONTEXT_TENSORS,
  ontology: (keywordId) => codeOntology.get(keywordId),
  resolvers: {
    ...CODE_ONTOLOGY_RESOLVERS,
    ontology: (keywordId) => codeOntology.get(keywordId),
  },
};

export const CODE_ISM_LEVELS = KEYWORD_ISM_LEVELS;

/**
 * The context the engine reads right now, as a slot owned by this module.
 *
 * Deliberately not an import of the DB-backed runtime: `report.ts` is reached from client
 * components, and importing `graph/runtime.ts` here would drag `repository.ts` and `pg` into the
 * browser bundle (Turbopack fails the build on `dns`/`fs`). So the server side pushes the warmed
 * published graph in, and this module stays free of any database dependency.
 *
 * A component instance in the browser never warms it and therefore reads `CODE_GRAPH_CONTEXT` —
 * the same constants the shipped engine used before this split. Persisted reports are always
 * built server-side, which is where a published revision is in play.
 */
let activeContext: CasioGraphContext | null = null;

export function setActiveGraphContext(context: CasioGraphContext | null): void {
  activeContext = context;
}

/** `buildCasioReport`'s default: the published graph if one was warmed, else the code graph. */
export function currentGraphContext(): CasioGraphContext {
  return activeContext ?? CODE_GRAPH_CONTEXT;
}
