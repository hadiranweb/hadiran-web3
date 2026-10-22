import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StudioPagesClient } from "@/components/studio/StudioPagesClient";
import { listStudioPages, studioEnabled } from "@/lib/studio/pages";
import { requirePageOwner } from "@/lib/auth/guard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "استودیو",
  robots: { index: false, follow: false },
};

export default async function StudioListPage() {
  if (!studioEnabled()) notFound();
  await requirePageOwner("/workspace/studio");
  const { ready, pages } = await listStudioPages();
  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">استودیو هادیران</h1>
      <p className="text-sm leading-7 text-slate-500">
        صفحه‌ساز بلوکی هادیران: صفحه‌های عمومی تازه را از بلوک‌های مجاز سیستم طراحی بساز، پیش‌نویس نگه دار و با
        انتشار، نسخه‌دار کن. خروجی عمومی فقط از مسیر <span dir="ltr">/p/[slug]</span> و فقط نسخهٔ منتشرشده است.
      </p>
      {!ready && (
        <p className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          جدول‌های استودیو هنوز در دیتابیس ساخته نشده‌اند (مایگریشن 0034)؛ تا اجرای آن، ساخت و ذخیرهٔ صفحه ممکن نیست.
        </p>
      )}
      <StudioPagesClient
        initial={pages.map((p) => ({
          id: p.id,
          slug: p.slug,
          titleFa: p.titleFa,
          status: p.status,
          updatedAt: p.updatedAt ? new Date(p.updatedAt).toISOString() : null,
          publishedAt: p.publishedAt ? new Date(p.publishedAt).toISOString() : null,
        }))}
      />
    </main>
  );
}
