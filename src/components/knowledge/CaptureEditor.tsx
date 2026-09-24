"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { MarkdownReadonly } from "@/components/MarkdownReadonly";

export type CaptureDraft = {
  id?: string;
  titleFa: string;
  titleEn?: string | null;
  intent?: string | null;
  summaryFa?: string | null;
  bodyFa?: string | null;
  status?: string;
};

export function CaptureEditor({ initial }: { initial?: CaptureDraft }) {
  const router = useRouter();
  const [titleFa, setTitleFa] = useState(initial?.titleFa ?? "");
  const [titleEn, setTitleEn] = useState(initial?.titleEn ?? "");
  const [intent, setIntent] = useState(initial?.intent ?? "");
  const [summaryFa, setSummaryFa] = useState(initial?.summaryFa ?? "");
  const [bodyFa, setBodyFa] = useState(initial?.bodyFa ?? "");
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const payload = { titleFa, titleEn, intent, summaryFa, bodyFa };
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
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-slate-700">عنوان فارسی</span>
        <input
          required
          minLength={3}
          value={titleFa}
          onChange={(e) => setTitleFa(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-slate-700">عنوان انگلیسی (برای اسلاگ، اختیاری)</span>
        <input
          value={titleEn}
          onChange={(e) => setTitleEn(e.target.value)}
          dir="ltr"
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-slate-700">نیت</span>
        <input
          value={intent}
          onChange={(e) => setIntent(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-slate-700">خلاصه</span>
        <textarea
          value={summaryFa}
          onChange={(e) => setSummaryFa(e.target.value)}
          rows={2}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900"
        />
      </label>
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700">بدنه (Markdown)</span>
          <button
            type="button"
            onClick={() => setPreview((v) => !v)}
            className="text-xs text-indigo-600"
          >
            {preview ? "ویرایش" : "پیش‌نمایش"}
          </button>
        </div>
        {preview ? (
          <div className="min-h-[12rem] rounded-xl border border-slate-200 bg-white p-4">
            <MarkdownReadonly source={bodyFa} />
          </div>
        ) : (
          <textarea
            value={bodyFa}
            onChange={(e) => setBodyFa(e.target.value)}
            rows={16}
            dir="rtl"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-sm text-slate-900"
          />
        )}
      </div>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <button
        type="submit"
        disabled={saving}
        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        ذخیرهٔ ثبت (بدون انتشار)
      </button>
    </form>
  );
}
