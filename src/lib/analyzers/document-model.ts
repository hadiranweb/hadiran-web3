/** قرارداد نازک سند تفسیر. رندر چاپ از همین می‌خواند؛ نمرهٔ تازه نمی‌سازد. */

import { buildCasioReport, layerBandFor } from "@/lib/analyzers/casio-ss/report";
import { buildDiagnosisReport } from "@/lib/analyzers/system-diagnosis/report";
import type { RespondentCausalGraphSummary } from "@/lib/analyzers/system-diagnosis/coding-causal-graph";
import type { AdaptiveDeepDiveSummary } from "@/lib/analyzers/system-diagnosis/deep-dive-a3";
import { buildGenericReport } from "@/lib/analyzers/generic-report";
import { resolveDocumentTemplateId } from "@/lib/analyzers/document-templates";
import type { AnalyzerPack } from "@/lib/analyzers/pack";
import type { PackScore } from "@/lib/analyzers/score";
import type { WorkspaceAttemptRow } from "@/lib/analyzers/workspace-attempt-types";

const FA = "۰۱۲۳۴۵۶۷۸۹";

export type DocumentKeyword = {
  id: string;
  titleFa: string;
  children: string[];
  score?: number;
  scoreFa?: string;
  bandId?: "weak" | "growing" | "strong";
  bandLabelFa?: string;
  whyFa?: string;
  horizonFa?: string;
  ownerRoleFa?: string;
  micmacLabelFa?: string;
  influencersFa?: string[];
  influencedFa?: string[];
};

export type DocumentLayer = {
  id: string;
  titleFa: string;
  constructFa: string;
  score: number | null;
  scoreMax: number;
  scoreFa: string;
  scoreMaxFa: string;
  statusFa: string;
  asIsFa: string;
  toBeFa: string;
  actionsFa: string;
  isBottleneck: boolean;
  keywords: DocumentKeyword[];
};

export type InterpretationDocument = {
  packNameFa: string;
  packSlug: string;
  version: string;
  templateId: string;
  personNameFa: string;
  businessNameFa: string | null;
  publicCode: string | null;
  submittedAt: string | null;
  context: { labelFa: string; valueFa: string }[];
  totalScore: number | null;
  totalScoreMax: number | null;
  totalFa: string | null;
  maturityFa: string | null;
  bottleneckId: string | null;
  bottleneckFa: string | null;
  bottleneckScore: number | null;
  bottleneckScoreFa: string | null;
  layers: DocumentLayer[];
  scores: { titleFa: string; valueFa: string }[];
  patterns: { meaningFa: string; actionFa: string }[];
  causalGraph?: RespondentCausalGraphSummary;
  deepDive?: AdaptiveDeepDiveSummary;
  closingFa: string;
  /** Frozen chrome from convert time. Missing on documents converted before snapshots. */
  chromeSnapshot?: Record<string, unknown> | null;
};

export function faNum(value: number | string) {
  return String(value).replace(/\d/g, (digit) => FA[Number(digit)] ?? digit);
}

export function faScore(value: number) {
  const rounded = Math.round(value * 10) / 10;
  return faNum(Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1));
}

function asNumber(value: number | string | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function keywordsOf(pack: AnalyzerPack, findingId: string): DocumentKeyword[] {
  const toLayer = new Set(pack.edges.filter((edge) => edge.to === findingId).map((edge) => edge.from));
  const list: DocumentKeyword[] = [];
  for (const keyword of pack.keywords) {
    if (!toLayer.has(keyword.id)) continue;
    list.push({ id: keyword.id, titleFa: keyword.labelFa, children: keyword.children ?? [] });
  }
  return list;
}

function layersFromPack(pack: AnalyzerPack, snapshot: PackScore | null): DocumentLayer[] {
  const layers = pack.findings.filter((finding) => finding.kind === "layer");
  if (!layers.length) return [];
  const scores = snapshot?.scores ?? {};
  const numeric: Record<string, number> = {};
  for (const layer of layers) {
    const value = asNumber(scores[layer.id]);
    if (value != null) numeric[layer.id] = value;
  }
  const bottleneckId =
    typeof scores.bottleneck === "string" && numeric[scores.bottleneck] != null
      ? scores.bottleneck
      : layers.reduce((best, layer) => {
          const current = numeric[layer.id] ?? Number.POSITIVE_INFINITY;
          const bestScore = numeric[best] ?? Number.POSITIVE_INFINITY;
          return current < bestScore ? layer.id : best;
        }, layers[0]?.id ?? "");
  const bands = pack.report?.layerBands ?? [];
  return layers.map((layer) => {
    const score = numeric[layer.id];
    const band = score != null && bands.length ? layerBandFor(score, bands) : null;
    return {
      id: layer.id,
      titleFa: layer.titleFa,
      constructFa: layer.constructFa ?? "",
      score: score ?? null,
      scoreMax: 20,
      scoreFa: score != null ? faScore(score) : "—",
      scoreMaxFa: faNum(20),
      statusFa: band?.labelFa ?? "",
      asIsFa: layer.asIsFa ?? "",
      toBeFa: layer.toBeFa ?? "",
      actionsFa: layer.actionsFa ?? "",
      isBottleneck: layer.id === bottleneckId,
      keywords: keywordsOf(pack, layer.id),
    };
  });
}

export function buildInterpretationDocument(
  pack: AnalyzerPack,
  row: WorkspaceAttemptRow,
  templateId?: string | null,
): InterpretationDocument {
  const snapshot = row.rawResults;
  const closing =
    pack.report?.closingFa?.trim() ||
    "نتیجهٔ این ارزیابی یک راهنمای کلی است، نه حکم قطعی دربارهٔ شما یا کسب‌وکارتان.";

  const resolvedTemplateId = resolveDocumentTemplateId(pack, templateId);

  if (pack.slug === "casio-ss") {
    const report = buildCasioReport(pack, row.rawAnswers, snapshot);
    return {
      packNameFa: pack.nameFa,
      packSlug: pack.slug,
      version: report.instrumentVersion,
      templateId: resolvedTemplateId,
      personNameFa: row.nameFa,
      businessNameFa: report.businessName ?? row.businessName,
      publicCode: row.publicCode,
      submittedAt: row.submittedAt,
      context: report.context,
      totalScore: report.total,
      totalScoreMax: 100,
      totalFa: faScore(report.total),
      maturityFa: report.maturity.labelFa,
      bottleneckId: report.bottleneck.id,
      bottleneckFa: report.bottleneck.titleFa,
      bottleneckScore: report.bottleneck.score,
      bottleneckScoreFa: faScore(report.bottleneck.score),
      layers: report.layers.map((layer) => ({
        id: layer.id,
        titleFa: layer.titleFa,
        constructFa: layer.constructFa,
        score: layer.score,
        scoreMax: 20,
        scoreFa: faScore(layer.score),
        scoreMaxFa: faNum(20),
        statusFa: layer.band.labelFa,
        asIsFa: layer.asIsFa,
        toBeFa: layer.toBeFa,
        actionsFa: layer.actionsFa,
        isBottleneck: layer.isBottleneck,
        keywords: layer.keywords.map((keyword) => ({
          id: keyword.id,
          titleFa: keyword.titleFa,
          children: keyword.children,
        })),
      })),
      scores: [],
      patterns: report.patterns.map((pattern) => ({ meaningFa: pattern.meaningFa, actionFa: pattern.actionFa })),
      closingFa: report.closingFa || closing,
    };
  }

  if (pack.slug === "system-diagnosis") {
    const report = buildDiagnosisReport(pack, row.rawAnswers, snapshot);
    return {
      packNameFa: pack.nameFa,
      packSlug: pack.slug,
      version: report.instrumentVersion,
      templateId: resolvedTemplateId,
      personNameFa: row.nameFa,
      businessNameFa: report.businessName ?? row.businessName,
      publicCode: row.publicCode,
      submittedAt: row.submittedAt,
      context: report.context,
      totalScore: report.total,
      totalScoreMax: 100,
      totalFa: faScore(report.total),
      maturityFa: report.maturity.labelFa,
      bottleneckId: report.bottleneck.id,
      bottleneckFa: report.bottleneck.titleFa,
      bottleneckScore: report.bottleneck.score,
      bottleneckScoreFa: faScore(report.bottleneck.score),
      layers: report.layers.map((layer) => ({
        id: layer.id,
        titleFa: layer.titleFa,
        constructFa: layer.constructFa,
        score: layer.score,
        scoreMax: 20,
        scoreFa: faScore(layer.score),
        scoreMaxFa: faNum(20),
        statusFa: layer.band.labelFa,
        asIsFa: layer.asIsFa,
        toBeFa: layer.toBeFa,
        actionsFa: layer.actionsFa,
        isBottleneck: layer.isBottleneck,
        keywords: layer.keywords.map((keyword) => ({
          id: keyword.id,
          titleFa: keyword.titleFa,
          children: keyword.children,
          score: keyword.score,
          scoreFa: keyword.score != null ? faScore(keyword.score) : undefined,
          bandId: keyword.bandId,
          bandLabelFa: keyword.bandLabelFa,
          whyFa: keyword.whyFa,
          horizonFa: keyword.horizonFa,
          ownerRoleFa: keyword.ownerRoleFa,
          micmacLabelFa: keyword.micmacLabelFa,
          influencersFa: keyword.influencersFa,
          influencedFa: keyword.influencedFa,
        })),
      })),
      scores: [],
      patterns: report.patterns.map((pattern) => ({ meaningFa: pattern.meaningFa, actionFa: pattern.actionFa })),
      causalGraph: report.causalGraph,
      deepDive: report.deepDive,
      closingFa: report.closingFa || closing,
    };
  }

  const generic = buildGenericReport(pack, row.rawAnswers, snapshot);
  const layers = layersFromPack(pack, snapshot);
  const total = asNumber(snapshot?.scores["diagnosis-total"]);
  const maturityId = typeof snapshot?.scores.maturity === "string" ? snapshot.scores.maturity : null;
  const maturityLabel = maturityId
    ? pack.formulas.find((formula) => formula.id === "maturity")?.bands?.find((band) => band.id === maturityId)
        ?.labelFa ?? maturityId
    : null;
  const bottleneckScore = asNumber(generic.bottleneck ? snapshot?.scores[generic.bottleneck.id] : undefined);

  return {
    packNameFa: pack.nameFa,
    packSlug: pack.slug,
    version: generic.version,
    templateId: resolvedTemplateId,
    personNameFa: row.nameFa,
    businessNameFa: row.businessName,
    publicCode: row.publicCode,
    submittedAt: row.submittedAt,
    context: [],
    totalScore: total,
    totalScoreMax: total != null ? 100 : null,
    totalFa: total != null ? faScore(total) : null,
    maturityFa: maturityLabel,
    bottleneckId: generic.bottleneck?.id ?? null,
    bottleneckFa: generic.bottleneck?.titleFa ?? null,
    bottleneckScore,
    bottleneckScoreFa: bottleneckScore != null ? faScore(bottleneckScore) : null,
    layers,
    scores: layers.length
      ? []
      : generic.scores.map((item) => ({
          titleFa: item.titleFa,
          valueFa: typeof item.value === "number" ? faScore(item.value) : String(item.value),
        })),
    patterns: [],
    closingFa: closing,
  };
}
