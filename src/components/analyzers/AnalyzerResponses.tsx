"use client";

import { useEffect, useState } from "react";
import { GateChip, GateStatus } from "@/components/analyzers/GateStatus";
import type { WorkspaceAttemptRow } from "@/lib/analyzers/workspace-attempt-types";

const statusFa = {
  submitted: "ثبت‌شده",
  in_progress: "در جریان",
  abandoned: "نیمه‌کاره — شروع مجدد",
};

function whenFa(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("fa-IR");
}

export function AnalyzerResponses({ slug }: { slug: string }) {
  const [items, setItems] = useState<WorkspaceAttemptRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/workspace/analyzers/${slug}/attempts`, { cache: "no-store" })
      .then(
        (res) =>
          res.json().then((data: { items?: WorkspaceAttemptRow[]; error?: string }) => ({
            ok: res.ok,
            data,
          })),
      )
      .then(({ ok, data }) => {
        if (cancelled) return;
        if (!ok) {
          setError(data.error === "not_found" ? "آزمون پیدا نشد." : "فهرست بارگذاری نشد.");
          setItems([]);
          return;
        }
        setItems(data.items ?? []);
      })
      .catch(() => {
        if (!cancelled) {
          setError("فهرست بارگذاری نشد.");
          setItems([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (!items) {
    return <p className="text-sm text-slate-500">در حال بارگذاری پاسخ‌ها…</p>;
  }
  if (error) {
    return <p className="text-sm text-red-700">{error}</p>;
  }
  if (!items.length) {
    return <p className="text-sm text-slate-500">هنوز کسی این آزمون را پر نکرده.</p>;
  }

  const submitted = items.filter((row) => row.status === "submitted").length;

  return (
    <section className="space-y-4">
      <p className="text-sm text-slate-500">
        {submitted.toLocaleString("fa-IR")} نوبت ثبت‌شده از {items.length.toLocaleString("fa-IR")} نوبت (هر شروع مجدد نوبت جدا است). شناسهٔ داخلی حساب نشان داده نمی‌شود.
      </p>
      <ul className="space-y-2">
        {items.map((row) => {
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
                    {row.referrerPublicCode ? ` · معرف ${row.referrerPublicCode}` : ""}
                    {row.discountCode ? ` · تخفیف ${row.discountCode}` : ""}
                    {row.businessName ? ` · ${row.businessName}` : ""}
                    {` · ${row.phone}`}
                  </span>
                </span>
                <span className="flex flex-col items-end gap-1 text-xs text-slate-500">
                  {row.gate ? <GateChip gate={row.gate} /> : null}
                  <span>
                    {statusFa[row.status]} · {whenFa(row.submittedAt ?? row.updatedAt)}
                  </span>
                </span>
              </button>
              {open ? (
                <div className="space-y-4 border-t border-slate-100 px-4 py-4 text-sm">
                  {row.gate ? <GateStatus gate={row.gate} /> : null}
                  {row.scores.length ? (
                    <div>
                      <p className="font-medium text-slate-900">نمره</p>
                      <ul className="mt-2 space-y-1 text-slate-600">
                        {row.scores.map((score) => (
                          <li key={score.id}>
                            {score.titleFa}: {score.valueFa}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {row.answers.length ? (
                    <div>
                      <p className="font-medium text-slate-900">پاسخ‌ها</p>
                      <ul className="mt-2 space-y-2 text-slate-600">
                        {row.answers.map((answer) => (
                          <li key={answer.id}>
                            <span className="block text-slate-500">{answer.labelFa}</span>
                            <span>{answer.valueFa}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="text-slate-500">پاسخی ذخیره نشده.</p>
                  )}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
