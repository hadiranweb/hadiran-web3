/**
 * تصمیم takeover صفحه‌های سایت — خالص و قابل تست.
 * فقط دادهٔ منتشرشدهٔ معتبر و غیرخالی می‌تواند جای نسخهٔ کدی بنشیند؛
 * هر چیز دیگری یعنی «نسخهٔ کدی فعلی را نشان بده».
 */
import { validateStudioData, type StudioData, type StudioTarget } from "./validate";

export function publishedTakeoverData(publishedData: unknown, target?: StudioTarget): StudioData | null {
  const data = validateStudioData(publishedData, { target, forPublish: true });
  if (!data) return null;
  if (!Array.isArray(data.content) || data.content.length === 0) return null;
  return data;
}
