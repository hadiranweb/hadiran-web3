/** آدرس عمومی هر آزمون همان `/analyzers/{slug}` است؛ URL تازه ساخته نمی‌شود. */

export function analyzerPublicPath(slug: string) {
  return `/analyzers/${slug.replace(/^\/+|\/+$/g, "")}`;
}

/** سطح اجرای آزمون (لندینگ/فرم/گزارش) — هب `/analyzers` نیست. */
export function isAnalyzerExamPath(pathname: string) {
  if (!pathname.startsWith("/analyzers/")) return false;
  return pathname.length > "/analyzers/".length;
}
