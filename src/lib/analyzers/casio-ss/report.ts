/** گزارش شخصی پنج‌لایه از pack زنده. گیت داخلی در گزارش نمی‌آید. */

import { findItem, type AnalyzerPack, type LayerBand } from "@/lib/analyzers/pack";
import { scorePack, type PackScore } from "@/lib/analyzers/score";
import {
  INTERPRETATION_VERSION,
  crossPatterns as fallbackPatterns,
  layerBands as fallbackBands,
  layerCopy as fallbackLayers,
  type LayerKeyword,
} from "./interpretation";

export type ReportContextField = { labelFa: string; valueFa: string };

export type ReportLayer = {
  id: string;
  titleFa: string;
  constructFa: string;
  score: number;
  band: LayerBand;
  asIsFa: string;
  toBeFa: string;
  actionsFa: string;
  isBottleneck: boolean;
  keywords: LayerKeyword[];
};

export type ReportPattern = { id: string; meaningFa: string; actionFa: string };

export type CasioReport = {
  interpretationVersion: string;
  instrumentVersion: string;
  businessName: string | null;
  context: ReportContextField[];
  total: number;
  maturity: { id: string; labelFa: string };
  bottleneck: { id: string; titleFa: string; score: number };
  layers: ReportLayer[];
  patterns: ReportPattern[];
  closingFa: string;
};

function asNumber(value: number | string | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function isWeak(score: number): boolean {
  return score < 10;
}

function isStrong(score: number): boolean {
  return score >= 15;
}

export function layerBandFor(score: number, bands: LayerBand[]): LayerBand {
  const list = bands.length ? bands : fallbackBands;
  for (const band of list) {
    const underMax = band.maxInclusive ? score <= band.max : score < band.max;
    if (score >= band.min && underMax) return band;
  }
  return list[list.length - 1] ?? fallbackBands[fallbackBands.length - 1]!;
}

function maturityLabel(pack: AnalyzerPack, id: string): string {
  const formula = pack.formulas.find((row) => row.id === "maturity");
  return formula?.bands?.find((band) => band.id === id)?.labelFa ?? id;
}

function choiceLabel(pack: AnalyzerPack, itemId: string, value: string): string {
  const item = findItem(pack, itemId);
  if (!item || item.kind !== "choice") return value;
  return item.options.find((option) => option.value === value)?.label ?? value;
}

function keywordsForLayer(pack: AnalyzerPack, findingId: string): LayerKeyword[] {
  const toLayer = new Set(
    pack.edges.filter((edge) => edge.to === findingId).map((edge) => edge.from),
  );
  const list: LayerKeyword[] = [];
  for (const keyword of pack.keywords) {
    if (!toLayer.has(keyword.id)) continue;
    list.push({
      id: keyword.id,
      titleFa: keyword.labelFa,
      children: keyword.children ?? [],
      questionIds: pack.edges.filter((edge) => edge.to === keyword.id).map((edge) => edge.from),
    });
  }
  if (list.length) return list;
  const fallback = fallbackLayers.find((layer) => layer.findingId === findingId);
  return fallback?.keywords ?? [];
}

function layersOf(pack: AnalyzerPack) {
  const fromFindings = pack.findings.filter((finding) => finding.kind === "layer");
  if (fromFindings.length) {
    return fromFindings.map((finding) => ({
      findingId: finding.id,
      titleFa: finding.titleFa,
      constructFa: finding.constructFa ?? "",
      asIsFa: finding.asIsFa ?? "",
      toBeFa: finding.toBeFa ?? "",
      actionsFa: finding.actionsFa ?? "",
      keywords: keywordsForLayer(pack, finding.id),
    }));
  }
  return fallbackLayers.map((layer) => ({
    findingId: layer.findingId,
    titleFa: layer.titleFa,
    constructFa: layer.constructFa,
    asIsFa: layer.asIsFa,
    toBeFa: layer.toBeFa,
    actionsFa: layer.actionsFa,
    keywords: layer.keywords,
  }));
}

function bottleneckIdOf(
  scores: PackScore["scores"],
  layerScores: Record<string, number>,
  layerIds: string[],
): string {
  if (typeof scores.bottleneck === "string" && layerScores[scores.bottleneck] != null) {
    return scores.bottleneck;
  }
  return layerIds.reduce((best, id) => {
    const current = layerScores[id] ?? 0;
    const bestScore = layerScores[best] ?? 0;
    return current < bestScore ? id : best;
  }, layerIds[0] ?? "");
}

function matchingPatterns(
  pack: AnalyzerPack,
  layerScores: Record<string, number>,
): ReportPattern[] {
  const patterns = pack.report?.crossPatterns?.length ? pack.report.crossPatterns : fallbackPatterns;
  const hits: ReportPattern[] = [];
  for (const pattern of patterns) {
    const { when } = pattern;
    if (when.strong && !isStrong(layerScores[when.strong] ?? 0)) continue;
    if (when.weak && !isWeak(layerScores[when.weak] ?? 0)) continue;
    if (when.alsoWeak && !isWeak(layerScores[when.alsoWeak] ?? 0)) continue;
    if (when.weakAny.length > 0 && !when.weakAny.some((id) => isWeak(layerScores[id] ?? 0))) {
      continue;
    }
    hits.push({ id: pattern.id, meaningFa: pattern.meaningFa, actionFa: pattern.actionFa });
  }
  return hits;
}

export function buildCasioReport(
  pack: AnalyzerPack,
  answers: Record<string, number | string>,
  snapshot: PackScore | null,
): CasioReport {
  const scored = snapshot ?? scorePack(pack, answers);
  const layerDefs = layersOf(pack);
  const layerScores: Record<string, number> = {};
  for (const layer of layerDefs) {
    layerScores[layer.findingId] = asNumber(scored.scores[layer.findingId]);
  }

  const bottleneckId = bottleneckIdOf(
    scored.scores,
    layerScores,
    layerDefs.map((layer) => layer.findingId),
  );
  const bands = pack.report?.layerBands ?? fallbackBands;
  const layers: ReportLayer[] = layerDefs.map((layer) => {
    const score = layerScores[layer.findingId] ?? 0;
    return {
      id: layer.findingId,
      titleFa: layer.titleFa,
      constructFa: layer.constructFa,
      score,
      band: layerBandFor(score, bands),
      asIsFa: layer.asIsFa,
      toBeFa: layer.toBeFa,
      actionsFa: layer.actionsFa,
      isBottleneck: layer.findingId === bottleneckId,
      keywords: layer.keywords,
    };
  });

  const bottleneck = layers.find((layer) => layer.isBottleneck) ?? layers[0]!;
  const maturityId = typeof scored.scores.maturity === "string" ? scored.scores.maturity : "nascent";
  const nameId = pack.report?.businessNameItemId ?? "BIZ.1";
  const businessRaw = answers[nameId];
  const businessName = typeof businessRaw === "string" && businessRaw.trim() ? businessRaw.trim() : null;
  const contextFields = pack.report?.contextFields?.length
    ? pack.report.contextFields
    : [
        { id: "BIZ.2", labelFa: "نوع کسب‌وکار" },
        { id: "BIZ.3", labelFa: "حیطهٔ فعالیت" },
        { id: "BIZ.4", labelFa: "تعداد پرسنل" },
        { id: "BIZ.5", labelFa: "سابقهٔ مدیر" },
        { id: "BIZ.6", labelFa: "قدمت کسب‌وکار" },
      ];
  const context: ReportContextField[] = [];
  for (const field of contextFields) {
    const raw = answers[field.id];
    if (typeof raw !== "string" || !raw.trim()) continue;
    const item = findItem(pack, field.id);
    const valueFa = item?.kind === "choice" ? choiceLabel(pack, field.id, raw) : raw.trim();
    context.push({ labelFa: field.labelFa, valueFa });
  }

  return {
    interpretationVersion: pack.report?.interpretationVersion ?? INTERPRETATION_VERSION,
    instrumentVersion: scored.version,
    businessName,
    context,
    total: asNumber(scored.scores["diagnosis-total"]),
    maturity: { id: maturityId, labelFa: maturityLabel(pack, maturityId) },
    bottleneck: bottleneck
      ? { id: bottleneck.id, titleFa: bottleneck.titleFa, score: bottleneck.score }
      : { id: "", titleFa: "", score: 0 },
    layers,
    patterns: matchingPatterns(pack, layerScores),
    closingFa:
      pack.report?.closingFa ??
      "نتیجهٔ این ارزیابی یک راهنمای کلی است، نه حکم قطعی دربارهٔ شما یا کسب‌وکارتان.",
  };
}
