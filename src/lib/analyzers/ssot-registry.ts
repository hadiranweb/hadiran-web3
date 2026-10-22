/**
 * رجیستری مرکزی «منبع حقیقت واحد» (HADIRAN-SSOT-2.0.0) — فقط برای دو آزمون تازه.
 *
 * قفل جداسازی: کاسیو (casio-ss) و رباتش بیرون از این رجیستری‌اند و هیچ اتصال
 * بین‌دامنه‌ای (Bridge) وجود ندارد؛ هر آزمون دامنهٔ مستقل خودش را دارد.
 * این ماژول موجودیت‌های منظومهٔ «عارضه‌یابی سیستم کسب‌وکار» و «ارزیابی الگوی ذهنی»
 * (منابع علمی، مفاهیم، گویه‌ها، کلیدواژه‌ها، گراف علّی) را در یک نقطه تجمیع می‌کند.
 */

import { itemsOf, type AnalyzerPack, type Item } from "@/lib/analyzers/pack";
import { mindsetGatePack } from "@/lib/analyzers/mindset-gate/instrument";
import { systemDiagnosisPack } from "@/lib/analyzers/system-diagnosis/instrument";
import {
  CAUSAL_KEYWORD_EDGES,
  CODING_STANDARD_VERSION,
  KEYWORD_CANONICAL_CODES,
  LAYER_CANONICAL_CODES,
  buildCanonicalKeywordCausalProfiles,
  toCanonicalCode,
} from "@/lib/analyzers/system-diagnosis/coding-causal-graph";
import {
  KEYWORD_ONTOLOGY,
  RESEARCH_SOURCES,
  VAULT_CONCEPTS,
} from "@/lib/analyzers/system-diagnosis/ontology-graph";
import {
  DIAG_DIMENSIONS,
  SCR_ITEMS,
} from "@/lib/analyzers/system-diagnosis/deep-dive-a3";
import {
  INTERPRETATION_VERSION,
  diagnosisKeywordEdges,
  layerCopy,
} from "@/lib/analyzers/system-diagnosis/interpretation";
import { SOLO_CORE_PROCESSES } from "@/lib/analyzers/system-diagnosis/context-modulation";

export const HADIRAN_SSOT_VERSION = "HADIRAN-SSOT-2.0.0";

export type CanonicalDomainCode = "DOM.SYSTEM_DIAGNOSIS" | "DOM.MINDSET_GATE";

export type CanonicalItemRecord = {
  legacyId: string;
  canonicalCode: string;
  axis: "CTX" | "ITM";
  domainCanonicalCode: CanonicalDomainCode;
  tier: "BIZ" | "FL" | "SCR" | "DIAG" | "MND";
  textFa: string;
  reverse?: boolean;
};

/** فهرست یکپارچهٔ ۱۰۷ گویهٔ استاندارد دو دامنه (بدون هیچ گویه‌ای از کاسیو). */
export function listAllCanonicalItems(): CanonicalItemRecord[] {
  const records: CanonicalItemRecord[] = [];

  for (const item of itemsOf(systemDiagnosisPack) as Item[]) {
    const isCtx = item.id.startsWith("BIZ.");
    records.push({
      legacyId: item.id,
      canonicalCode: toCanonicalCode(item.id),
      axis: isCtx ? "CTX" : "ITM",
      domainCanonicalCode: "DOM.SYSTEM_DIAGNOSIS",
      tier: isCtx ? "BIZ" : "FL",
      textFa: item.text,
      reverse: item.kind === "range" ? Boolean(item.reverse) : false,
    });
  }
  for (const scr of SCR_ITEMS) {
    records.push({
      legacyId: scr.id,
      canonicalCode: toCanonicalCode(scr.id),
      axis: "ITM",
      domainCanonicalCode: "DOM.SYSTEM_DIAGNOSIS",
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
        domainCanonicalCode: "DOM.SYSTEM_DIAGNOSIS",
        tier: "DIAG",
        textFa: diag.text,
        reverse: Boolean(diag.reverse),
      });
    }
  }
  for (const mnd of itemsOf(mindsetGatePack) as Item[]) {
    records.push({
      legacyId: mnd.id,
      canonicalCode: toCanonicalCode(mnd.id),
      axis: "ITM",
      domainCanonicalCode: "DOM.MINDSET_GATE",
      tier: "MND",
      textFa: mnd.text,
      reverse: mnd.kind === "range" ? Boolean(mnd.reverse) : false,
    });
  }
  return records;
}

/** پک‌های کانونیکال این رجیستری؛ کاسیو عمداً این‌جا نیست. */
export function buildAllCanonicalPacks(): AnalyzerPack[] {
  return [systemDiagnosisPack, mindsetGatePack];
}

export function getCanonicalPackBySlug(slug: string): AnalyzerPack | null {
  if (slug === "system-diagnosis") return systemDiagnosisPack;
  if (slug === "mindset-gate") return mindsetGatePack;
  return null;
}

/** خلاصهٔ ساختاری برای ممیزی و تست: شمارش موجودیت‌ها و پروفایل‌های علّی. */
export function getSsotManifestSummary() {
  const allItems = listAllCanonicalItems();
  const subKeywordCount = layerCopy.reduce(
    (sum, layer) => sum + layer.keywords.reduce((kSum, kw) => kSum + (kw.subKeywords?.length ?? 0), 0),
    0,
  );
  const causalProfiles = buildCanonicalKeywordCausalProfiles({});
  return {
    ssotVersion: HADIRAN_SSOT_VERSION,
    codingStandardVersion: CODING_STANDARD_VERSION,
    interpretationVersion: INTERPRETATION_VERSION,
    counts: {
      domains: 2,
      layers: Object.keys(LAYER_CANONICAL_CODES).length,
      keywords: Object.keys(KEYWORD_CANONICAL_CODES).length,
      subKeywords: subKeywordCount,
      measurementEdges: diagnosisKeywordEdges.length,
      causalEdges: CAUSAL_KEYWORD_EDGES.length,
      ontologyEntries: KEYWORD_ONTOLOGY.length,
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

export { RESEARCH_SOURCES, VAULT_CONCEPTS, KEYWORD_ONTOLOGY };
