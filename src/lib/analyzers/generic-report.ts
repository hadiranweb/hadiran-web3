import type { AnalyzerPack, Finding, Keyword } from "@/lib/analyzers/pack";
import { scorePack, type PackScore } from "@/lib/analyzers/score";

export type GenericScoreRow = {
  id: string;
  titleFa: string;
  value: number | string;
  kind: "finding" | "formula";
};

export type GenericKeywordNode = {
  keyword: Keyword;
  fromIds: string[];
};

export type GenericReport = {
  nameFa: string;
  summaryFa: string;
  version: string;
  scores: GenericScoreRow[];
  bottleneck: { id: string; titleFa: string } | null;
  keywords: GenericKeywordNode[];
};

const HIDDEN_IDS = new Set(["gate-band"]);
const HIDDEN_VALUES = new Set(["green", "yellow", "red"]);

function titleOf(pack: AnalyzerPack, id: string): string {
  const finding = pack.findings.find((row) => row.id === id);
  if (finding) return finding.titleFa;
  const keyword = pack.keywords.find((row) => row.id === id);
  if (keyword) return keyword.labelFa;
  const formula = pack.formulas.find((row) => row.id === id);
  if (formula) return formula.id;
  return id;
}

function hidden(id: string, value: number | string): boolean {
  if (HIDDEN_IDS.has(id) || id.endsWith(":gate-band")) return true;
  if (typeof value === "string" && HIDDEN_VALUES.has(value)) return true;
  return false;
}

export function buildGenericReport(
  pack: AnalyzerPack,
  answers: Record<string, number | string>,
  snapshot: PackScore | null,
): GenericReport {
  const scored = snapshot ?? scorePack(pack, answers);
  const findingIds = new Set(pack.findings.map((row) => row.id));
  const scores: GenericScoreRow[] = [];

  for (const finding of pack.findings) {
    const value = scored.scores[finding.id];
    if (value == null || hidden(finding.id, value)) continue;
    scores.push({ id: finding.id, titleFa: finding.titleFa, value, kind: "finding" });
  }

  for (const formula of pack.formulas) {
    if (findingIds.has(formula.id)) continue;
    const value = scored.scores[formula.id];
    if (value == null || hidden(formula.id, value)) continue;
    scores.push({ id: formula.id, titleFa: formula.id, value, kind: "formula" });
  }

  const bottleneckId = typeof scored.scores.bottleneck === "string" ? scored.scores.bottleneck : null;
  const bottleneckFinding: Finding | undefined = bottleneckId
    ? pack.findings.find((row) => row.id === bottleneckId)
    : undefined;

  const keywords: GenericKeywordNode[] = pack.keywords.map((keyword) => ({
    keyword,
    fromIds: pack.edges.filter((edge) => edge.to === keyword.id).map((edge) => edge.from),
  }));

  return {
    nameFa: pack.nameFa,
    summaryFa: pack.summaryFa,
    version: scored.version,
    scores,
    bottleneck: bottleneckFinding
      ? { id: bottleneckFinding.id, titleFa: bottleneckFinding.titleFa }
      : bottleneckId
        ? { id: bottleneckId, titleFa: titleOf(pack, bottleneckId) }
        : null,
    keywords,
  };
}
