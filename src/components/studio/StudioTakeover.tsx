import type { ComponentType, ReactNode } from "react";
import { StudioRender } from "./StudioRender";
import { getPublishedByTarget } from "@/lib/studio/pages";
import { resolveStudioData } from "@/lib/studio/resolve";
import { siteTarget } from "@/lib/studio/site-pages";
import { publishedTakeoverData } from "@/lib/studio/takeover";

/**
 * دروازهٔ کنترل صفحه‌های سایت با استودیو.
 * اگر برای این صفحه در استودیو نسخهٔ منتشرشده‌ای هست، همان روی مسیر واقعی
 * رندر می‌شود؛ وگرنه نسخهٔ کدی فعلی (children) بی‌کم‌وکاست می‌ماند.
 * Fail-soft: استودیو خاموش، دیتابیس نبودن یا دادهٔ نامعتبر یعنی نسخهٔ کدی.
 */
export async function StudioTakeover({ siteKey, children }: { siteKey: string; children: ReactNode }) {
  const page = await getPublishedByTarget(siteTarget(siteKey));
  const data = page ? publishedTakeoverData(page.publishedData) : null;
  if (!data) return <>{children}</>;
  const resolved = await resolveStudioData(data);
  return <StudioRender data={resolved} />;
}

/**
 * صفحهٔ کدی را به صفحه‌ای تحت کنترل استودیو تبدیل می‌کند؛ بدنه و متادیتای صفحه دست نمی‌خورد.
 * `gate` پیش از تصمیم takeover اجرا می‌شود تا گیت‌های احراز هویت صفحه‌های کارکردی
 * (مثل حساب و ورود) با انتشار نسخهٔ استودیویی دور نخورند.
 */
export function withStudioTakeover<P extends object>(
  siteKey: string,
  Page: ComponentType<P>,
  opts?: { gate?: (props: P) => Promise<void> },
): ComponentType<P> {
  return async function StudioControlledPage(props: P) {
    if (opts?.gate) await opts.gate(props);
    return (
      <StudioTakeover siteKey={siteKey}>
        <Page {...props} />
      </StudioTakeover>
    );
  };
}
