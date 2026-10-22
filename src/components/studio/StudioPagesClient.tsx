"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type StudioPageListItem = {
  id: string;
  slug: string;
  titleFa: string;
  status: string;
  updatedAt: string | null;
  publishedAt: string | null;
};

const inputCls = "rounded-xl border border-slate-300 px-3 py-2 text-sm";
const btnCls = "rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-50";
const ghostCls = "rounded-full border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-700 disabled:opacity-50";

const STATUS_FA: Record<string, string> = { draft: "پیش‌نویس", published: "منتشرشده", archived: "بایگانی" };

export function StudioPagesClient({ initial }: { initial: StudioPageListItem[] }) {
  const router = useRouter();
  const [pages, setPages] = useState(initial);
  const [slug, setSlug] = useState("");
  const [titleFa, setTitleFa] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/workspace/studio/pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, titleFa }),
    });
    setBusy(false);
    if (!res.ok) return setError("ساخته نشد؛ اسلاگ باید یکتا و لاتین باشد.");
    const json = (await res.json()) as { page: StudioPageListItem };
    setPages([json.page, ...pages]);
    setSlug("");
    setTitleFa("");
    router.push(`/workspace/studio/${json.page.id}`);
  }

  async function act(id: string, action: "publish" | "archive" | "duplicate") {
    setBusy(true);
    const res = await fetch(`/api/workspace/studio/pages/${id}/${action}`, { method: "POST" });
    setBusy(false);
    if (!res.ok) return setError("انجام نشد.");
    router.refresh();
    const list = await (await fetch("/api/workspace/studio/pages")).json();
    setPages(list.pages ?? []);
  }

  return (
    <div className="space-y-5">
      {error && <p className="text-sm text-red-700">{error}</p>}
      <div className="flex flex-wrap items-end gap-2 rounded-2xl border border-slate-200 bg-white p-4">
        <label className="block">
          <span className="mb-1 block text-xs text-slate-500">عنوان صفحهٔ تازه</span>
          <input className={inputCls} value={titleFa} onChange={(e) => setTitleFa(e.target.value)} placeholder="مثلاً: لندینگ سیستم‌سازی" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-slate-500">اسلاگ (لاتین)</span>
          <input dir="ltr" className={inputCls} value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="system-landing" />
        </label>
        <button type="button" className={btnCls} disabled={busy || !slug || !titleFa} onClick={() => void create()}>
          + ساخت و ورود به ادیتور
        </button>
      </div>

      {pages.length === 0 ? (
        <p className="text-sm text-slate-500">هنوز صفحه‌ای ساخته نشده است.</p>
      ) : (
        <ul className="space-y-2">
          {pages.map((page) => (
            <li key={page.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white p-4">
              <div>
                <p className="font-bold text-slate-900">{page.titleFa}</p>
                <p className="mt-1 text-xs text-slate-500">
                  <span dir="ltr">/p/{page.slug}</span> · {STATUS_FA[page.status] ?? page.status}
                  {page.updatedAt ? ` · ویرایش: ${new Date(page.updatedAt).toLocaleString("fa-IR")}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <a className={ghostCls} href={`/workspace/studio/${page.id}`}>
                  ویرایش
                </a>
                <button type="button" className={ghostCls} disabled={busy} onClick={() => void act(page.id, "publish")}>
                  انتشار
                </button>
                <button type="button" className={ghostCls} disabled={busy} onClick={() => void act(page.id, "duplicate")}>
                  رونوشت
                </button>
                <button type="button" className={ghostCls} disabled={busy} onClick={() => void act(page.id, "archive")}>
                  بایگانی
                </button>
                {page.status === "published" && (
                  <a className={ghostCls} href={`/p/${page.slug}`} target="_blank" rel="noreferrer">
                    مشاهده
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
