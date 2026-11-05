import { analyzerPublicPath } from "@/lib/analyzers/paths";
export type AnalyzerStatus = "preparing" | "open" | "archived";

export type Analyzer = {
  slug: string;
  nameFa: string;
  summaryFa: string;
  status: AnalyzerStatus;
  sectionCount?: number;
  questionCount?: number;
};

export function analyzerHref(item: Analyzer): string | null {
  if (item.status !== "open") return null;
  return analyzerPublicPath(item.slug);
}

