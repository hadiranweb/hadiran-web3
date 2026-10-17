import { analyzerPacks } from "@/lib/analyzers/registry";
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

/** فهرست از packهای ثبت‌شده. اجرای باز روی /analyzers/[slug]. */
export const analyzers: Analyzer[] = analyzerPacks().map((pack) => ({
  slug: pack.slug,
  nameFa: pack.nameFa,
  summaryFa: pack.summaryFa,
  status: hubStatus(pack.status),
}));

export function analyzerHref(item: Analyzer): string | null {
  if (item.status !== "open") return null;
  return `/analyzers/${item.slug}`;
}
