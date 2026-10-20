"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { MarkdownReadonly } from "@/components/MarkdownReadonly";
import {
  ArticleLayerFields,
  articleLayerPayload,
  articleLayerStateFrom,
  emptyArticleLayerState,
  type ArticleLayerState,
} from "@/components/knowledge/ArticleLayerFields";

export type CaptureDraft = {
  id?: string;
  titleFa: string;
  titleEn?: string | null;
  intent?: string | null;
  summaryFa?: string | null;
  bodyFa?: string | null;
  status?: string;
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
  relatedSlugs?: string[] | null;
};

const fieldClass =
  "w-full rounded-[var(--radius-md)] border border-line bg-elev px-3 py-2.5 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]";

export function CaptureEditor({ initial }: { initial?: CaptureDraft }) {
  const router = useRouter();
  const [titleFa, setTitleFa] = useState(initial?.titleFa ?? "");
  const [titleEn, setTitleEn] = useState(initial?.titleEn ?? "");
  const [intent, setIntent] = useState(initial?.intent ?? "");
  const [summaryFa, setSummaryFa] = useState(initial?.summaryFa ?? "");
  const [bodyFa, setBodyFa] = useState(initial?.bodyFa ?? "");
  const [layers, setLayers] = useState<ArticleLayerState>(
    initial ? articleLayerStateFrom(initial) : emptyArticleLayerState(),
  );
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const payload = { titleFa, titleEn, intent, summaryFa, bodyFa, ...articleLayerPayload(layers) };
    try {
      const res = initial?.id
        ? await fetch(`/api/workspace/records/${initial.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/workspace/records", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      const data = (await res.json()) as { error?: string; id?: string };
      if (!res.ok) {
        setError(data.error || "ذخیره نشد.");
        return;
      }
      const id = data.id || initial?.id;
      if (id) router.push(`/workspace/records/${id}`);
      router.refresh();
    } catch {
      setError("ذخیره نشد.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={(event) => void onSubmit(event)} className="space-y-4">
      <label className="block space-y-1.5 text-sm">
        <span className="font-medium text-ink">عنوان فارسی</span>
        <input required minLength={3} value={titleFa} onChange={(e) => setTitleFa(e.target.value)} className={fieldClass} />
      </label>
      <label className="block space-y-1.5 text-sm">
        <span className="font-medium text-ink">عنوان انگلیسی (برای اسلاگ، اختیاری)</span>
        <input value={titleEn} onChange={(e) => setTitleEn(e.target.value)} dir="ltr" className={fieldClass} />
      </label>
      <label className="block space-y-1.5 text-sm">
        <span className="font-medium text-ink">نیت</span>
        <input value={intent} onChange={(e) => setIntent(e.target.value)} className={fieldClass} />
      </label>
      <label className="block space-y-1.5 text-sm">
        <span className="font-medium text-ink">یک بند (کنجکاو)</span>
        <textarea value={summaryFa} onChange={(e) => setSummaryFa(e.target.value)} rows={4} className={fieldClass} />
      </label>
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-ink">کل ماجرا (Markdown)</span>
          <button type="button" onClick={() => setPreview((v) => !v)} className="text-xs font-medium text-accent">
            {preview ? "ویرایش" : "پیش‌نمایش"}
          </button>
        </div>
        {preview ? (
          <div className="min-h-[12rem] rounded-[var(--radius-md)] border border-line bg-paper p-4">
            <MarkdownReadonly source={bodyFa} />
          </div>
        ) : (
          <textarea
            value={bodyFa}
            onChange={(e) => setBodyFa(e.target.value)}
            rows={16}
            dir="rtl"
            className={`${fieldClass} font-mono`}
          />
        )}
      </div>

      <ArticleLayerFields value={layers} onChange={setLayers} fieldClass={fieldClass} />

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <button
        type="submit"
        disabled={saving}
        className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] bg-accent px-4 py-2 text-sm font-medium text-accent-fg disabled:opacity-60"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        ذخیرهٔ ثبت (بدون انتشار)
      </button>
    </form>
  );
}
