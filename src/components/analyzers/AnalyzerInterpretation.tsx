"use client";

import { useEffect, useState } from "react";
import { CasioSsReport } from "@/components/analyzers/CasioSsReport";
import { ConvertDocumentControls } from "@/components/analyzers/ConvertDocumentControls";
import { GateChip, GateStatus } from "@/components/analyzers/GateStatus";
import { GenericReportView } from "@/components/analyzers/GenericReport";
import { gateOf } from "@/lib/analyzers/gate";
import { buildCasioReport } from "@/lib/analyzers/casio-ss/report";
import { buildGenericReport } from "@/lib/analyzers/generic-report";
import type { AnalyzerPack } from "@/lib/analyzers/pack";
import type { WorkspaceAttemptRow } from "@/lib/analyzers/workspace-attempt-types";

function whenFa(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("fa-IR");
}

export function AnalyzerInterpretation({ slug, pack }: { slug: string; pack: AnalyzerPack }) {
  const [items, setItems] = useState<WorkspaceAttemptRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    setItems(null);
    setError(null);
    void (async () => {
      const res = await fetch(`/api/workspace/analyzers/${slug}/attempts`, { cache: "no-store" });
      const data = (await res.json()) as { items?: WorkspaceAttemptRow[]; error?: string };
      if (cancelled) return;
      if (!res.ok) {
        setError(data.error === "not_found" ? "آزمون پیدا نشد." : "فهرست بارگذاری نشد.");
        setItems([]);
        return;
      }
      setItems(data.items ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (!items) {
    return <p className="text-sm text-slate-500">در حال بارگذاری تفسیر…</p>;
  }
  if (error) {
    return <p className="text-sm text-red-700">{error}</p>;
  }

  const submitted = items.filter((row) => row.status === "submitted");
  if (!submitted.length) {
    return <p className="text-sm text-slate-500">هنوز آزمون ثبت‌شده‌ای برای تفسیر نیست.</p>;
  }

  return (
    <section className="space-y-4">
      <p className="text-sm text-slate-500">
        تفسیر همان نوبت ثبت‌شده است. سند چندصفحه فقط با تبدیل ساخته می‌شود.
      </p>
      <ul className="space-y-2">
        {submitted.map((row) => {
          const open = openId === row.attemptId;
          return (
            <li key={row.attemptId} className="rounded-2xl border border-slate-200 bg-white">
              <button
                type="button"
                onClick={() => setOpenId(open ? null : row.attemptId)}
                className="flex w-full flex-wrap items-start justify-between gap-2 p-4 text-start"
              >
                <span>
                  <span className="block font-medium text-slate-900">{row.nameFa}</span>
                  <span className="mt-1 block text-xs text-slate-500">
                    {row.publicCode ? `شناسه ${row.publicCode}` : "بدون شناسهٔ نمایشی"}
                    {row.businessName ? ` · ${row.businessName}` : ""}
                    {` · ${row.phone}`}
                  </span>
                </span>
                <span className="flex flex-col items-end gap-1 text-xs text-slate-500">
                  {row.gate ? <GateChip gate={row.gate} /> : null}
                  <span>{whenFa(row.submittedAt ?? row.updatedAt)}</span>
                </span>
              </button>
              {open ? (
                <div className="border-t border-slate-100">
                  <ConvertDocumentControls
                    slug={slug}
                    pack={pack}
                    attemptId={row.attemptId}
                    documentId={row.documentId}
                    onConverted={(id) =>
                      setItems((current) =>
                        current
                          ? current.map((item) =>
                              item.attemptId === row.attemptId ? { ...item, documentId: id } : item,
                            )
                          : current,
                      )
                    }
                  />
                  <AttemptInterpretation pack={pack} row={row} />
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function AttemptInterpretation({ pack, row }: { pack: AnalyzerPack; row: WorkspaceAttemptRow }) {
  const gate = row.gate ?? gateOf(pack, row.rawResults);
  try {
    if (pack.slug === "casio-ss") {
      const report = buildCasioReport(pack, row.rawAnswers, row.rawResults);
      return (
        <div className="space-y-4 px-4 py-4">
          {gate ? <GateStatus gate={gate} /> : null}
          <CasioSsReport report={report} showHubLink={false} />
        </div>
      );
    }
    const report = buildGenericReport(pack, row.rawAnswers, row.rawResults);
    return (
      <div className="space-y-4 px-4 py-4">
        {gate ? <GateStatus gate={gate} /> : null}
        <GenericReportView report={report} hubHref={null} />
      </div>
    );
  } catch {
    return (
      <div className="space-y-4 px-4 py-4">
        {gate ? <GateStatus gate={gate} /> : null}
        <p className="text-sm text-red-700">این تفسیر از پاسخ‌های ثبت‌شده قابل بازتولید نیست.</p>
      </div>
    );
  }
}
