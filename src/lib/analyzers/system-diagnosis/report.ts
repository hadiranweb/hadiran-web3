/**
 * موتور گزارش پویای «عارضه‌یابی سیستم کسب‌وکار» (system-diagnosis).
 * متن هر لایه از باند واقعی کلیدواژه‌های همان فرد ساخته می‌شود، نه از متن ثابت.
 * گراف علّی، هستی‌شناسی و تعدیل زمینه در برش‌های بعد روی همین خروجی سوار می‌شوند.
 */

import { findItem, type AnalyzerPack, type LayerBand } from "@/lib/analyzers/pack";
import { scorePack, type PackScore } from "@/lib/analyzers/score";
import {
  VAULT_CONCEPTS,
  buildOntologyDiagnosis,
  getKeywordOntology,
  type OntologyDiagnosisSummary,
} from "./ontology-graph";
import {
  buildCanonicalKeywordCausalProfiles,
  buildRespondentCausalAnalysis,
  toCanonicalCode,
  type RespondentCausalGraphSummary,
} from "./coding-causal-graph";
import {
  INTERPRETATION_VERSION,
  crossPatterns as fallbackPatterns,
  layerBands as fallbackBands,
  layerCopy as fallbackLayers,
  type LayerKeyword,
  type ScoredSubKeyword,
} from "./interpretation";

export type ReportContextField = { labelFa: string; valueFa: string };

export type ReportLayer = {
  id: string;
  canonicalCode?: string;
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

export type DiagnosisReport = {
  interpretationVersion: string;
  instrumentVersion: string;
  businessName: string | null;
  context: ReportContextField[];
  ontology?: OntologyDiagnosisSummary;
  causalGraph?: RespondentCausalGraphSummary;
  total: number;
  maturity: { id: string; labelFa: string };
  bottleneck: { id: string; titleFa: string; score: number };
  layers: ReportLayer[];
  patterns: ReportPattern[];
  closingFa: string;
};

const KEYWORD_TITLES_MAP: Record<string, string> = Object.fromEntries(
  fallbackLayers.flatMap((layer) => layer.keywords.map((kw) => [kw.id, kw.titleFa] as const)),
);

const BASE_CAUSAL_PROFILES = buildCanonicalKeywordCausalProfiles(KEYWORD_TITLES_MAP);

const CANONICAL_KEYWORDS = new Map<string, LayerKeyword>(
  fallbackLayers.flatMap((layer) => layer.keywords.map((kw) => [kw.id, kw] as const)),
);

const STATIC_DEFAULT_AS_IS = new Set(fallbackLayers.map((l) => l.asIsFa));
const STATIC_DEFAULT_TO_BE = new Set(fallbackLayers.map((l) => l.toBeFa));
const STATIC_DEFAULT_ACTIONS = new Set(fallbackLayers.map((l) => l.actionsFa));

function asNumber(value: number | string | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function isWeak(score: number): boolean {
  return score < 10;
}

function isStrong(score: number): boolean {
  return score >= 15;
}

function keywordBandIdOf(score: number): "weak" | "growing" | "strong" {
  if (score < 10) return "weak";
  if (score < 15) return "growing";
  return "strong";
}

function keywordBandLabelFaOf(bandId: "weak" | "growing" | "strong"): string {
  if (bandId === "weak") return "ضعف (اولویت بالا)";
  if (bandId === "growing") return "در حال رشد";
  return "نقطهٔ قوت";
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

/**
 * استخراج نمرهٔ مؤثر هر گویه (۰ تا ۱۰ با اعمال معکوس‌سازی گویه‌های منفی).
 */
function effectiveAnswerOf(
  pack: AnalyzerPack,
  answers: Record<string, number | string>,
  scored: PackScore,
  itemId: string,
): number | null {
  if (typeof scored.effective?.[itemId] === "number" && Number.isFinite(scored.effective[itemId])) {
    return scored.effective[itemId]!;
  }
  const item = findItem(pack, itemId);
  if (!item || item.kind !== "range") return null;
  const raw = answers[itemId];
  if (typeof raw !== "number" || !Number.isFinite(raw)) return null;
  return item.reverse ? 10 - raw : raw;
}

/**
 * محاسبهٔ امتیاز واقعی هر کلیدواژه در مقیاس ۰ تا ۲۰ از روی یال‌های وزن‌دار چندبه‌چند.
 */
function computeKeywordScore(
  pack: AnalyzerPack,
  answers: Record<string, number | string>,
  scored: PackScore,
  keywordId: string,
): number {
  const fromFormula = scored.scores[keywordId];
  if (typeof fromFormula === "number" && Number.isFinite(fromFormula)) {
    return round1(Math.max(0, Math.min(20, fromFormula)));
  }
  const incoming = pack.edges.filter((edge) => edge.to === keywordId && edge.from !== keywordId);
  let weightedSum = 0;
  let totalWeight = 0;
  for (const edge of incoming) {
    const eff = effectiveAnswerOf(pack, answers, scored, edge.from);
    if (eff == null) continue;
    const w = edge.weight > 0 ? edge.weight : 1;
    weightedSum += eff * w;
    totalWeight += w;
  }
  if (totalWeight <= 0) return 0;
  return round1(Math.max(0, Math.min(20, (weightedSum / totalWeight) * 2)));
}

/**
 * محاسبهٔ امتیاز واقعی هر یک از ۷۵ زیرکلیدواژه در مقیاس ۰ تا ۲۰ و مرتب‌سازی بر اساس اولویت ضعف.
 */
function computeScoredSubKeywords(
  pack: AnalyzerPack,
  answers: Record<string, number | string>,
  scored: PackScore,
  canonical: LayerKeyword | undefined,
  fallbackChildren: string[],
  parentScore: number,
): { children: string[]; scoredSubKeywords: ScoredSubKeyword[] } {
  if (!canonical?.subKeywords?.length) {
    const bandId = keywordBandIdOf(parentScore);
    return {
      children: fallbackChildren,
      scoredSubKeywords: fallbackChildren.map((titleFa, idx) => {
        const subId = `${canonical?.id ?? "KW"}-S${idx + 1}`;
        return {
          id: subId,
          canonicalCode: toCanonicalCode(subId),
          titleFa,
          score: parentScore,
          bandId,
        };
      }),
    };
  }

  const list: ScoredSubKeyword[] = canonical.subKeywords.map((sub) => {
    let weightedSum = 0;
    let totalWeight = 0;
    for (const row of sub.weights) {
      const eff = effectiveAnswerOf(pack, answers, scored, row.item);
      if (eff == null) continue;
      weightedSum += eff * row.weight;
      totalWeight += row.weight;
    }
    const score = totalWeight > 0 ? round1((weightedSum / totalWeight) * 2) : parentScore;
    return {
      id: sub.id,
      canonicalCode: toCanonicalCode(sub.id),
      titleFa: sub.titleFa,
      score,
      bandId: keywordBandIdOf(score),
    };
  });

  const sorted = [...list].sort((a, b) => a.score - b.score);
  return {
    children: sorted.map((item) => item.titleFa),
    scoredSubKeywords: sorted,
  };
}

function bandOrderRank(bandId: "weak" | "growing" | "strong" | undefined): number {
  if (bandId === "weak") return 0;
  if (bandId === "growing") return 1;
  return 2;
}

function sortKeywordsByPriority(list: LayerKeyword[]): LayerKeyword[] {
  return [...list].sort((a, b) => {
    const rankDiff = bandOrderRank(a.bandId) - bandOrderRank(b.bandId);
    if (rankDiff !== 0) return rankDiff;
    return (a.score ?? 0) - (b.score ?? 0);
  });
}

function keywordsForLayer(
  pack: AnalyzerPack,
  findingId: string,
  answers: Record<string, number | string>,
  scored: PackScore,
): LayerKeyword[] {
  const toLayer = new Set(
    pack.edges.filter((edge) => edge.to === findingId).map((edge) => edge.from),
  );
  const rawKeywords: LayerKeyword[] = [];
  for (const keyword of pack.keywords) {
    if (!toLayer.has(keyword.id)) continue;
    const canonical = CANONICAL_KEYWORDS.get(keyword.id);
    const score = computeKeywordScore(pack, answers, scored, keyword.id);
    const bandId = keywordBandIdOf(score);
    const bandLabelFa = keywordBandLabelFaOf(bandId);
    const baseChildren = keyword.children?.length ? keyword.children : (canonical?.children ?? []);
    const { children, scoredSubKeywords } = computeScoredSubKeywords(
      pack,
      answers,
      scored,
      canonical,
      baseChildren,
      score,
    );
    const onto = getKeywordOntology(keyword.id);
    const causalProfile = BASE_CAUSAL_PROFILES[keyword.id];
    const baseKw: LayerKeyword = {
      ...(canonical ?? {}),
      canonicalCode: causalProfile?.canonicalCode ?? toCanonicalCode(keyword.id),
      rummlerLevel: onto?.rummlerLevel ?? canonical?.rummlerLevel,
      rummlerNeed: onto?.rummlerNeed ?? canonical?.rummlerNeed,
      rummlerCellLabelFa: onto?.rummlerCellLabelFa ?? canonical?.rummlerCellLabelFa,
      nadlerPairFa: onto?.nadlerPairFa ?? canonical?.nadlerPairFa,
      vaultConceptsFa: onto?.vaultConceptIds.map((id) => VAULT_CONCEPTS[id]?.titleFa ?? id) ?? canonical?.vaultConceptsFa,
      sourceIds: onto?.sourceIds ?? canonical?.sourceIds,
      ismLevel: causalProfile?.ismLevel,
      causalRole: causalProfile?.causalRole,
      causalRoleLabelFa: causalProfile?.causalRoleLabelFa,
      micmacQuadrant: causalProfile?.micmacQuadrant,
      micmacLabelFa: causalProfile?.micmacLabelFa,
      drivingPower: causalProfile?.drivingPower,
      dependencePower: causalProfile?.dependencePower,
      netCauseEffect: causalProfile?.netCauseEffect,
      influencersFa: causalProfile?.directInfluencers.map(
        (inf) => `${KEYWORD_TITLES_MAP[inf.keywordId] ?? inf.keywordId} [${inf.canonicalCode}]`,
      ),
      influencedFa: causalProfile?.directInfluenced.map(
        (dep) => `${KEYWORD_TITLES_MAP[dep.keywordId] ?? dep.keywordId} [${dep.canonicalCode}]`,
      ),
      id: keyword.id,
      titleFa: keyword.labelFa || canonical?.titleFa || keyword.id,
      children,
      scoredSubKeywords,
      questionIds: pack.edges
        .filter((edge) => edge.to === keyword.id && edge.from.startsWith("FL."))
        .map((edge) => edge.from),
      score,
      bandId,
      bandLabelFa,
    };
    rawKeywords.push(baseKw);
  }

  if (!rawKeywords.length) {
    const fallback = fallbackLayers.find((layer) => layer.findingId === findingId);
    if (!fallback) return [];
    const fallbackList = fallback.keywords.map((kw) => {
      const score = computeKeywordScore(pack, answers, scored, kw.id);
      const bandId = keywordBandIdOf(score);
      const { children, scoredSubKeywords } = computeScoredSubKeywords(
        pack,
        answers,
        scored,
        kw,
        kw.children,
        score,
      );
      return {
        ...kw,
        children,
        scoredSubKeywords,
        score,
        bandId,
        bandLabelFa: keywordBandLabelFaOf(bandId),
      };
    });
    return sortKeywordsByPriority(fallbackList);
  }

  // مرتب‌سازی کلیدواژه‌های هر لایه بر اساس باند عملکردی و شکاف وزنی زمینه‌مند
  return sortKeywordsByPriority(rawKeywords);
}

/**
 * سنتز پویا برای وضعیت موجود (asIsFa)، وضعیت مطلوب (toBeFa) و اقدامات پیشنهادی (actionsFa)
 * بر اساس امتیاز واقعی کلیدواژه‌های هر لایه.
 */
function synthesizeLayerCopyFromKeywords(
  keywords: LayerKeyword[],
  fallbackAsIs: string,
  fallbackToBe: string,
  fallbackActions: string,
): { asIsFa: string; toBeFa: string; actionsFa: string } {
  const hasRichMeta = keywords.some((kw) => kw.asIsWeakFa || kw.actionStepFa);
  if (!hasRichMeta) {
    return { asIsFa: fallbackAsIs, toBeFa: fallbackToBe, actionsFa: fallbackActions };
  }

  const weakKws = keywords.filter((kw) => kw.bandId === "weak");
  const growingKws = keywords.filter((kw) => kw.bandId === "growing");
  const strongKws = keywords.filter((kw) => kw.bandId === "strong");
  const priorityKws = [...weakKws, ...growingKws];

  // ۱. سنتز وضعیت موجود (asIsFa) بر اساس کلیدواژه‌های واقعاً ضعیف/در حال رشد
  let asIsParts: string[] = [];
  if (priorityKws.length > 0) {
    asIsParts = priorityKws
      .slice(0, 2)
      .map((kw) => (kw.bandId === "weak" ? kw.asIsWeakFa : kw.asIsGrowingFa) ?? "")
      .filter(Boolean);
    if (strongKws.length > 0 && strongKws[0]?.asIsStrongFa) {
      asIsParts.push(`نقطهٔ پایدار این لایه: ${strongKws[0].asIsStrongFa}`);
    }
  } else {
    asIsParts = strongKws
      .slice(0, 2)
      .map((kw) => kw.asIsStrongFa ?? "")
      .filter(Boolean);
  }

  // ۲. سنتز وضعیت مطلوب (toBeFa) متمرکز بر کلیدواژه‌های اولویت‌دار
  const targetSource = priorityKws.length > 0 ? priorityKws.slice(0, 2) : strongKws.slice(0, 2);
  const toBeParts = targetSource.map((kw) => kw.toBeFa ?? "").filter(Boolean);

  // ۳. سنتز اقدامات پیشنهادی (actionsFa) فقط برای کلیدواژه‌های نیازمند مداخله (یا تثبیت در صورت قوی بودن کل لایه)
  let actionItems: string[] = [];
  if (priorityKws.length > 0) {
    actionItems = priorityKws.map((kw) => {
      const base = kw.actionStepFa ?? kw.titleFa;
      const meta = [kw.horizonFa ? `افق ${kw.horizonFa}` : null, kw.ownerRoleFa ?? null]
        .filter(Boolean)
        .join(" · ");
      return meta ? `${base} (${meta})` : base;
    });
  } else if (strongKws.length > 0) {
    const first = strongKws[0]!;
    actionItems = [
      `تثبیت و ممیزی دوره‌ای «${first.titleFa}» و انتقال الگوی موفق این لایه به لایه‌های دارای گلوگاه`,
    ];
  }

  return {
    asIsFa: asIsParts.length > 0 ? asIsParts.join(" ") : fallbackAsIs,
    toBeFa: toBeParts.length > 0 ? toBeParts.join(" ") : fallbackToBe,
    actionsFa: actionItems.length > 0 ? actionItems.join("؛ ") : fallbackActions,
  };
}

function layersOf(
  pack: AnalyzerPack,
  answers: Record<string, number | string>,
  scored: PackScore,
) {
  const fromFindings = pack.findings.filter((finding) => finding.kind === "layer");
  if (fromFindings.length) {
    return fromFindings.map((finding) => {
      const fallback = fallbackLayers.find((layer) => layer.findingId === finding.id);
      const keywords = keywordsForLayer(pack, finding.id, answers, scored);
      const customAsIs =
        finding.asIsFa && !STATIC_DEFAULT_AS_IS.has(finding.asIsFa) ? finding.asIsFa : null;
      const customToBe =
        finding.toBeFa && !STATIC_DEFAULT_TO_BE.has(finding.toBeFa) ? finding.toBeFa : null;
      const customActions =
        finding.actionsFa && !STATIC_DEFAULT_ACTIONS.has(finding.actionsFa)
          ? finding.actionsFa
          : null;

      const dynamic = synthesizeLayerCopyFromKeywords(
        keywords,
        finding.asIsFa ?? fallback?.asIsFa ?? "",
        finding.toBeFa ?? fallback?.toBeFa ?? "",
        finding.actionsFa ?? fallback?.actionsFa ?? "",
      );

      return {
        findingId: finding.id,
        titleFa: finding.titleFa,
        constructFa: finding.constructFa ?? fallback?.constructFa ?? "",
        asIsFa: customAsIs ?? dynamic.asIsFa,
        toBeFa: customToBe ?? dynamic.toBeFa,
        actionsFa: customActions ?? dynamic.actionsFa,
        keywords,
      };
    });
  }
  return fallbackLayers.map((layer) => {
    const keywords = keywordsForLayer(pack, layer.findingId, answers, scored);
    const dynamic = synthesizeLayerCopyFromKeywords(
      keywords,
      layer.asIsFa,
      layer.toBeFa,
      layer.actionsFa,
    );
    return {
      findingId: layer.findingId,
      titleFa: layer.titleFa,
      constructFa: layer.constructFa,
      asIsFa: dynamic.asIsFa,
      toBeFa: dynamic.toBeFa,
      actionsFa: dynamic.actionsFa,
      keywords,
    };
  });
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

export function buildDiagnosisReport(
  pack: AnalyzerPack,
  answers: Record<string, number | string>,
  snapshot: PackScore | null,
): DiagnosisReport {
  const scored = snapshot ?? scorePack(pack, answers);
  const layerDefs = layersOf(pack, answers, scored);
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
      canonicalCode: toCanonicalCode(layer.findingId),
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

  const total = asNumber(scored.scores["diagnosis-total"]);
  const allKeywords = layers.flatMap((layer) => layer.keywords);
  const causalGraph = buildRespondentCausalAnalysis(allKeywords);
  const nodeByKw = new Map(causalGraph.nodes.map((n) => [n.keywordId, n] as const));
  for (const kw of allKeywords) {
    const node = nodeByKw.get(kw.id);
    if (!node) continue;
    kw.rootCauseLeverageScore = node.rootCauseLeverageScore;
    if (node.upstreamInfluencers.length > 0) {
      kw.influencersFa = node.upstreamInfluencers.map((inf) => `${inf.titleFa} [${inf.canonicalCode}]`);
    }
    if (node.downstreamInfluenced.length > 0) {
      kw.influencedFa = node.downstreamInfluenced.map((dep) => `${dep.titleFa} [${dep.canonicalCode}]`);
    }
  }
  const ontology = buildOntologyDiagnosis(allKeywords);
  const patterns = matchingPatterns(pack, layerScores);

  return {
    interpretationVersion: pack.report?.interpretationVersion ?? INTERPRETATION_VERSION,
    instrumentVersion: scored.version,
    businessName,
    context,
    ontology,
    causalGraph,
    total,
    maturity: { id: maturityId, labelFa: maturityLabel(pack, maturityId) },
    bottleneck: bottleneck
      ? { id: bottleneck.id, titleFa: bottleneck.titleFa, score: bottleneck.score }
      : { id: "", titleFa: "", score: 0 },
    layers,
    patterns,
    closingFa:
      pack.report?.closingFa ??
      "نتیجهٔ این ارزیابی یک راهنمای ساختاری و تشخیصی است، نه حکم قطعی دربارهٔ شما یا کسب‌وکارتان.",
  };
}
