"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Save, Loader2, Layers } from "lucide-react";
import { MarkdownReadonly } from "@/components/MarkdownReadonly";
import { slugify } from "@/lib/markdown";
import { slidesFromBody } from "@/lib/slides-from-body";
import type { KnowledgeSlide } from "@/components/knowledge/SlideReader";

const TYPES = [
  { value: "article", label: "مقاله" },
  { value: "note", label: "یادداشت" },
  { value: "research", label: "تحقیق" },
  { value: "wiki", label: "ویکی" },
  { value: "idea", label: "ایده" },
] as const;

export type KnowledgeDraft = {
  id?: number;
  slug: string;
  type: (typeof TYPES)[number]["value"];
  titleFa: string;
  titleEn?: string | null;
  summaryFa?: string | null;
  bodyFa?: string | null;
  slides: KnowledgeSlide[];
};

type SlideDraft = {
  id?: number;
  titleFa: string;
  titleEn: string;
  bodyFa: string;
  bodyEn: string;
};

export function KnowledgeComposer({
  mode,
  initial,
}: {
  mode: "create" | "edit";
  initial?: KnowledgeDraft;
}) {
  const router = useRouter();
  const [titleFa, setTitleFa] = useState(initial?.titleFa ?? "");
  const [titleEn, setTitleEn] = useState(initial?.titleEn ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [type, setType] = useState<(typeof TYPES)[number]["value"]>(initial?.type ?? "article");
  const [summaryFa, setSummaryFa] = useState(initial?.summaryFa ?? "");
  const [bodyFa, setBodyFa] = useState(initial?.bodyFa ?? "");
  const [slides, setSlides] = useState<SlideDraft[]>(
    (initial?.slides ?? []).map((s) => ({
      id: s.id,
      titleFa: s.titleFa ?? "",
      titleEn: s.titleEn ?? "",
      bodyFa: s.bodyFa ?? "",
      bodyEn: s.bodyEn ?? "",
    }))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);

  const computedSlug = useMemo(() => {
    if (slugTouched) return slug;
    return slugify(titleEn || titleFa);
  }, [slug, slugTouched, titleEn, titleFa]);

  function updateSlide(index: number, patch: Partial<SlideDraft>) {
    setSlides((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function handleSlidesFromBody() {
    setError(null);
    if (!bodyFa.trim()) {
      setError("اول بدنهٔ Markdown را بنویس، بعد تبدیل به اسلاید.");
      return;
    }
    const hasContent = slides.some((s) => s.titleFa.trim() || s.bodyFa.trim());
    if (hasContent) {
      const ok = window.confirm("اسلایدهای فعلی با عرشهٔ ساخته‌شده از متن جایگزین می‌شوند. ادامه می‌دهی؟");
      if (!ok) return;
    }
    const generated = slidesFromBody({ titleFa, summaryFa, bodyFa });
    if (generated.length === 0) {
      setError("از این متن اسلایدی ساخته نشد.");
      return;
    }
    setSlides(
      generated.map((slide) => ({
        titleFa: slide.titleFa,
        titleEn: "",
        bodyFa: slide.bodyFa,
        bodyEn: "",
      }))
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const finalSlug = computedSlug;
    if (titleFa.trim().length < 3 || !finalSlug) {
      setError("عنوان فارسی و اسلاگ لاتین لازم است.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        slug: finalSlug,
        type,
        titleFa: titleFa.trim(),
        titleEn: titleEn.trim() || null,
        summaryFa: summaryFa.trim() || null,
        bodyFa: bodyFa.trim() || null,
        slides: slides.map((s, i) => ({
          id: s.id,
          sortOrder: i,
          titleFa: s.titleFa,
          titleEn: s.titleEn,
          bodyFa: s.bodyFa,
          bodyEn: s.bodyEn,
        })),
      };

      const url =
        mode === "create" ? "/api/knowledge" : `/api/knowledge/${initial?.slug ?? finalSlug}`;
      const res = await fetch(url, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { slug?: string; error?: string };
      if (!res.ok) throw new Error(data.error || "ذخیره ناموفق بود");
      router.push(`/knowledge/${data.slug || finalSlug}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "ذخیره ناموفق بود");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700">عنوان فارسی</span>
          <input
            value={titleFa}
            onChange={(e) => setTitleFa(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700">عنوان انگلیسی</span>
          <input
            dir="ltr"
            value={titleEn}
            onChange={(e) => setTitleEn(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700">اسلاگ (URL لاتین)</span>
          <input
            dir="ltr"
            value={computedSlug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(slugify(e.target.value));
            }}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-mono text-sm outline-none focus:border-indigo-500"
          />
          <span className="text-xs text-slate-400">از عنوان انگلیسی ساخته می‌شود؛ حروف لاتین لازم است.</span>
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700">نوع</span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as (typeof TYPES)[number]["value"])}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-slate-700">خلاصه</span>
        <textarea
          value={summaryFa}
          onChange={(e) => setSummaryFa(e.target.value)}
          rows={3}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
        />
      </label>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700">بدنه (Markdown)</span>
          <button
            type="button"
            onClick={() => setPreview((v) => !v)}
            className="text-xs font-medium text-indigo-600"
          >
            {preview ? "ویرایش" : "پیش‌نمایش"}
          </button>
        </div>
        {preview ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <MarkdownReadonly source={bodyFa} />
          </div>
        ) : (
          <textarea
            value={bodyFa}
            onChange={(e) => setBodyFa(e.target.value)}
            rows={12}
            placeholder={"# عنوان\n\nمتن مقاله با **Markdown**"}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-mono text-sm leading-relaxed outline-none focus:border-indigo-500"
          />
        )}
      </div>

      <section className="space-y-4 rounded-2xl border border-dashed border-slate-200 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-slate-900">اسلایدها (یک ایده در هر اسلاید)</h2>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleSlidesFromBody}
              className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700"
            >
              <Layers className="h-3.5 w-3.5" />
              متن → اسلاید
            </button>
            <button
              type="button"
              onClick={() =>
                setSlides((prev) => [...prev, { titleFa: "", titleEn: "", bodyFa: "", bodyEn: "" }])
              }
              className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white"
            >
              <Plus className="h-3.5 w-3.5" />
              اسلاید جدید
            </button>
          </div>
        </div>
        {slides.length === 0 ? (
          <p className="text-sm text-slate-400">
            اختیاری است. «متن → اسلاید» بدنه را به عرشهٔ ۶۰ ثانیه‌ای می‌شکند؛ ذخیره تا وقتی «ذخیره» نزنی اعمال نمی‌شود.
          </p>
        ) : (
          <p className="text-xs text-slate-400">{slides.length} اسلاید — قبل از ذخیره قابل ویرایش‌اند.</p>
        )}
        {slides.map((slide, idx) => (
          <div key={slide.id ?? `new-${idx}`} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">اسلاید {idx + 1}</span>
              <button
                type="button"
                onClick={() => setSlides((prev) => prev.filter((_, i) => i !== idx))}
                className="text-rose-500"
                aria-label="حذف اسلاید"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <input
              value={slide.titleFa}
              onChange={(e) => updateSlide(idx, { titleFa: e.target.value })}
              placeholder="عنوان اسلاید"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <textarea
              value={slide.bodyFa}
              onChange={(e) => updateSlide(idx, { bodyFa: e.target.value })}
              rows={5}
              placeholder="متن Markdown اسلاید"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm"
            />
          </div>
        ))}
      </section>

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {mode === "create" ? "ایجاد مطلب" : "ذخیره تغییرات"}
      </button>
    </form>
  );
}
