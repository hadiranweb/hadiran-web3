"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { AnalyzerPack } from "@/lib/analyzers/pack";
import { resolveDocumentTemplateId, templatesForPack } from "@/lib/analyzers/document-templates";
import { financeMoney } from "@/lib/finance/types";

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
  const [status, setStatus] = useState<string | null>(null);
  const [sponsorshipQuote, setSponsorshipQuote] = useState<{ tariffId: string; amountIrr: string } | null>(null);

  async function convert(confirmSponsorship = false) {
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      const res = await fetch("/api/workspace/documents", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          slug,
          templateId,
          attemptIds: [attemptId],
          sponsorUnpaid: confirmSponsorship,
          sponsorTariffId: confirmSponsorship ? sponsorshipQuote?.tariffId : undefined,
        }),
      });
      const data = (await res.json()) as {
        items?: { id: number; sponsored?: boolean }[];
        errors?: { attemptId: number; error: string; tariffId?: string; amountIrr?: string }[];
        error?: string;
      };
      const attemptError = data.errors?.find((item) => item.attemptId === attemptId);
      if (!res.ok || attemptError) {
        const code = attemptError?.error ?? data.error ?? "convert_failed";
        if ((code === "sponsorship_confirmation_required" || code === "sponsorship_quote_changed") && attemptError?.tariffId && attemptError.amountIrr) {
          setSponsorshipQuote({ tariffId: attemptError.tariffId, amountIrr: attemptError.amountIrr });
          if (code === "sponsorship_quote_changed") setError("تعرفه تغییر کرده است؛ مبلغ تازه را بررسی و دوباره تأیید کنید.");
          return;
        }
        const messages: Record<string, string> = {
          bad_template: "این قالب برای این تفسیر نیست.",
          sponsorship_forbidden: "فقط آزمون‌ساز می‌تواند هزینهٔ پرداخت‌نشدهٔ این سند را بپذیرد.",
          creator_credit_insufficient: "اعتبار آزاد آزمون‌ساز کافی نیست؛ ذخیرهٔ سند و ثبت تأمین مالی هر دو لغو شدند و موجودی منفی نمی‌شود.",
          tariff_undefined: "تعرفهٔ سند تعریف نشده؛ هزینه صفر فرض نمی‌شود.",
          assessment_not_ready: "این نوبت هنوز ثبت نشده است.",
          not_submitted: "این نوبت هنوز ثبت نشده است.",
          sponsorship_single_attempt_only: "برای تأمین مالی، هر بار فقط یک سند را تأیید کنید.",
        };
        setError(messages[code] ?? "تبدیل انجام نشد.");
        return;
      }
      const item = data.items?.[0];
      if (!item?.id) {
        setError("تبدیل انجام نشد.");
        return;
      }
      setSponsorshipQuote(null);
      setStatus(item.sponsored ? "سند ساخته شد؛ هزینه از اعتبار آزاد آزمون‌ساز کسر و دسترسی این نوبت فعال شد." : "سند آماده شد.");
      onConverted(item.id);
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
        {!sponsorshipQuote ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void convert(false)}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {busy ? "در حال تبدیل…" : documentId ? "بازسازی سند" : "تبدیل به سند چندصفحه‌ای"}
          </button>
        ) : null}
      </div>
      {sponsorshipQuote ? (
        <div className="space-y-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950" role="alert">
          <p className="leading-7">
            آزمون‌دهنده هنوز هزینهٔ سند همین نوبت را نپرداخته است. با تأیید، {financeMoney(sponsorshipQuote.amountIrr, "IRR")} از اعتبار آزاد آزمون‌ساز کسر می‌شود و دسترسی سند برای همین نوبت فعال خواهد شد. ذخیرهٔ سند و ثبت مالی در یک تراکنش‌اند؛ اگر اعتبار کافی نباشد، هیچ‌کدام ثبت نمی‌شوند.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void convert(true)}
              className="rounded-xl bg-amber-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {busy ? "در حال ثبت…" : `تأیید کسر ${financeMoney(sponsorshipQuote.amountIrr, "IRR")} و ساخت سند`}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setSponsorshipQuote(null)}
              className="rounded-xl border border-amber-700 px-4 py-2 text-sm text-amber-950 disabled:opacity-60"
            >
              انصراف
            </button>
          </div>
        </div>
      ) : null}
      {error ? <p className="text-sm text-red-700" role="alert">{error}</p> : null}
      {status ? <p className="text-sm text-green-700" role="status">{status}</p> : null}
    </div>
  );
}
