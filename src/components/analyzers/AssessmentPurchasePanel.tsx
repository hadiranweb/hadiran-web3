"use client";

import { useState } from "react";
import { financeMoney } from "@/lib/finance/types";

export function AssessmentPurchasePanel({
  slug,
  attemptId,
  service,
  title,
  payableIrr,
  entitled,
}: {
  slug: string;
  attemptId: number;
  service: "interpretation" | "document";
  title: string;
  payableIrr: string;
  entitled: boolean;
}) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(entitled ? "دسترسی این نوبت فعال است." : "");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [needReference, setNeedReference] = useState(false);
  const [reference, setReference] = useState("");

  async function buy() {
    setBusy(true);
    setStatus("");
    try {
      const res = await fetch("/api/account/assessment-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, attemptId, service, discountCode: code || undefined }),
      });
      const data = (await res.json()) as { error?: string; id?: string; state?: string; payableIrr?: string };
      if (!res.ok) throw new Error(data.error || "create_failed");
      setOrderId(data.id ?? null);
      if (data.state === "delivered" || data.state === "captured") {
        setStatus("فعال شد.");
        setNeedReference(false);
      } else {
        setNeedReference(true);
        setStatus("شمارهٔ پیگیری را بعد از پرداخت بیرونی ثبت کن.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      setStatus(
        message === "already_entitled"
          ? "این نوبت را قبلاً گرفته‌ای."
          : message === "tariff_undefined"
            ? "تعرفه تعریف نشده؛ فروشی نیست."
            : "سفارش ساخته نشد.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function sendReference() {
    if (!orderId) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/account/assessment-orders/${orderId}/reference`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference }),
      });
      if (!res.ok) throw new Error("reference_failed");
      setStatus("منتظر تأیید مالک.");
      setNeedReference(false);
    } catch {
      setStatus("ثبت پیگیری نشد.");
    } finally {
      setBusy(false);
    }
  }

  if (entitled) {
    return <p className="text-sm text-muted">{title} برای این نوبت فعال است.</p>;
  }

  return (
    <section className="mt-6 rounded-[var(--radius-md)] border border-line bg-elev p-4 print:hidden">
      <h2 className="text-sm font-medium text-ink">{title}</h2>
      <p className="mt-1 text-xs text-muted">خلاصهٔ رایگان همین صفحه می‌ماند. این خدمت برای همین نوبت است، نه کالای دائمی.</p>
      <p className="mt-2 text-sm text-ink">{financeMoney(payableIrr, "IRR")}</p>
      <label className="mt-3 block text-xs text-muted">
        کد سازنده (اختیاری)
        <input
          dir="ltr"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          className="mt-1 w-full min-h-11 rounded-[var(--radius-sm)] border border-line bg-paper px-2 text-ink"
        />
      </label>
      <button
        type="button"
        disabled={busy}
        onClick={() => void buy()}
        className="mt-3 min-h-11 rounded-[var(--radius-sm)] bg-accent px-4 text-sm font-medium text-accent-fg disabled:opacity-60"
      >
        {busy ? "…" : "فعال‌سازی"}
      </button>
      {needReference ? (
        <div className="mt-3 space-y-2">
          <input
            dir="ltr"
            value={reference}
            onChange={(event) => setReference(event.target.value)}
            placeholder="شمارهٔ پیگیری"
            className="w-full min-h-11 rounded-[var(--radius-sm)] border border-line bg-paper px-2"
          />
          <button type="button" disabled={busy} onClick={() => void sendReference()} className="text-sm text-accent">
            ثبت پیگیری
          </button>
        </div>
      ) : null}
      <p className="mt-2 text-sm text-muted" role="status">
        {status}
      </p>
    </section>
  );
}
