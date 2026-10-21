"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { clearDraft, readDraft, writeDraft } from "@/lib/ui/draft";
import { Plus, Trash2, Save, Loader2, Layers } from "lucide-react";
import { MarkdownReadonly } from "@/components/MarkdownReadonly";
import { slugify } from "@/lib/markdown";
import { slidesFromBody } from "@/lib/slides-from-body";
import type { KnowledgeSlide } from "@/components/knowledge/SlideReader";
import { GROWTH_FA, KNOWLEDGE_GROWTH, isKnowledgeGrowth, type KnowledgeGrowth } from "@/lib/knowledge/article";

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
  growth?: string | null;
  readingMinutes?: number | null;
  lineFa?: string | null;
  questionFa?: string | null;
  rootFa?: string | null;
  firstStepFa?: string | null;
  marginNoteFa?: string | null;
  prunedAt?: Date | string | null;
  audioUrl?: string | null;
  simulator?: unknown;
  closingQuestionFa?: string | null;
  closingOptions?: unknown;
  closingPromptFa?: string | null;
  relatedSlugs?: string[];
  revision?: number;
  slides: KnowledgeSlide[];
  fromMemory?: boolean;
};

type SlideDraft = {
  id?: number;
  titleFa: string;
  titleEn: string;
  bodyFa: string;
  bodyEn: string;
};

function dateInputValue(value: Date | string | null | undefined) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function optionsToText(value: unknown) {
  if (!Array.isArray(value)) return "";
  return value
    .map((row) => {
      if (!row || typeof row !== "object") return "";
      const label = (row as { labelFa?: unknown }).labelFa;
      const href = (row as { href?: unknown }).href;
      if (typeof label !== "string") return "";
      return typeof href === "string" && href.trim() ? `${label.trim()} | ${href.trim()}` : label.trim();
    })
    .filter(Boolean)
    .join("\n");
}

function textToOptions(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [labelFa, href] = line.split("|").map((part) => part.trim());
      return href ? { labelFa, href } : { labelFa };
    });
}

export function KnowledgeComposer({
  mode,
  initial,
}: {
  mode: "create" | "edit";
  initial?: KnowledgeDraft;
}) {
  const router = useRouter();
  const fromMemory = Boolean(initial?.fromMemory);
  const [titleFa, setTitleFa] = useState(initial?.titleFa ?? "");
  const [titleEn, setTitleEn] = useState(initial?.titleEn ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [type, setType] = useState<(typeof TYPES)[number]["value"]>(initial?.type ?? "article");
  const [summaryFa, setSummaryFa] = useState(initial?.summaryFa ?? "");
  const [bodyFa, setBodyFa] = useState(initial?.bodyFa ?? "");
  const [growth, setGrowth] = useState<KnowledgeGrowth | "">(
    isKnowledgeGrowth(initial?.growth) ? initial.growth : "",
  );
  const [readingMinutes, setReadingMinutes] = useState(
    initial?.readingMinutes != null ? String(initial.readingMinutes) : "",
  );
  const [lineFa, setLineFa] = useState(initial?.lineFa ?? "");
  const [questionFa, setQuestionFa] = useState(initial?.questionFa ?? "");
  const [rootFa, setRootFa] = useState(initial?.rootFa ?? "");
  const [firstStepFa, setFirstStepFa] = useState(initial?.firstStepFa ?? "");
  const [marginNoteFa, setMarginNoteFa] = useState(initial?.marginNoteFa ?? "");
  const [prunedOn, setPrunedOn] = useState(dateInputValue(initial?.prunedAt));
  const [audioUrl, setAudioUrl] = useState(initial?.audioUrl ?? "");
  const [simulatorOn, setSimulatorOn] = useState(
    Boolean(initial?.simulator && typeof initial.simulator === "object" && (initial.simulator as { kind?: string }).kind),
  );
  const [simulatorTitle, setSimulatorTitle] = useState(
    typeof (initial?.simulator as { titleFa?: unknown } | null)?.titleFa === "string"
      ? String((initial?.simulator as { titleFa?: string }).titleFa)
      : "",
  );
  const [simulatorIntro, setSimulatorIntro] = useState(
    typeof (initial?.simulator as { introFa?: unknown } | null)?.introFa === "string"
      ? String((initial?.simulator as { introFa?: string }).introFa)
      : "",
  );
  const [closingQuestionFa, setClosingQuestionFa] = useState(initial?.closingQuestionFa ?? "");
  const [closingOptions, setClosingOptions] = useState(optionsToText(initial?.closingOptions));
  const [closingPromptFa, setClosingPromptFa] = useState(initial?.closingPromptFa ?? "");
  const [relatedSlugs, setRelatedSlugs] = useState((initial?.relatedSlugs ?? []).join("\n"));
  const [revision, setRevision] = useState(initial?.revision ?? 1);
  const [slides, setSlides] = useState<SlideDraft[]>(
    (initial?.slides ?? []).map((s) => ({
      id: s.id,
      titleFa: s.titleFa ?? "",
      titleEn: s.titleEn ?? "",
      bodyFa: s.bodyFa ?? "",
      bodyEn: s.bodyEn ?? "",
    })),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);
  const draftKey = `knowledge:${mode}:${initial?.slug || "new"}:v2`;
  const skipDraftWrite = useRef(true);

  useEffect(() => {
    skipDraftWrite.current = true;
  }, [draftKey]);

  useEffect(() => {
    const draft = readDraft<Record<string, unknown>>(draftKey);
    if (draft) {
      // پیش‌نویس فقط بعد از هیدریشن خوانده می‌شود؛ یک‌بار در هر کلید پیش‌نویس.
      /* eslint-disable react-hooks/set-state-in-effect */
      if (typeof draft.titleFa === "string") setTitleFa(draft.titleFa);
      if (typeof draft.titleEn === "string") setTitleEn(draft.titleEn);
      if (typeof draft.slug === "string") setSlug(draft.slug);
      if (typeof draft.slugTouched === "boolean") setSlugTouched(draft.slugTouched);
      if (draft.type) setType(draft.type as (typeof TYPES)[number]["value"]);
      if (typeof draft.summaryFa === "string") setSummaryFa(draft.summaryFa);
      if (typeof draft.bodyFa === "string") setBodyFa(draft.bodyFa);
      if (isKnowledgeGrowth(draft.growth) || draft.growth === "") setGrowth(draft.growth as KnowledgeGrowth | "");
      if (typeof draft.readingMinutes === "string") setReadingMinutes(draft.readingMinutes);
      if (typeof draft.lineFa === "string") setLineFa(draft.lineFa);
      if (typeof draft.questionFa === "string") setQuestionFa(draft.questionFa);
      if (typeof draft.rootFa === "string") setRootFa(draft.rootFa);
      if (typeof draft.firstStepFa === "string") setFirstStepFa(draft.firstStepFa);
      if (typeof draft.marginNoteFa === "string") setMarginNoteFa(draft.marginNoteFa);
      if (typeof draft.prunedOn === "string") setPrunedOn(draft.prunedOn);
      if (typeof draft.audioUrl === "string") setAudioUrl(draft.audioUrl);
      if (typeof draft.simulatorOn === "boolean") setSimulatorOn(draft.simulatorOn);
      if (typeof draft.simulatorTitle === "string") setSimulatorTitle(draft.simulatorTitle);
      if (typeof draft.simulatorIntro === "string") setSimulatorIntro(draft.simulatorIntro);
      if (typeof draft.closingQuestionFa === "string") setClosingQuestionFa(draft.closingQuestionFa);
      if (typeof draft.closingOptions === "string") setClosingOptions(draft.closingOptions);
      if (typeof draft.closingPromptFa === "string") setClosingPromptFa(draft.closingPromptFa);
      if (typeof draft.relatedSlugs === "string") setRelatedSlugs(draft.relatedSlugs);
      if (Array.isArray(draft.slides)) setSlides(draft.slides as SlideDraft[]);
      /* eslint-enable react-hooks/set-state-in-effect */
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
      growth,
      readingMinutes,
      lineFa,
      questionFa,
      rootFa,
      firstStepFa,
      marginNoteFa,
      prunedOn,
      audioUrl,
      simulatorOn,
      simulatorTitle,
      simulatorIntro,
      closingQuestionFa,
      closingOptions,
      closingPromptFa,
      relatedSlugs,
      slides,
    });
  }, [
    draftKey,
    titleFa,
    titleEn,
    slug,
    slugTouched,
    type,
    summaryFa,
    bodyFa,
    growth,
    readingMinutes,
    lineFa,
    questionFa,
    rootFa,
    firstStepFa,
    marginNoteFa,
    prunedOn,
    audioUrl,
    simulatorOn,
    simulatorTitle,
    simulatorIntro,
    closingQuestionFa,
    closingOptions,
    closingPromptFa,
    relatedSlugs,
    slides,
  ]);

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
      })),
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
      const minutes = readingMinutes.trim() ? Number(readingMinutes) : null;
      const payload = {
        slug: finalSlug,
        type,
        titleFa: titleFa.trim(),
        titleEn: titleEn.trim() || null,
        summaryFa: summaryFa.trim() || null,
        bodyFa: bodyFa.trim() || null,
        growth: growth || null,
        readingMinutes: minutes != null && Number.isFinite(minutes) ? minutes : null,
        lineFa: lineFa.trim() || null,
        questionFa: questionFa.trim() || null,
        rootFa: rootFa.trim() || null,
        firstStepFa: firstStepFa.trim() || null,
        marginNoteFa: marginNoteFa.trim() || null,
        prunedAt: prunedOn || null,
        audioUrl: audioUrl.trim() || null,
        simulator: simulatorOn
          ? {
              kind: "clarity_speed",
              titleFa: simulatorTitle.trim() || null,
              introFa: simulatorIntro.trim() || null,
            }
          : null,
        closingQuestionFa: closingQuestionFa.trim() || null,
        closingOptions: textToOptions(closingOptions),
        closingPromptFa: closingPromptFa.trim() || null,
        relatedSlugs: relatedSlugs
          .split("\n")
          .map((row) => row.trim())
          .filter(Boolean),
        baseRevision: revision,
        slides: slides.map((s, i) => ({
          id: s.id,
          sortOrder: i,
          titleFa: s.titleFa,
          titleEn: s.titleEn,
          bodyFa: s.bodyFa,
          bodyEn: s.bodyEn,
        })),
      };

      const url = mode === "create" ? "/api/knowledge" : `/api/knowledge/${initial?.slug ?? finalSlug}`;
      const res = await fetch(url, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { slug?: string; error?: string; revision?: number };
      if (!res.ok) {
        if (data.error === "revision_conflict" || data.error === "revision_required") {
          throw new Error("این مطلب از وقتی که باز کردید عوض شده. صفحه را تازه کنید و دوباره ذخیره کنید.");
        }
        throw new Error(data.error || "ذخیره ناموفق بود");
      }
      if (typeof data.revision === "number") setRevision(data.revision);
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
      {fromMemory ? (
        <p className="rounded-[var(--radius-md)] border border-line bg-paper px-4 py-3 text-sm leading-7 text-muted">
          عنوان و بدنه از میزکار می‌آیند. لایه‌های برگهٔ باغ (عمق، رشد، صدا، شبیه‌ساز، پایان باز) را همین‌جا پر کن.
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-ink">عنوان فارسی</span>
          <input value={titleFa} onChange={(e) => setTitleFa(e.target.value)} className={fieldClass} disabled={fromMemory} />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-ink">عنوان انگلیسی</span>
          <input
            dir="ltr"
            value={titleEn}
            onChange={(e) => setTitleEn(e.target.value)}
            className={fieldClass}
            disabled={fromMemory}
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
            disabled={fromMemory}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-ink">نوع</span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as (typeof TYPES)[number]["value"])}
            className={fieldClass}
            disabled={fromMemory}
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-ink">رشد در باغ</span>
          <select value={growth} onChange={(e) => setGrowth(e.target.value as KnowledgeGrowth | "")} className={fieldClass}>
            <option value="">نامشخص</option>
            {KNOWLEDGE_GROWTH.map((value) => (
              <option key={value} value={value}>
                {GROWTH_FA[value].mark}
                {GROWTH_FA[value].label} — {GROWTH_FA[value].hint}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-ink">زمان خواندن (دقیقه)</span>
          <input
            dir="ltr"
            inputMode="numeric"
            value={readingMinutes}
            onChange={(e) => setReadingMinutes(e.target.value)}
            className={fieldClass}
          />
        </label>
      </div>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-ink">سؤال روی میز</span>
        <textarea value={questionFa} onChange={(e) => setQuestionFa(e.target.value)} rows={2} className={fieldClass} />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-ink">یک خط (عجول)</span>
        <textarea value={lineFa} onChange={(e) => setLineFa(e.target.value)} rows={2} className={fieldClass} />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-ink">یک بند (کنجکاو)</span>
        <textarea value={summaryFa} onChange={(e) => setSummaryFa(e.target.value)} rows={4} className={fieldClass} />
      </label>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-ink">کل ماجرا (Markdown)</span>
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
            disabled={fromMemory}
          />
        )}
      </div>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-ink">ریشهٔ پنهان (اگر مسئله است)</span>
        <textarea value={rootFa} onChange={(e) => setRootFa(e.target.value)} rows={2} className={fieldClass} />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-ink">اولین قدم آرام</span>
        <textarea value={firstStepFa} onChange={(e) => setFirstStepFa(e.target.value)} rows={2} className={fieldClass} />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-ink">حاشیهٔ هادی</span>
        <textarea value={marginNoteFa} onChange={(e) => setMarginNoteFa(e.target.value)} rows={3} className={fieldClass} />
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-ink">تاریخ هرس در باغ</span>
          <input type="date" value={prunedOn} onChange={(e) => setPrunedOn(e.target.value)} className={fieldClass} />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-ink">صدای برگ (مسیر یا نشانی)</span>
          <input
            dir="ltr"
            value={audioUrl}
            onChange={(e) => setAudioUrl(e.target.value)}
            placeholder="/audio/leaf.mp3"
            className={fieldClass}
          />
          <span className="text-xs text-muted">آپلود از اینجا نیست؛ فایل را در public بگذار یا نشانی بده.</span>
        </label>
      </div>

      <fieldset className="space-y-3 rounded-[var(--radius-md)] border border-line p-4">
        <label className="flex items-center gap-2 text-sm font-medium text-ink">
          <input type="checkbox" checked={simulatorOn} onChange={(e) => setSimulatorOn(e.target.checked)} />
          شبیه‌ساز شفافیت در برابر سرعت
        </label>
        {simulatorOn ? (
          <>
            <input
              value={simulatorTitle}
              onChange={(e) => setSimulatorTitle(e.target.value)}
              placeholder="عنوان شبیه‌ساز"
              className={fieldClass}
            />
            <textarea
              value={simulatorIntro}
              onChange={(e) => setSimulatorIntro(e.target.value)}
              rows={2}
              placeholder="معرفی کوتاه"
              className={fieldClass}
            />
          </>
        ) : null}
      </fieldset>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-ink">پایان باز — سؤال</span>
        <textarea value={closingQuestionFa} onChange={(e) => setClosingQuestionFa(e.target.value)} rows={2} className={fieldClass} />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-ink">گزینه‌های پایان (هر خط یک گزینه؛ مسیر اختیاری بعد از |)</span>
        <textarea value={closingOptions} onChange={(e) => setClosingOptions(e.target.value)} rows={3} className={fieldClass} />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-ink">دعوت به حاشیهٔ خواننده</span>
        <input value={closingPromptFa} onChange={(e) => setClosingPromptFa(e.target.value)} className={fieldClass} />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-ink">رشته‌ها (اسلاگ هر برگ در یک خط)</span>
        <textarea
          dir="ltr"
          value={relatedSlugs}
          onChange={(e) => setRelatedSlugs(e.target.value)}
          rows={3}
          className={`${fieldClass} font-mono`}
        />
      </label>

      <section className="space-y-4 rounded-[var(--radius-md)] border border-dashed border-line p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-ink">اسلایدها (یک ایده در هر اسلاید)</h2>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleSlidesFromBody}
              className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] border border-line bg-paper px-3 py-1.5 text-xs font-medium text-ink"
              disabled={fromMemory}
            >
              <Layers className="h-3.5 w-3.5" />
              متن → اسلاید
            </button>
            <button
              type="button"
              onClick={() => setSlides((prev) => [...prev, { titleFa: "", titleEn: "", bodyFa: "", bodyEn: "" }])}
              className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] bg-accent px-3 py-1.5 text-xs font-medium text-accent-fg"
              disabled={fromMemory}
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
                disabled={fromMemory}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <input
              value={slide.titleFa}
              onChange={(e) => updateSlide(idx, { titleFa: e.target.value })}
              placeholder="عنوان اسلاید"
              className={fieldClass}
              disabled={fromMemory}
            />
            <textarea
              value={slide.bodyFa}
              onChange={(e) => updateSlide(idx, { bodyFa: e.target.value })}
              rows={5}
              placeholder="متن Markdown اسلاید"
              className={`${fieldClass} font-mono`}
              disabled={fromMemory}
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
