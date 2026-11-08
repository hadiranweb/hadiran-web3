"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { AnalyzerPack } from "@/lib/analyzers/pack";
import { resolveDocumentTemplateId, templatesForPack } from "@/lib/analyzers/document-templates";

export function ConvertDocumentControls({
  slug,
  pack,
  attemptId,
  documentId,
  onConverted,
}: {
  slug: string;
  pack: AnalyzerPack;
  attemptId: number;
  documentId: number | null;
  onConverted: (id: number) => void;
}) {
  const templates = useMemo(() => templatesForPack(pack), [pack]);
  const [templateId, setTemplateId] = useState<string>(resolveDocumentTemplateId(pack));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function convert() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/workspace/documents", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug, templateId, attemptIds: [attemptId] }),
      });
      const data = (await res.json()) as {
        items?: { id: number }[];
        error?: string;
      };
      const id = data.items?.[0]?.id;
      if (!res.ok || !id) {
        setError(data.error === "bad_template" ? "این قالب برای این تفسیر نیست." : "تبدیل انجام نشد.");
        return;
      }
      onConverted(id);
    } catch {
      setError("تبدیل انجام نشد.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3 px-4 pt-3">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={`/workspace/analyzers/${slug}/attempts/${attemptId}/document`}
          className="text-sm text-slate-500 hover:text-indigo-700"
        >
          پیش‌نمایش زنده
        </Link>
        {documentId ? (
          <Link href={`/workspace/documents/${documentId}`} className="text-sm font-medium text-indigo-700">
            باز کردن سند
          </Link>
        ) : null}
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <label className="text-sm">
          <span className="mb-1 block text-slate-500">قالب</span>
          <select
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            value={templateId}
            onChange={(event) => setTemplateId(event.target.value)}
          >
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.titleFa}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled={busy}
          onClick={() => void convert()}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {busy ? "در حال تبدیل…" : documentId ? "بازسازی سند" : "تبدیل به سند چندصفحه‌ای"}
        </button>
      </div>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
