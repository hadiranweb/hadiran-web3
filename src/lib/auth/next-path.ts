/**
 * مقصد ورود فقط باید مسیر هم‌مبدأ باشد. هم شکل‌های آشکار redirect خارجی و هم
 * backslashهای literal/encoded رد می‌شوند تا نرمال‌سازی URL راه دور زدن نسازد.
 */
const INTERNAL_ORIGIN = "https://hadiran.invalid";

export function safeInternalNext(value: unknown, fallback = "/"): string {
  if (typeof value !== "string") return fallback;
  const raw = value.trim();
  if (
    !raw ||
    raw.length > 2048 ||
    !raw.startsWith("/") ||
    raw.startsWith("//") ||
    /[\\\u0000-\u001f\u007f]/.test(raw) ||
    /%5c/i.test(raw)
  ) {
    return fallback;
  }
  try {
    const parsed = new URL(raw, INTERNAL_ORIGIN);
    if (parsed.origin !== INTERNAL_ORIGIN) return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`.slice(0, 512);
  } catch {
    return fallback;
  }
}
