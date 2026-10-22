import { analyzerPublicPath } from "@/lib/analyzers/paths";
import { loadPacks } from "@/lib/analyzers/registry";
import { estimatePack, estimateLabelFa, type PackEstimate } from "@/lib/analyzers/estimate";
import type { AnalyzerPackStatus } from "@/lib/analyzers/pack";

export type AnalyzerStatus = "preparing" | "open" | "archived";

export type Analyzer = {
  slug: string;
  nameFa: string;
  summaryFa: string;
  status: AnalyzerStatus;
  /** از ساختار خودِ pack خوانده می‌شود، نه متن ثابت. */
  estimate: PackEstimate;
  estimateLabelFa: string;
};

function hubStatus(status: AnalyzerPackStatus): AnalyzerStatus {
  if (status === "draft") return "preparing";
  return status;
}

export function analyzerHref(item: Analyzer): string | null {
  if (item.status !== "open") return null;
  return analyzerPublicPath(item.slug);
}

/** فهرست عمومی: پیش‌نویس‌های تألیف‌شده روی هب نمی‌آیند. */
export async function loadAnalyzers(): Promise<Analyzer[]> {
  const packs = await loadPacks();
  return packs
    .filter((pack) => pack.status !== "draft")
    .map((pack) => {
      const estimate = estimatePack(pack.sections);
      return {
        slug: pack.slug,
        nameFa: pack.nameFa,
        summaryFa: pack.summaryFa,
        status: hubStatus(pack.status),
        estimate,
        estimateLabelFa: estimateLabelFa(estimate.minutes),
      };
    });
}
