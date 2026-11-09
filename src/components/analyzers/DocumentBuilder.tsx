"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { DocumentListItem } from "@/lib/analyzers/document-templates";
import type { WorkspaceAttemptRow } from "@/lib/analyzers/workspace-attempt-types";
import { financeMoney } from "@/lib/finance/types";

type PackOption = {
  slug: string;
  nameFa: string;
  templates: { id: string; titleFa: string }[];
  defaultTemplateId: string;
};

function whenFa(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("fa-IR");
}

export function DocumentBuilder({
  packs,
  initialDocuments,
}: {
  packs: PackOption[];
  initialDocuments: DocumentListItem[];
}) {
  const [slug, setSlug] = useState(packs[0]?.slug ?? "");
  const pack = useMemo(() => packs.find((row) => row.slug === slug) ?? null, [packs, slug]);
  const [templateId, setTemplateId] = useState(pack?.defaultTemplateId ?? "hadiran");
  const [attempts, setAttempts] = useState<WorkspaceAttemptRow[] | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [documents, setDocuments] = useState(initialDocuments);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [sponsorshipQuote, setSponsorshipQuote] = useState<{ attemptId: number; tariffId: string; amountIrr: string } | null>(null);
  const [loadedSlug, setLoadedSlug] = useState("");

  async function loadAttempts(nextSlug: string) {
    setBusy(true);
    setError(null);
    setStatus(null);
    setSponsorshipQuote(null);
    setAttempts(null);
    setSelected([]);
    try {
      const res = await fetch(`/api/workspace/analyzers/${nextSlug}/attempts`, { cache: "no-store" });
      const data = (await res.json()) as { items?: WorkspaceAttemptRow[]; error?: string };
      if (!res.ok) {
        setError("فهرست تفسیر بارگذاری نشد.");
        setAttempts([]);
        return;
      }
      const submitted = (data.items ?? []).filter((row) => row.status === "submitted");
      setAttempts(submitted);
      setLoadedSlug(nextSlug);
    } catch {
      setError("فهرست تفسیر بارگذاری نشد.");
      setAttempts([]);
    } finally {
      setBusy(false);
    }
  }

  async function convert(confirmSponsorship = false) {
    const sponsorAttemptId = confirmSponsorship ? sponsorshipQuote?.attemptId : null;
    const targetAttemptIds = sponsorAttemptId ? [sponsorAttemptId] : selected;
    if (!pack || !targetAttemptIds.length) return;
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      const res = await fetch("/api/workspace/documents", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          slug: pack.slug,
          templateId,
          attemptIds: targetAttemptIds,
          sponsorUnpaid: confirmSponsorship,
          sponsorTariffId: confirmSponsorship ? sponsorshipQuote?.tariffId : undefined,
        }),
      });
      const data = (await res.json()) as {
        items?: { id: number; attemptId: number; templateId: string; href: string; sponsored?: boolean }[];
        errors?: { attemptId: number; error: string; tariffId?: string; amountIrr?: string }[];
        error?: string;
      };
      if (!res.ok) {
        setError(data.error === "bad_template" ? "این قالب برای این تفسیر نیست." : "تبدیل انجام نشد.");
        return;
      }
      if (data.items?.length) {
        const list = await fetch("/api/workspace/documents", { cache: "no-store" });
        if (list.ok) {
          const next = (await list.json()) as { items?: DocumentListItem[] };
          setDocuments(next.items ?? documents);
        }
        setAttempts((current) =>
          current
            ? current.map((row) => {
                const hit = data.items?.find((item) => item.attemptId === row.attemptId);
                return hit ? { ...row, documentId: hit.id } : row;
              })
            : current,
        );
      }

      const sponsorError = data.errors?.find(
        (item) => item.error === "sponsorship_confirmation_required" || item.error === "sponsorship_quote_changed",
      );
      if (sponsorError) {
        if (sponsorError.tariffId && sponsorError.amountIrr) {
          setSponsorshipQuote({
            attemptId: sponsorError.attemptId,
            tariffId: sponsorError.tariffId,
            amountIrr: sponsorError.amountIrr,
          });
          setError(
            sponsorError.error === "sponsorship_quote_changed"
              ? "تعرفه تغییر کرده است؛ مبلغ تازه را بررسی و دوباره تأیید کنید."
              : "برای سند پرداخت‌نشده، تأیید جداگانهٔ آزمون‌ساز لازم است.",
          );
          return;
        }
      }
      if (data.errors?.length) {
        const messages: Record<string, string> = {
          creator_credit_insufficient: "اعتبار آزاد آزمون‌ساز کافی نیست؛ ذخیرهٔ سند و ثبت مالی لغو شدند.",
          sponsorship_forbidden: "فقط آزمون‌ساز می‌تواند هزینهٔ سند پرداخت‌نشده را بپذیرد.",
          tariff_undefined: "تعرفهٔ سند تعریف نشده است.",
          assessment_not_ready: "این نوبت هنوز ثبت نشده است.",
          not_submitted: "این نوبت هنوز ثبت نشده است.",
          bad_template: "این قالب برای این تفسیر نیست.",
        };
        const first = data.errors[0];
        setError(messages[first.error] ?? "تبدیل بعضی از سندها انجام نشد.");
        return;
      }

      setSponsorshipQuote(null);
      setSelected((current) => current.filter((id) => !targetAttemptIds.includes(id)));
      setStatus(
        confirmSponsorship
          ? "تأمین مالی و ساخت سند در یک تراکنش انجام شد؛ دسترسی همین نوبت فعال است."
          : "سندهای مجاز آماده شدند.",
      );
    } catch {
      setError("تبدیل انجام نشد.");
    } finally {
      setBusy(false);
    }
  }

  if (!packs.length) {
    return <p className="text-sm text-slate-500">آزمونی با دسترسی تفسیر نیست.</p>;
  }

  const submitted = attempts ?? [];

  return (
    <div className="space-y-8">
      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
        <label className="block text-sm">
          <span className="mb-1 block text-slate-600">تفسیر</span>
          <select
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            value={slug}
            onChange={(event) => {
              const next = event.target.value;
              setSlug(next);
              const found = packs.find((row) => row.slug === next);
              setTemplateId(found?.defaultTemplateId ?? "hadiran");
              setAttempts(null);
              setSelected([]);
              setSponsorshipQuote(null);
              setStatus(null);
              setLoadedSlug("");
            }}
          >
            {packs.map((row) => (
              <option key={row.slug} value={row.slug}>
                {row.nameFa}
              </option>
            ))}
          </select>
        </label>
        {pack ? (
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">قالب این تفسیر</span>
            <select
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              value={templateId}
              onChange={(event) => setTemplateId(event.target.value)}
            >
              {pack.templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.titleFa}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy || !pack}
            onClick={() => void loadAttempts(slug)}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {busy && loadedSlug !== slug ? "…" : "نمایش تفسیرهای ثبت‌شده"}
          </button>
        </div>
        {attempts ? (
          submitted.length ? (
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={selected.length === submitted.length && submitted.length > 0}
                  onChange={(event) =>
                    setSelected(event.target.checked ? submitted.map((row) => row.attemptId) : [])
                  }
                />
                همه
              </label>
              <ul className="space-y-2">
                {submitted.map((row) => (
                  <li key={row.attemptId} className="flex items-start justify-between gap-3 text-sm">
                    <label className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={selected.includes(row.attemptId)}
                        onChange={(event) => {
                          setSelected((current) =>
                            event.target.checked
                              ? [...current, row.attemptId]
                              : current.filter((id) => id !== row.attemptId),
                          );
                        }}
                      />
                      <span>
                        <span className="block font-medium text-slate-900">{row.nameFa}</span>
                        <span className="text-xs text-slate-500">
                          {whenFa(row.submittedAt)}
                          {row.documentId ? " · سند دارد" : ""}
                        </span>
                      </span>
                    </label>
                    {row.documentId ? (
                      <Link href={`/workspace/documents/${row.documentId}`} className="text-indigo-700">
                        باز کردن
                      </Link>
                    ) : null}
                  </li>
                ))}
              </ul>
              {!sponsorshipQuote ? (
                <button
                  type="button"
                  disabled={busy || !selected.length}
                  onClick={() => void convert(false)}
                  className="rounded-xl bg-indigo-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                >
                  {busy ? "در حال تبدیل…" : `تبدیل ${selected.length.toLocaleString("fa-IR")} نوبت`}
                </button>
              ) : (
                <div className="space-y-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950" role="alert">
                  <p className="leading-7">
                    هزینهٔ سند {submitted.find((row) => row.attemptId === sponsorshipQuote.attemptId)?.nameFa ?? `نوبت ${sponsorshipQuote.attemptId}`} پرداخت نشده است. با تأیید صریح، {financeMoney(sponsorshipQuote.amountIrr, "IRR")} از اعتبار آزاد آزمون‌ساز کسر می‌شود. ذخیرهٔ سند و ثبت مالی اتمیک‌اند؛ در صورت کمبود اعتبار هیچ‌کدام ثبت نمی‌شوند.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void convert(true)}
                      className="rounded-xl bg-amber-900 px-4 py-2 text-white disabled:opacity-60"
                    >
                      {busy ? "در حال ثبت…" : `تأیید کسر ${financeMoney(sponsorshipQuote.amountIrr, "IRR")} و ساخت سند`}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        setSponsorshipQuote(null);
                        setError(null);
                      }}
                      className="rounded-xl border border-amber-700 px-4 py-2 disabled:opacity-60"
                    >
                      انصراف
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-500">نوبت ثبت‌شده‌ای برای این تفسیر نیست.</p>
          )
        ) : null}
        {error ? <p className="text-sm text-red-700" role="alert">{error}</p> : null}
        {status ? <p className="text-sm text-green-700" role="status">{status}</p> : null}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900">سندهای ساخته‌شده</h2>
        {documents.length ? (
          <ul className="space-y-2">
            {documents.map((doc) => (
              <li key={doc.id}>
                <Link
                  href={`/workspace/documents/${doc.id}`}
                  className="block rounded-2xl border border-slate-200 bg-white p-4 hover:border-indigo-200"
                >
                  <p className="font-medium text-slate-900">{doc.personNameFa}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {doc.packNameFa} · {doc.templateTitleFa} · {whenFa(doc.createdAt)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">هنوز سندی ساخته نشده.</p>
        )}
      </section>
    </div>
  );
}
