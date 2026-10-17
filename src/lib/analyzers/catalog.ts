export type AnalyzerStatus = "preparing" | "open" | "archived";

export type Analyzer = {
  slug: string;
  nameFa: string;
  summaryFa: string;
  status: AnalyzerStatus;
};

/** فهرست ایستا. اجرای casio-ss روی /analyzers/casio-ss است. */
export const analyzers: Analyzer[] = [
  {
    slug: "casio-ss",
    nameFa: "عارضه‌یابی سازمانی",
    summaryFa:
      "ارزیابی الگوی ذهنی، زمینهٔ کسب‌وکار، و بیست سؤال پنج‌لایه روی مقیاس ۰ تا ۱۰. گزارش تفسیری در برش بعد.",
    status: "open",
  },
];

export function analyzerHref(item: Analyzer): string | null {
  if (item.status !== "open") return null;
  return `/analyzers/${item.slug}`;
}
