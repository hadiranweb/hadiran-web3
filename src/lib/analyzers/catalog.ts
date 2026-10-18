import { loadPacks } from "@/lib/analyzers/registry";
import type { AnalyzerPackStatus } from "@/lib/analyzers/pack";

export type AnalyzerStatus = "preparing" | "open" | "archived";

export type Analyzer = {
  slug: string;
  nameFa: string;
  summaryFa: string;
  status: AnalyzerStatus;
};

function hubStatus(status: AnalyzerPackStatus): AnalyzerStatus {
  if (status === "draft") return "preparing";
  return status;
}

export function analyzerHref(item: Analyzer): string | null {
  if (item.status !== "open") return null;
  return `/analyzers/${item.slug}`;
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
    }));
}
