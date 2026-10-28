/**
 * Graph → pack compiler.
 *
 * The runtime (score.ts, report.ts, document-model.ts) consumes `AnalyzerPack`. Rather than
 * rewrite every consumer, the compiled projection is written back into `analyzer_packs.pack`.
 * That keeps the pack a disposable read model and the `ssot_*` tables the only authority:
 * an editor change flows through here, and scoring follows without a code release.
 */

import {
  edgesFromScoredSections,
  type AnalyzerPack,
  type ChoiceItem,
  type Finding,
  type Item,
  type RangeItem,
  type Section,
  type TextItem,
} from "@/lib/analyzers/pack";
import { fromCanonicalCode, toCanonicalCode } from "@/lib/analyzers/casio-ss/coding-causal-graph";
import type { GraphManifest, ItemRow, KeywordRow, SsotDomainCode } from "./types";

export type CompiledGraph = {
  pack: AnalyzerPack;
  /** The measurement matrix as the engine saw it, exposed for tests and the editor preview. */
  keywordEdges: { from: string; to: string; weight: number; transform: "identity" }[];
};

function itemFromRow(row: ItemRow): Item {
  if (row.kind === "text") {
    const item: TextItem = { kind: "text", id: row.legacyId, text: row.textFa, maxLength: row.maxLength ?? 500 };
    return item;
  }
  if (row.kind === "choice") {
    const choice: ChoiceItem = {
      kind: "choice",
      id: row.legacyId,
      text: row.textFa,
      options: row.options ?? [],
    };
    return choice;
  }
  const range: RangeItem = {
    kind: "range",
    id: row.legacyId,
    text: row.textFa,
    reverse: row.reverse,
    anchors: row.anchors ?? { 0: "", 5: "", 10: "" },
  };
  return range;
}

/** Rebuild the answer sheet: section membership and item order both come from the rows. */
export function compileSections(manifest: GraphManifest, domainCode: SsotDomainCode): Section[] {
  const rows = manifest.items
    .filter((item) => item.domainCode === domainCode && item.active && item.tier !== "SCR" && item.tier !== "DIAG")
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const sections: Section[] = [];
  const indexBySection = new Map<string, number>();
  for (const row of rows) {
    const existing = indexBySection.get(row.sectionId);
    if (existing == null) {
      indexBySection.set(row.sectionId, sections.length);
      const section: Section = { id: row.sectionId, titleFa: row.sectionTitleFa ?? "", items: [itemFromRow(row)] };
      // Only emit introFa when it exists: the pack shape keeps the key absent otherwise.
      if (row.sectionIntroFa) section.introFa = row.sectionIntroFa;
      sections.push(section);
      continue;
    }
    sections[existing]!.items.push(itemFromRow(row));
  }
  return sections;
}

/** Normalise item -> keyword loadings exactly the way the published instrument does. */
export function compileKeywordFormulaWeights(
  keywordLegacyId: string,
  manifest: GraphManifest,
): { item: string; weight: number }[] {
  const keywordCode = toCanonicalCode(keywordLegacyId);
  const incoming = manifest.edges
    .filter(
      (edge) =>
        edge.edgeKind === "item_keyword" &&
        edge.targetCode === keywordCode &&
        edge.sourceCode.startsWith("ITM.FL."),
    )
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const sum = incoming.reduce((acc, edge) => acc + edge.weight, 0);
  if (sum <= 0) return [];
  return incoming.map((edge) => ({
    item: fromCanonicalCode(edge.sourceCode),
    weight: Math.round(((edge.weight * 2) / sum) * 10000) / 10000,
  }));
}

function compileMeasurementEdges(manifest: GraphManifest): CompiledGraph["keywordEdges"] {
  const structural = manifest.edges
    .filter((edge) => edge.edgeKind === "keyword_layer")
    .map((edge) => ({
      from: fromCanonicalCode(edge.sourceCode),
      to: fromCanonicalCode(edge.targetCode),
      weight: edge.weight,
      transform: "identity" as const,
      sortOrder: edge.sortOrder,
    }));
  // pack.edges carries the instrument's measurement matrix only. The deep-dive bank
  // (SCR/DIAG) lives in the same table but is routed separately, so it is not folded in here.
  const loadings = manifest.edges
    .filter((edge) => edge.edgeKind === "item_keyword" && edge.sourceCode.startsWith("ITM.FL."))
    .map((edge) => ({
      from: fromCanonicalCode(edge.sourceCode),
      to: fromCanonicalCode(edge.targetCode),
      weight: edge.weight,
      transform: "identity" as const,
      sortOrder: edge.sortOrder,
    }));
  return [...structural, ...loadings]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(({ sortOrder: _sortOrder, ...edge }) => {
      void _sortOrder;
      return edge;
    });
}

function compileKeywords(manifest: GraphManifest, keyword: KeywordRow) {
  const children = manifest.subKeywords
    .filter((sub) => sub.keywordCode === keyword.canonicalCode)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((sub) => sub.labelFa);
  return { children, subKeywords: children };
}

/**
 * Compile the domain's graph into a runtime pack on top of a code template.
 * `template` supplies everything the graph does not own yet (consent, bands, prose config);
 * every graph-owned field is overwritten from the rows.
 */
export function compilePack(manifest: GraphManifest, template: AnalyzerPack): CompiledGraph {
  const domainCode: SsotDomainCode =
    template.slug === "casio-ss" ? "DOM.CASIO_SS" : "DOM.MINDSET_GATE";
  const sections = compileSections(manifest, domainCode);
  const pack: AnalyzerPack = { ...template, sections };

  if (domainCode === "DOM.CASIO_SS") {
    const keywordEdges = compileMeasurementEdges(manifest);
    pack.edges = [...edgesFromScoredSections(sections), ...keywordEdges];

    const byKeywordCode = new Map(
      manifest.keywords
        .filter((keyword) => keyword.domainCode === domainCode && keyword.active)
        .map((keyword) => [keyword.canonicalCode, keyword] as const),
    );
    const labelFaByLegacy = new Map(
      manifest.keywords.map((keyword) => [keyword.legacyId, keyword.labelFa] as const),
    );

    pack.keywords = template.keywords.map((keyword) => {
      const row = byKeywordCode.get(toCanonicalCode(keyword.id));
      if (!row) return keyword;
      const children = compileKeywords(manifest, row).children;
      return children.length ? { ...keyword, children } : keyword;
    });
    for (const keyword of pack.keywords) {
      const label = labelFaByLegacy.get(keyword.id);
      if (label) keyword.labelFa = label;
    }

    const layersByLegacy = new Map(manifest.layers.map((layer) => [layer.legacyId, layer] as const));
    const findings: Finding[] = pack.findings.map((finding) => {
      const layer = layersByLegacy.get(finding.id);
      if (!layer) return finding;
      return {
        ...finding,
        titleFa: layer.titleFa,
        constructFa: layer.constructFa ?? finding.constructFa,
        asIsFa: layer.asIsFa ?? finding.asIsFa,
        toBeFa: layer.toBeFa ?? finding.toBeFa,
        actionsFa: layer.actionsFa ?? finding.actionsFa,
      };
    });
    pack.findings = findings;

    pack.formulas = template.formulas.map((formula) => {
      if (formula.op !== "weighted_sum") return formula;
      const weights = compileKeywordFormulaWeights(formula.id, manifest);
      if (!weights.length) return formula;
      return { ...formula, weights };
    });
  }

  return { pack, keywordEdges: pack.edges.filter((edge) => !edge.from.startsWith("BIZ.")) as CompiledGraph["keywordEdges"] };
}

/** Items the respondent answers, in published order — used by the run screen and the editor. */
export function answerableItemIds(manifest: GraphManifest, domainCode: SsotDomainCode): string[] {
  return manifest.items
    .filter((item) => item.domainCode === domainCode && item.active && item.tier !== "SCR" && item.tier !== "DIAG")
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item) => item.legacyId);
}
