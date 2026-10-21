import type { Metadata } from "next";
import Link from "next/link";
import { requirePageOwner } from "@/lib/auth/guard";
import { loadCopyOverview } from "@/lib/content/desk";
import { GROUP_LABELS } from "@/lib/content/registry";
import { PublicSourceNotice } from "@/components/ui/PublicSourceNotice";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "متن و نام",
  robots: { index: false, follow: false },
};

export default async function ContentDeskPage() {
  await requirePageOwner("/workspace/content");
  const { source, groups } = await loadCopyOverview();
  const total = groups.reduce((sum, group) => sum + group.total, 0);
  const overrides = groups.reduce((sum, group) => sum + group.overrides, 0);
  const drafts = groups.reduce((sum, group) => sum + group.drafts, 0);

  return (
    <div className="ws-page">
      <header className="ws-page-heading">
        <div>
          <p className="ws-overline">میز</p>
          <h1>متن و نام</h1>
          <p>
            نام، عنوان و متن‌هایی که تا امروز فقط با deploy عوض می‌شدند. پیش‌نویس بنویس، ببین، منتشر کن؛ مسیر URL
            عوض نمی‌شود.
          </p>
        </div>
      </header>

      <PublicSourceNotice source={source} />

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="surface p-4">
          <p className="ws-muted text-xs">کلید قابل ویرایش</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-ink">{total.toLocaleString("fa-IR")}</p>
        </div>
        <div className="surface p-4">
          <p className="ws-muted text-xs">منتشرشده روی پیش‌فرض</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-ink">{overrides.toLocaleString("fa-IR")}</p>
        </div>
        <div className="surface p-4">
          <p className="ws-muted text-xs">پیش‌نویس منتشرنشده</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-ink">{drafts.toLocaleString("fa-IR")}</p>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="mb-3 text-sm font-medium text-ink">گروه‌ها</h2>
        <div className="section-cards">
          {groups.map((group) => (
            <Link
              key={group.group}
              href={`/workspace/content/copy/${group.group}`}
              className="card-hover is-compact"
            >
              <span className="flex items-start justify-between gap-3">
                <span>
                  <strong className="block text-ink">{GROUP_LABELS[group.group].title}</strong>
                  <small className="mt-1 block leading-6 text-muted">{GROUP_LABELS[group.group].hint}</small>
                </span>
                <span className="shrink-0 text-end text-xs tabular-nums text-muted">
                  {group.overrides.toLocaleString("fa-IR")} / {group.total.toLocaleString("fa-IR")}
                  {group.drafts ? (
                    <small className="mt-1 block text-mark">{group.drafts.toLocaleString("fa-IR")} پیش‌نویس</small>
                  ) : null}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="surface mt-6 p-5 text-sm leading-7 text-muted">
        <p className="font-medium text-ink">در این فاز چه چیزی کنترل می‌شود؟</p>
        <p className="mt-2">
          متن‌های ثابت، نام اتاق‌ها، عنوان مرورگر و امضای فوتر. عنوان و متن نوشته‌ها، پروژه‌ها، دوره‌ها و کالاها
          همچنان در ویرایشگر خودشان می‌ماند؛ اینجا تکرار نمی‌شوند.
        </p>
        <p className="mt-2">
          ویرایشگر هویت («درباره من»: نام، معرفی، داستان، مسیر، آواتار، راه تماس) و انتخاب تیره در فازهای بعدی
          همین‌جا اضافه می‌شوند.
        </p>
      </section>
    </div>
  );
}
