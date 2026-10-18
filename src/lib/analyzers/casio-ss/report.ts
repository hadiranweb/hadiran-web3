/** گزارش شخصی پنج‌لایه. گیت داخلی می‌ماند؛ درخت از ماتریس تفسیر است نه وکتور. */

import { findItem } from "@/lib/analyzers/pack";
import { scorePack, type PackScore } from "@/lib/analyzers/score";
import { casioSsPack } from "./instrument";
import {
  INTERPRETATION_VERSION,
  crossPatterns,
  layerBands,
  layerCopy,
  type LayerBand,
  type LayerKeyword,
} from "./interpretation";

const CONTEXT_FIELDS: { id: string; labelFa: string }[] = [
  { id: "BIZ.2", labelFa: "نوع کسب‌وکار" },
  { id: "BIZ.3", labelFa: "حیطهٔ فعالیت" },
  { id: "BIZ.4", labelFa: "تعداد پرسنل" },
  { id: "BIZ.5", labelFa: "سابقهٔ مدیر" },
  { id: "BIZ.6", labelFa: "قدمت کسب‌وکار" },
];

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

export function layerBandFor(score: number): LayerBand {
  for (const band of layerBands) {
    const underMax = band.maxInclusive ? score <= band.max : score < band.max;
    if (score >= band.min && underMax) return band;
  }
  return layerBands[layerBands.length - 1]!;
}

function maturityLabel(id: string): string {
  const formula = casioSsPack.formulas.find((row) => row.id === "maturity");
  return formula?.bands?.find((band) => band.id === id)?.labelFa ?? id;
}

function choiceLabel(itemId: string, value: string): string {
  const item = findItem(casioSsPack, itemId);
  if (!item || item.kind !== "choice") return value;
  return item.options.find((option) => option.value === value)?.label ?? value;
}

function contextOf(answers: Record<string, number | string>): ReportContextField[] {
  const fields: ReportContextField[] = [];
  for (const field of CONTEXT_FIELDS) {
    const raw = answers[field.id];
    if (typeof raw !== "string" || !raw.trim()) continue;
    const valueFa = field.id === "BIZ.3" ? raw.trim() : choiceLabel(field.id, raw);
    fields.push({ labelFa: field.labelFa, valueFa });
  }
  return fields;
}

function bottleneckIdOf(scores: PackScore["scores"], layerScores: Record<string, number>): string {
  if (typeof scores.bottleneck === "string" && layerScores[scores.bottleneck] != null) {
    return scores.bottleneck;
  }
  return layerCopy.reduce((best, layer) => {
    const current = layerScores[layer.findingId] ?? 0;
    const bestScore = layerScores[best] ?? 0;
    return current < bestScore ? layer.findingId : best;
  }, layerCopy[0]!.findingId);
}

function matchingPatterns(layerScores: Record<string, number>): ReportPattern[] {
  const hits: ReportPattern[] = [];
  for (const pattern of crossPatterns) {
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
  answers: Record<string, number | string>,
  snapshot: PackScore | null,
): CasioReport {
  const scored = snapshot ?? scorePack(casioSsPack, answers);
  const layerScores: Record<string, number> = {};
  for (const layer of layerCopy) {
    layerScores[layer.findingId] = asNumber(scored.scores[layer.findingId]);
  }

  const bottleneckId = bottleneckIdOf(scored.scores, layerScores);
  const layers: ReportLayer[] = layerCopy.map((layer) => {
    const score = layerScores[layer.findingId] ?? 0;
    return {
      id: layer.findingId,
      titleFa: layer.titleFa,
      constructFa: layer.constructFa,
      score,
      band: layerBandFor(score),
      asIsFa: layer.asIsFa,
      toBeFa: layer.toBeFa,
      actionsFa: layer.actionsFa,
      isBottleneck: layer.findingId === bottleneckId,
      keywords: layer.keywords,
    };
  });

  const bottleneck = layers.find((layer) => layer.isBottleneck) ?? layers[0]!;
  const maturityId = typeof scored.scores.maturity === "string" ? scored.scores.maturity : "nascent";
  const businessRaw = answers["BIZ.1"];
  const businessName = typeof businessRaw === "string" && businessRaw.trim() ? businessRaw.trim() : null;

  return {
    interpretationVersion: INTERPRETATION_VERSION,
    instrumentVersion: scored.version,
    businessName,
    context: contextOf(answers),
    total: asNumber(scored.scores["diagnosis-total"]),
    maturity: { id: maturityId, labelFa: maturityLabel(maturityId) },
    bottleneck: { id: bottleneck.id, titleFa: bottleneck.titleFa, score: bottleneck.score },
    layers,
    patterns: matchingPatterns(layerScores),
  };
}
