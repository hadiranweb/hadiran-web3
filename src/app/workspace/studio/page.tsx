import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StudioPagesClient } from "@/components/studio/StudioPagesClient";
import { listStudioPages, studioEnabled } from "@/lib/studio/pages";
import { SITE_PAGES } from "@/lib/studio/site-pages";
import { GROUP_LABELS, type CopyGroup } from "@/lib/content/registry";
import { requirePageOwner } from "@/lib/auth/guard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "استودیو",
  robots: { index: false, follow: false },
};

const STATUS_FA: Record<string, string> = { draft: "پیش‌نویس", published: "منتشرشده", archived: "بایگانی" };

function groupLabel(group: string): string {
  return (GROUP_LABELS as Record<string, { title: string }>)[group]?.title ?? group;
}

export default async function StudioListPage() {
  if (!studioEnabled()) notFound();
  await requirePageOwner("/workspace/studio");
  const { ready, pages } = await listStudioPages();
  const byTarget = new Map(pages.filter((p) => p.target.startsWith("site:")).map((p) => [p.target, p]));

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">استودیو هادیران</h1>
        <p className="mt-2 text-sm leading-7 text-slate-500">
          از این‌جا همهٔ صفحه‌های سایت کنترل می‌شوند: هر صفحهٔ واقعی یک صفحهٔ استودیویی متناظر دارد. تا وقتی برای
          صفحه‌ای چیزی منتشر نکنی، نسخهٔ فعلی‌اش بی‌کم‌وکاست می‌ماند؛ انتشار روی همان مسیر واقعی اعمال می‌شود.
          متن‌ها و نام‌های نسخهٔ فعلی هم از همین‌جا از «متن و نام» ویرایش می‌شوند. صفحه‌های مستقل تازه فقط از مسیر{" "}
          <span dir="ltr">/p/[slug]</span> بیرون می‌آیند.
        </p>
      </div>

      {!ready && (
        <p className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          جدول‌های استودیو هنوز در دیتابیس ساخته نشده‌اند (مایگریشن 0034)؛ تا اجرای آن، ساخت و ذخیرهٔ صفحه ممکن نیست.
        </p>
      )}

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-black text-slate-900">متن و نام</h2>
          <Link href="/workspace/content" className="rounded-full border border-slate-300 px-4 py-1.5 text-xs font-bold text-slate-700">
            باز کردن متن و نام
          </Link>
        </div>
        <p className="text-sm leading-7 text-slate-500">
          نام اتاق‌ها، تیترها، شعار و جمله‌های صفحه‌های فعلی سایت این‌جا ویرایش می‌شوند و بی‌درنگ روی نسخهٔ کدی اثر
          می‌گذارند. برای هر صفحه، گروه‌های متنش در فهرست زیر هم آمده است.
        </p>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(GROUP_LABELS) as CopyGroup[]).map((group) => (
            <Link
              key={group}
              href={`/workspace/content/copy/${group}`}
              className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200"
            >
              {GROUP_LABELS[group].title}
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-black text-slate-900">صفحه‌های سایت</h2>
        <p className="text-sm leading-7 text-slate-500">
          «ویرایش در استودیو» صفحهٔ استودیویی همان صفحهٔ واقعی را باز می‌کند (اگر نباشد ساخته می‌شود). انتشار، همان
          مسیر را با بلوک‌ها بازسازی می‌کند؛ بایگانی یا خالی‌گذاشتن صفحه، نسخهٔ کدی را برمی‌گرداند.
        </p>
        <ul className="space-y-2">
          {SITE_PAGES.map((def) => {
            const page = byTarget.get(`site:${def.key}`);
            return (
              <li key={def.key} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-bold text-slate-900">
                      {def.titleFa}{" "}
                      <span dir="ltr" className="text-xs font-normal text-slate-400">
                        {def.path}
                      </span>
                    </p>
                    <p className="mt-1 text-xs leading-6 text-slate-500">{def.note}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      وضعیت استودیو: {page ? (STATUS_FA[page.status] ?? page.status) : "هنوز صفحهٔ استودیویی ندارد — نسخهٔ کدی فعال است"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link href={def.path} className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-700">
                      مشاهدهٔ صفحه
                    </Link>
                    <Link
                      href={`/workspace/studio/site/${def.key}`}
                      className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-bold text-white"
                    >
                      ویرایش در استودیو
                    </Link>
                  </div>
                </div>
                {def.copyGroups.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-slate-400">متن و نام این صفحه:</span>
                    {def.copyGroups.map((group) => (
                      <Link
                        key={group}
                        href={`/workspace/content/copy/${group}`}
                        className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-200"
                      >
                        {groupLabel(group)}
                      </Link>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-black text-slate-900">صفحه‌های مستقل و همهٔ پیش‌نویس‌ها</h2>
        <StudioPagesClient
          initial={pages.map((p) => ({
            id: p.id,
            slug: p.slug,
            titleFa: p.titleFa,
            status: p.status,
            target: p.target,
            updatedAt: p.updatedAt ? new Date(p.updatedAt).toISOString() : null,
            publishedAt: p.publishedAt ? new Date(p.publishedAt).toISOString() : null,
          }))}
        />
      </section>
    </main>
  );
}
