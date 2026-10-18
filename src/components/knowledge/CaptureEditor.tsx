"use client";

import { previewFetch as fetch } from "@/lib/auth/preview-fetch";

import { useState, type FormEvent } from "react";
import { withPreviewAccess } from "@/lib/auth/preview-url";
import { PREVIEW_SESSION_KEY } from "@/lib/auth/preview-client";
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

export function CaptureEditor({ initial, onDirtyChange }: { initial?: CaptureDraft; onDirtyChange?: (dirty: boolean) => void }) {
  const router = useRouter();
  const previewPath = (href: string) => { try { return withPreviewAccess(href, sessionStorage.getItem(PREVIEW_SESSION_KEY) || new URL(location.href).searchParams.get("preview_access") || ""); } catch { return href; } };
  const [titleFa, setTitleFa] = useState(initial?.titleFa ?? "");
  const [titleEn, setTitleEn] = useState(initial?.titleEn ?? "");
  const [intent, setIntent] = useState(initial?.intent ?? "");
  const [summaryFa, setSummaryFa] = useState(initial?.summaryFa ?? "");
  const [bodyFa, setBodyFa] = useState(initial?.bodyFa ?? "");
  const [preview, setPreview] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true); setSaved(false);
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
      setSaved(true); onDirtyChange?.(false);
      const id = data.id || initial?.id;
      if (id) router.push(previewPath(`/workspace/records/${id}`));
      router.refresh();
    } catch {
      setError("ذخیره نشد.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={(event) => void onSubmit(event)} className="space-y-4" onChange={() => { setSaved(false); onDirtyChange?.(true); }}>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-ink">عنوان فارسی</span>
        <input
          required
          minLength={3}
          value={titleFa}
          onChange={(e) => setTitleFa(e.target.value)}
          className="w-full rounded-xl border border-line bg-elev px-3 py-2 text-ink"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-ink">عنوان انگلیسی (برای اسلاگ، اختیاری)</span>
        <input
          value={titleEn}
          onChange={(e) => setTitleEn(e.target.value)}
          dir="ltr"
          className="w-full rounded-xl border border-line bg-elev px-3 py-2 text-ink"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-ink">نیت</span>
        <input
          value={intent}
          onChange={(e) => setIntent(e.target.value)}
          className="w-full rounded-xl border border-line bg-elev px-3 py-2 text-ink"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-ink">خلاصه</span>
        <textarea
          value={summaryFa}
          onChange={(e) => setSummaryFa(e.target.value)}
          rows={2}
          className="w-full rounded-xl border border-line bg-elev px-3 py-2 text-ink"
        />
      </label>
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-ink">بدنه (Markdown)</span>
          <button
            type="button"
            onClick={() => setPreview((v) => !v)}
            className="text-xs text-mark"
          >
            {preview ? "ویرایش" : "پیش‌نمایش"}
          </button>
        </div>
        {preview ? (
          <div className="min-h-[12rem] rounded-xl border border-line bg-elev p-4">
            <MarkdownReadonly source={bodyFa} />
          </div>
        ) : (
          <textarea
            value={bodyFa}
            onChange={(e) => setBodyFa(e.target.value)}
            rows={16}
            dir="rtl"
            className="w-full rounded-xl border border-line bg-elev px-3 py-2 font-mono text-sm text-ink"
          />
        )}
      </div>
      {saved ? <p role="status" className="ws-success">ذخیره شد. این اقدام به‌تنهایی انتشار عمومی نیست؛ برای به‌روزرسانی دانشنامه دوباره ارتقا بدهید.</p> : null}
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <button
        type="submit"
        disabled={saving}
        className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-fg disabled:opacity-60"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        ذخیرهٔ ثبت (بدون انتشار)
      </button>
    </form>
  );
}
