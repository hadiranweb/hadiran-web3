export type AnalyzerStatus = "preparing" | "open" | "archived";

export type Analyzer = {
  slug: string;
  nameFa: string;
  summaryFa: string;
  status: AnalyzerStatus;
};

/** فهرست ایستا. جدول دیتابیس مال قدم اجرای آزمون است، نه این هب. */
export const analyzers: Analyzer[] = [
  {
    slug: "casio-ss",
    nameFa: "عارضه‌یابی سازمانی",
    summaryFa: "ارزیابی الگوی ذهنی و عارضه‌یابی چندلایه. صفحهٔ اجرا هنوز باز نشده.",
    status: "preparing",
  },
];

export function analyzerHref(item: Analyzer): string | null {
  if (item.status !== "open") return null;
  return `/analyzers/${item.slug}`;
}
