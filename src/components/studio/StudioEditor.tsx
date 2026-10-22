"use client";

import "@puckeditor/core/puck.css";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// ادیتور سنگین است؛ فقط سمت کلاینت و تنبل بار می‌شود تا باندل عمومی سبک بماند.
const Puck = dynamic(() => import("@puckeditor/core").then((m) => m.Puck), { ssr: false });
import { studioConfig } from "@/lib/studio/config";
import { EMPTY_STUDIO_DATA, type StudioData } from "@/lib/studio/validate";
import { sitePageByTarget } from "@/lib/studio/site-pages";

type PageState = {
  id: string;
  slug: string;
  titleFa: string;
  status: string;
  target: string;
  seo: { title?: string; description?: string; index?: boolean };
};

const inputCls = "w-full rounded-xl border border-slate-300 px-3 py-2 text-sm";
const btnCls = "rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-50";
const ghostCls = "rounded-full border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 disabled:opacity-50";

export function StudioEditor({ id }: { id: string }) {
  const [page, setPage] = useState<PageState | null>(null);
  const [data, setData] = useState<StudioData>(EMPTY_STUDIO_DATA);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await fetch(`/api/workspace/studio/pages/${id}`);
      if (!res.ok) {
        if (!cancelled) setError("صفحه پیدا نشد یا استودیو آماده نیست (مایگریشن 0034).");
        return;
      }
      const json = (await res.json()) as { page: PageState & { draftData: StudioData } };
      if (cancelled) return;
      setPage(json.page);
      setData((json.page.draftData as StudioData) ?? EMPTY_STUDIO_DATA);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function saveDraft() {
    if (!page) return;
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/workspace/studio/pages/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titleFa: page.titleFa, slug: page.slug, data, seo: page.seo }),
    });
    setBusy(false);
    if (!res.ok) return setError("ذخیرهٔ پیش‌نویس نشد؛ داده یا اسلاگ نامعتبر است.");
    setNotice("پیش‌نویس ذخیره شد.");
  }

  async function refreshLivePreview() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/workspace/studio/pages/${id}/preview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data }),
    });
    setBusy(false);
    if (!res.ok) return setError("پیش‌نمایش زنده نشد.");
    const json = (await res.json()) as { data: StudioData };
    setData(json.data);
    setNotice("پیش‌نمایش با دادهٔ زنده به‌روز شد (هنگام ذخیره، آیتم‌ها ذخیره نمی‌شوند؛ فقط تنظیمات می‌ماند).");
  }

  async function publish() {
    setBusy(true);
    setError(null);
    await saveDraft();
    const res = await fetch(`/api/workspace/studio/pages/${id}/publish`, { method: "POST" });
    setBusy(false);
    if (!res.ok) return setError("انتشار نشد.");
    const json = (await res.json()) as { version?: number };
    setPage((p) => (p ? { ...p, status: "published" } : p));
    const siteDef = sitePageByTarget(page?.target);
    setNotice(
      siteDef
        ? `منتشر شد (نسخهٔ ${json.version ?? "؟"}) و روی مسیر واقعی ${siteDef.path} اعمال شد.`
        : `منتشر شد (نسخهٔ ${json.version ?? "؟"}). نشانی عمومی: /p/${page?.slug}`,
    );
  }

  if (!page) {
    return <p className="text-sm text-slate-500">{error ?? "در حال بارگذاری ادیتور…"}</p>;
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-700">{error}</p>}
      {notice && <p className="text-sm text-emerald-700">{notice}</p>}
      {sitePageByTarget(page.target) && (
        <p className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 text-sm leading-7 text-indigo-900">
          این صفحه، صفحهٔ واقعی «{sitePageByTarget(page.target)?.titleFa}» در مسیر{" "}
          <span dir="ltr">{sitePageByTarget(page.target)?.path}</span> است. تا وقتی منتشر نکنی، نسخهٔ فعلی سایت سر
          جایش می‌ماند؛ انتشار، بدنهٔ همان صفحه را با این بلوک‌ها جایگزین می‌کند و بایگانی/خالی‌کردن، نسخهٔ کدی را
          برمی‌گرداند. {sitePageByTarget(page.target)?.note}
        </p>
      )}
      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1 block text-xs text-slate-500">عنوان صفحه</span>
          <input className={inputCls} value={page.titleFa} onChange={(e) => setPage({ ...page, titleFa: e.target.value })} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-slate-500">{sitePageByTarget(page.target) ? "مسیر واقعی سایت (خودکار)" : "اسلاگ (نشانی /p/…)"}</span>
          <input
            dir="ltr"
            className={inputCls}
            disabled={Boolean(sitePageByTarget(page.target))}
            value={sitePageByTarget(page.target)?.path ?? page.slug}
            onChange={(e) => setPage({ ...page, slug: e.target.value })}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-slate-500">عنوان SEO</span>
          <input
            className={inputCls}
            value={page.seo.title ?? ""}
            onChange={(e) => setPage({ ...page, seo: { ...page.seo, title: e.target.value } })}
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-xs text-slate-500">توضیح SEO</span>
          <input
            className={inputCls}
            value={page.seo.description ?? ""}
            onChange={(e) => setPage({ ...page, seo: { ...page.seo, description: e.target.value } })}
          />
        </label>
        <div className="flex items-end gap-2">
          <button type="button" className={ghostCls} disabled={busy} onClick={() => void saveDraft()}>
            ذخیرهٔ پیش‌نویس
          </button>
          <button type="button" className={btnCls} disabled={busy} onClick={() => void publish()}>
            انتشار
          </button>
          <button type="button" className={ghostCls} disabled={busy} onClick={() => void refreshLivePreview()}>
            پیش‌نمایش دادهٔ زنده
          </button>
          <a
            className="text-sm font-bold text-indigo-700"
            href={sitePageByTarget(page.target)?.path ?? `/p/${page.slug}`}
            target="_blank"
            rel="noreferrer"
          >
            مشاهدهٔ عمومی
          </a>
        </div>
        <p className="text-xs text-slate-500 sm:col-span-3">
          وضعیت: {page.status === "published" ? "منتشرشده" : page.status === "archived" ? "بایگانی" : "پیش‌نویس"} —
          پیش‌نویس هیچ‌وقت عمومی نمی‌شود؛ انتشار، نسخهٔ تازه می‌سازد.
        </p>
      </div>

      <div dir="ltr" className="overflow-hidden rounded-2xl border border-slate-200 bg-white [&_.Puck]:min-h-[720px]">
        <Puck config={studioConfig} data={data as never} onChange={(next) => setData(next as StudioData)} />
      </div>
      <p className="text-xs leading-6 text-slate-500">
        بوم ادیتور چپ‌به‌راست می‌ماند؛ پیش‌نمایش داخل بوم راست‌به‌چپ و فارسی است. بلوک‌ها فقط از سیستم طراحی هادیران‌اند؛
        رنگ و فونت آزاد وجود ندارد.
      </p>
    </div>
  );
}
