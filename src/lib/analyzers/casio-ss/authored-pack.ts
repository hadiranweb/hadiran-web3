/** بذر اولیهٔ casio-ss برای تألیف؛ بعد از اولین ذخیره، DB منبع است. */

import type { AnalyzerPack, Finding, Keyword } from "@/lib/analyzers/pack";
import { DEFAULT_USER_SUMMARY } from "@/lib/analyzers/summary-template";
import { casioSsPack } from "./instrument";
import { INTERPRETATION_VERSION, crossPatterns, layerBands, layerCopy } from "./interpretation";

export function buildCasioAuthoredPack(): AnalyzerPack {
  const pack = JSON.parse(JSON.stringify(casioSsPack)) as AnalyzerPack;
  const byFinding = new Map(layerCopy.map((layer) => [layer.findingId, layer]));
  pack.findings = pack.findings.map((finding) => {
    const layer = byFinding.get(finding.id);
    if (!layer) return finding;
    const next: Finding = {
      ...finding,
      constructFa: layer.constructFa,
      asIsFa: layer.asIsFa,
      toBeFa: layer.toBeFa,
      actionsFa: layer.actionsFa,
    };
    return next;
  });
  const children = new Map<string, string[]>();
  for (const layer of layerCopy) {
    for (const keyword of layer.keywords) children.set(keyword.id, keyword.children);
  }
  pack.keywords = pack.keywords.map((keyword) => {
    const kids = children.get(keyword.id);
    const next: Keyword = kids?.length ? { ...keyword, children: kids } : keyword;
    return next;
  });
  pack.report = {
    hideGateScores: true,
    interpretationVersion: INTERPRETATION_VERSION,
    documentTemplateId: "casio-ss",
    userSummaryTemplateFa: DEFAULT_USER_SUMMARY,
    closingFa: "نتیجهٔ این ارزیابی یک راهنمای کلی است، نه حکم قطعی دربارهٔ شما یا کسب‌وکارتان.",
    businessNameItemId: "BIZ.1",
    contextFields: [
      { id: "BIZ.2", labelFa: "نوع کسب‌وکار" },
      { id: "BIZ.3", labelFa: "حیطهٔ فعالیت" },
      { id: "BIZ.4", labelFa: "تعداد پرسنل" },
      { id: "BIZ.5", labelFa: "سابقهٔ مدیر" },
      { id: "BIZ.6", labelFa: "قدمت کسب‌وکار" },
    ],
    layerBands,
    crossPatterns,
  };
  return pack;
}
