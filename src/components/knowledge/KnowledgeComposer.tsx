"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { clearDraft, readDraft, writeDraft } from "@/lib/ui/draft";
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

const fieldClass =
  "w-full rounded-[var(--radius-md)] border border-line bg-elev px-3 py-2.5 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]";

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
  const draftKey = `knowledge:${mode}:${initial?.slug || "new"}`;
  const skipDraftWrite = useRef(true);

  useEffect(() => {
    const draft = readDraft<{
      titleFa: string;
      titleEn: string;
      slug: string;
      slugTouched: boolean;
      type: (typeof TYPES)[number]["value"];
      summaryFa: string;
      bodyFa: string;
      slides: SlideDraft[];
    }>(draftKey);
    if (draft) {
      setTitleFa(draft.titleFa ?? "");
      setTitleEn(draft.titleEn ?? "");
      setSlug(draft.slug ?? "");
      setSlugTouched(Boolean(draft.slugTouched));
      if (draft.type) setType(draft.type);
      setSummaryFa(draft.summaryFa ?? "");
      setBodyFa(draft.bodyFa ?? "");
      if (Array.isArray(draft.slides)) setSlides(draft.slides);
    }
    skipDraftWrite.current = true;
  }, [draftKey]);

  useEffect(() => {
    if (skipDraftWrite.current) {
      skipDraftWrite.current = false;
      return;
    }
    writeDraft(draftKey, {
      titleFa,
      titleEn,
      slug,
      slugTouched,
      type,
      summaryFa,
      bodyFa,
      slides,
    });
  }, [draftKey, titleFa, titleEn, slug, slugTouched, type, summaryFa, bodyFa, slides]);

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
      clearDraft(draftKey);
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
          <span className="text-sm font-medium text-ink">عنوان فارسی</span>
          <input value={titleFa} onChange={(e) => setTitleFa(e.target.value)} className={fieldClass} />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-ink">عنوان انگلیسی</span>
          <input
            dir="ltr"
            value={titleEn}
            onChange={(e) => setTitleEn(e.target.value)}
            className={fieldClass}
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-ink">اسلاگ (URL لاتین)</span>
          <input
            dir="ltr"
            value={computedSlug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(slugify(e.target.value));
            }}
            className={`${fieldClass} font-mono`}
          />
          <span className="text-xs text-muted">از عنوان انگلیسی ساخته می‌شود؛ حروف لاتین لازم است.</span>
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-ink">نوع</span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as (typeof TYPES)[number]["value"])}
            className={fieldClass}
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
        <span className="text-sm font-medium text-ink">خلاصه</span>
        <textarea value={summaryFa} onChange={(e) => setSummaryFa(e.target.value)} rows={3} className={fieldClass} />
      </label>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-ink">بدنه (Markdown)</span>
          <button type="button" onClick={() => setPreview((v) => !v)} className="text-xs font-medium text-accent">
            {preview ? "ویرایش" : "پیش‌نمایش"}
          </button>
        </div>
        {preview ? (
          <div className="rounded-[var(--radius-md)] border border-line bg-paper p-4">
            <MarkdownReadonly source={bodyFa} />
          </div>
        ) : (
          <textarea
            value={bodyFa}
            onChange={(e) => setBodyFa(e.target.value)}
            rows={12}
            placeholder={"# عنوان\n\nمتن مقاله با **Markdown**"}
            className={`${fieldClass} font-mono leading-relaxed`}
          />
        )}
      </div>

      <section className="space-y-4 rounded-[var(--radius-md)] border border-dashed border-line p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-ink">اسلایدها (یک ایده در هر اسلاید)</h2>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleSlidesFromBody}
              className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] border border-line bg-paper px-3 py-1.5 text-xs font-medium text-ink"
            >
              <Layers className="h-3.5 w-3.5" />
              متن → اسلاید
            </button>
            <button
              type="button"
              onClick={() =>
                setSlides((prev) => [...prev, { titleFa: "", titleEn: "", bodyFa: "", bodyEn: "" }])
              }
              className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] bg-accent px-3 py-1.5 text-xs font-medium text-accent-fg"
            >
              <Plus className="h-3.5 w-3.5" />
              اسلاید جدید
            </button>
          </div>
        </div>
        {slides.length === 0 ? (
          <p className="text-sm text-muted">
            اختیاری است. «متن → اسلاید» بدنه را به عرشهٔ ۶۰ ثانیه‌ای می‌شکند؛ ذخیره تا وقتی «ذخیره» نزنی اعمال نمی‌شود.
          </p>
        ) : (
          <p className="text-xs text-muted">{slides.length} اسلاید — قبل از ذخیره قابل ویرایش‌اند.</p>
        )}
        {slides.map((slide, idx) => (
          <div key={slide.id ?? `new-${idx}`} className="space-y-3 rounded-[var(--radius-md)] border border-line bg-elev p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted">اسلاید {idx + 1}</span>
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
              className={fieldClass}
            />
            <textarea
              value={slide.bodyFa}
              onChange={(e) => updateSlide(idx, { bodyFa: e.target.value })}
              rows={5}
              placeholder="متن Markdown اسلاید"
              className={`${fieldClass} font-mono`}
            />
          </div>
        ))}
      </section>

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-sm)] bg-accent px-5 py-2.5 text-sm font-medium text-accent-fg disabled:opacity-60"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {mode === "create" ? "ایجاد مطلب" : "ذخیره تغییرات"}
      </button>
    </form>
  );
}
