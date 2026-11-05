import { loadPacks } from "@/lib/analyzers/registry";
import type { AnalyzerPackStatus } from "@/lib/analyzers/pack";

import type { Analyzer,AnalyzerStatus } from "./catalog-types";
export { analyzerHref } from "./catalog-types";
export type { Analyzer,AnalyzerStatus } from "./catalog-types";

function hubStatus(status: AnalyzerPackStatus): AnalyzerStatus {
  if (status === "draft") return "preparing";
  return status;
}

/** فهرست عمومی: پیش‌نویس‌های تألیف‌شده روی هب نمی‌آیند. */
export async function loadAnalyzers(): Promise<Analyzer[]> {
  const packs = await loadPacks();
  return packs
    .filter((pack) => pack.status !== "draft")
    .map((pack) => ({
      slug: pack.slug,
      nameFa: pack.nameFa,
      summaryFa: pack.summaryFa,
      status: hubStatus(pack.status),
      sectionCount: pack.sections.length,
      questionCount: pack.sections.reduce((sum,section)=>sum+section.items.length,0),
    }));
}
