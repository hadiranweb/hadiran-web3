/**
 * رجیستری مرکزی «منبع حقیقت واحد» (Single Source of Truth — HADIRAN-SSOT-2.0.0)
 * مخزن مرجع: hadiranweb/hadiran-web3 (شاخهٔ arena/1b7c6093-hadiran-web3)
 *
 * این ماژول تمامی موجودیت‌های سابقاً پراکنده در فایل‌های YAML/Drive (شامل ۵۵ منبع علمی S001..S055،
 * مفاهیم مخزن دانش Research Vaults، بانک ۱۰۷ گویهٔ استاندارد، ۱۵ کلیدواژه و ۷۵ زیرکلیدواژه،
 * استاندارد کدینگ ده-محوری HADIRAN-CODING-2.0.0، ماتریس اندازه‌گیری چندبه‌چند و گراف علّی
 * مؤثرها و متأثرها DEMATEL/ISM/MICMAC) را در یک نقطهٔ واحد درون کدبیس تجمیع می‌کند.
 */

import { itemsOf, type AnalyzerPack, type Item } from "@/lib/analyzers/pack";
import { mindsetGatePack } from "@/lib/analyzers/mindset-gate/instrument";
import { buildCasioAuthoredPack } from "@/lib/analyzers/casio-ss/authored-pack";
import {
  CAUSAL_KEYWORD_EDGES,
  CODING_STANDARD_VERSION,
  DIMENSION_CANONICAL_CODES,
  DOMAIN_CANONICAL_CODES,
  KEYWORD_CANONICAL_CODES,
  KEYWORD_ISM_LEVELS,
  LAYER_CANONICAL_CODES,
  buildCanonicalKeywordCausalProfiles,
  buildRespondentCausalAnalysis,
  computeDematelTotalMatrix,
  fromCanonicalCode,
  toCanonicalCode,
  type CausalKeywordEdge,
  type EntityAxisCode,
  type KeywordCausalProfile,
  type RespondentCausalGraphSummary,
} from "@/lib/analyzers/casio-ss/coding-causal-graph";
import {
  SOLO_CORE_PROCESSES,
  SIZE_WEIGHT_MATRIX,
  TYPE_WEIGHT_MATRIX,
} from "@/lib/analyzers/casio-ss/context-modulation";
import {
  DIAG_DIMENSIONS,
  SCR_ITEMS,
  buildA3ActionSheet,
  buildAdaptiveDeepDiveSummary,
} from "@/lib/analyzers/casio-ss/deep-dive-a3";
import {
  SYNTHETIC_ARCHETYPES,
  resolveInterDomainBridge,
  runArchetypeCalibrationSuite,
} from "@/lib/analyzers/casio-ss/domain-bridge";
import {
  INTERPRETATION_VERSION,
  casioKeywordEdges,
  casioKeywords,
  crossPatterns,
  layerBands,
  layerCopy,
} from "@/lib/analyzers/casio-ss/interpretation";
import {
  KEYWORD_ONTOLOGY,
  RESEARCH_SOURCES,
  VAULT_CONCEPTS,
  buildOntologyDiagnosis,
} from "@/lib/analyzers/casio-ss/ontology-graph";

export const HADIRAN_SSOT_VERSION = "HADIRAN-SSOT-2.0.0";
export const HADIRAN_SSOT_REPOSITORY = "hadiranweb/hadiran-web3";
export const HADIRAN_SSOT_BRANCH = "arena/1b7c6093-hadiran-web3";

export type CanonicalItemRecord = {
  legacyId: string;
  canonicalCode: string;
  axis: "CTX" | "ITM";
  domainCanonicalCode: "DOM.CASIO_SS" | "DOM.MINDSET_GATE";
  tier: "BIZ" | "FL" | "SCR" | "DIAG" | "MND";
  textFa: string;
  reverse?: boolean;
};

/**
 * استخراج فهرست کامل و یکپارچهٔ تمام ۱۰۷ گویهٔ استاندارد از منبع حقیقت واحد:
 * - ۶ گویهٔ زمینهٔ کسب‌وکار (CTX.BIZ.01..06)
 * - ۲۰ گویهٔ پنج‌لایهٔ هسته (ITM.FL.L1.Q1..L5.Q4)
 * - ۱۵ گویهٔ غربالگری سریع (ITM.SCR.S01..S15)
 * - ۵۴ گویهٔ کاوش عمیق در ۹ بُعد (ITM.DIAG.D1.01..D9.06)
 * - ۱۲ گویهٔ دروازهٔ الگوی ذهنی (ITM.MND.A1..C4)
 */
export function listAllCanonicalItems(): CanonicalItemRecord[] {
  const casioPack = buildCasioAuthoredPack();
  const baseItems: Item[] = itemsOf(casioPack);
  const records: CanonicalItemRecord[] = [];

  for (const item of baseItems) {
    const isCtx = item.id.startsWith("BIZ.");
    records.push({
      legacyId: item.id,
      canonicalCode: toCanonicalCode(item.id),
      axis: isCtx ? "CTX" : "ITM",
      domainCanonicalCode: "DOM.CASIO_SS",
      tier: isCtx ? "BIZ" : "FL",
      textFa: item.text,
      reverse: Boolean(item.reverse),
    });
  }

  for (const scr of SCR_ITEMS) {
    records.push({
      legacyId: scr.id,
      canonicalCode: toCanonicalCode(scr.id),
      axis: "ITM",
      domainCanonicalCode: "DOM.CASIO_SS",
      tier: "SCR",
      textFa: scr.text,
      reverse: Boolean(scr.reverse),
    });
  }

  for (const dim of DIAG_DIMENSIONS) {
    for (const diag of dim.items) {
      records.push({
        legacyId: diag.id,
        canonicalCode: toCanonicalCode(diag.id),
        axis: "ITM",
        domainCanonicalCode: "DOM.CASIO_SS",
        tier: "DIAG",
        textFa: diag.text,
        reverse: Boolean(diag.reverse),
      });
    }
  }

  for (const mnd of itemsOf(mindsetGatePack)) {
    records.push({
      legacyId: mnd.id,
      canonicalCode: toCanonicalCode(mnd.id),
      axis: "ITM",
      domainCanonicalCode: "DOM.MINDSET_GATE",
      tier: "MND",
      textFa: mnd.text,
      reverse: Boolean(mnd.reverse),
    });
  }

  return records;
}

/**
 * فهرست پک‌های استاندارد منبع حقیقت واحد برای کاشت خودکار در دیتابیس (DB Seeding) و اجرای زنده.
 */
export function buildAllCanonicalPacks(): AnalyzerPack[] {
  return [buildCasioAuthoredPack(), mindsetGatePack];
}

export function getCanonicalPackBySlug(slug: string): AnalyzerPack | null {
  if (slug === "casio-ss") return buildCasioAuthoredPack();
  if (slug === "mindset-gate") return mindsetGatePack;
  return null;
}

/**
 * خلاصهٔ آماری و ساختاری منبع حقیقت واحد (برای ممیزی، تست خودکار و داشبورد Workspace)
 */
export function getSsotManifestSummary() {
  const allItems = listAllCanonicalItems();
  const subKeywordCount = layerCopy.reduce(
    (sum, layer) =>
      sum +
      layer.keywords.reduce((kSum, kw) => kSum + (kw.subKeywords?.length ?? 0), 0),
    0,
  );
  const causalProfiles = buildCanonicalKeywordCausalProfiles(
    Object.fromEntries(casioKeywords.map((k) => [k.id, k.labelFa])),
  );

  return {
    ssotVersion: HADIRAN_SSOT_VERSION,
    codingStandardVersion: CODING_STANDARD_VERSION,
    interpretationVersion: INTERPRETATION_VERSION,
    repository: HADIRAN_SSOT_REPOSITORY,
    branch: HADIRAN_SSOT_BRANCH,
    counts: {
      domains: Object.keys(DOMAIN_CANONICAL_CODES).length,
      layers: Object.keys(LAYER_CANONICAL_CODES).length,
      keywords: Object.keys(KEYWORD_CANONICAL_CODES).length,
      subKeywords: subKeywordCount,
      measurementEdges: casioKeywordEdges.length,
      causalEdges: CAUSAL_KEYWORD_EDGES.length,
      researchSources: Object.keys(RESEARCH_SOURCES).length,
      vaultConcepts: Object.keys(VAULT_CONCEPTS).length,
      soloProcesses: SOLO_CORE_PROCESSES.length,
      deepDiveDimensions: DIAG_DIMENSIONS.length,
      totalCanonicalItems: allItems.length,
      itemsByTier: {
        BIZ: allItems.filter((i) => i.tier === "BIZ").length,
        FL: allItems.filter((i) => i.tier === "FL").length,
        SCR: allItems.filter((i) => i.tier === "SCR").length,
        DIAG: allItems.filter((i) => i.tier === "DIAG").length,
        MND: allItems.filter((i) => i.tier === "MND").length,
      },
    },
    causalProfiles,
  };
}

export {
  CAUSAL_KEYWORD_EDGES,
  CODING_STANDARD_VERSION,
  DIAG_DIMENSIONS,
  DIMENSION_CANONICAL_CODES,
  DOMAIN_CANONICAL_CODES,
  INTERPRETATION_VERSION,
  KEYWORD_CANONICAL_CODES,
  KEYWORD_ISM_LEVELS,
  KEYWORD_ONTOLOGY,
  LAYER_CANONICAL_CODES,
  RESEARCH_SOURCES,
  SCR_ITEMS,
  SIZE_WEIGHT_MATRIX,
  SOLO_CORE_PROCESSES,
  SYNTHETIC_ARCHETYPES,
  TYPE_WEIGHT_MATRIX,
  VAULT_CONCEPTS,
  buildA3ActionSheet,
  buildAdaptiveDeepDiveSummary,
  buildCanonicalKeywordCausalProfiles,
  buildOntologyDiagnosis,
  buildRespondentCausalAnalysis,
  casioKeywordEdges,
  casioKeywords,
  computeDematelTotalMatrix,
  crossPatterns,
  fromCanonicalCode,
  layerBands,
  layerCopy,
  resolveInterDomainBridge,
  runArchetypeCalibrationSuite,
  toCanonicalCode,
  type CausalKeywordEdge,
  type EntityAxisCode,
  type KeywordCausalProfile,
  type RespondentCausalGraphSummary,
};
