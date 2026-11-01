import type { ComponentType, ReactNode } from "react";
import { StudioRender } from "./StudioRender";
import { getPublishedByTarget } from "@/lib/studio/pages";
import { resolveStudioData, type StudioResolveOptions } from "@/lib/studio/resolve";
import { siteTarget } from "@/lib/studio/site-pages";
import { publishedTakeoverData } from "@/lib/studio/takeover";

/**
 * دروازهٔ کنترل صفحه‌های سایت با استودیو.
 * اگر برای این صفحه snapshot معتبر و کامل منتشر شده باشد، همان روی مسیر واقعی رندر می‌شود؛
 * در غیر این صورت نسخهٔ کدی فعلی بی‌کم‌وکاست می‌ماند.
 */
export async function StudioTakeover({
  siteKey,
  children,
  renderContext,
  accountPanel,
}: {
  siteKey: string;
  children: ReactNode;
  renderContext?: StudioResolveOptions;
  accountPanel?: ReactNode;
}) {
  const page = await getPublishedByTarget(siteTarget(siteKey));
  const data = page ? publishedTakeoverData(page.publishedData, page.target) : null;
  if (!data) return <>{children}</>;
  const resolved = await resolveStudioData(data, { ...renderContext, mode: "public" });
  // صفحهٔ حساب گیت ورودش را بیرون takeover نگه می‌دارد و محتوای واقعیِ سروری‌اش را
  // فقط در جایگاه AccountPanel می‌گذارد؛ هیچ دادهٔ شخصی داخل JSON استودیو ذخیره نمی‌شود.
  return <StudioRender data={resolved} accountPanel={siteKey === "account" ? (accountPanel ?? children) : undefined} />;
}

/**
 * صفحهٔ کدی را به صفحه‌ای تحت کنترل استودیو تبدیل می‌کند؛ گیت احراز هویت پیش از takeover اجرا می‌شود.
 */
export function withStudioTakeover<P extends object>(
  siteKey: string,
  Page: ComponentType<P>,
  opts?: {
    gate?: (props: P) => Promise<void>;
    renderContext?: (props: P) => Promise<StudioResolveOptions>;
  },
): ComponentType<P> {
  return async function StudioControlledPage(props: P) {
    if (opts?.gate) await opts.gate(props);
    const renderContext = await opts?.renderContext?.(props);
    return (
      <StudioTakeover siteKey={siteKey} renderContext={renderContext}>
        <Page {...props} />
      </StudioTakeover>
    );
  };
}
