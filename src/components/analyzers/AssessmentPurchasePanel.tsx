"use client";

import { useState } from "react";
import { financeMoney } from "@/lib/finance/types";

function purchaseErrorFa(code: string): string {
  const messages: Record<string, string> = {
    already_entitled: "این نوبت را قبلاً گرفته‌ای.",
    tariff_undefined: "تعرفه تعریف نشده؛ فروشی نیست.",
    invalid_discount: "کد تخفیف نامعتبر است.",
    unknown_discount: "کد تخفیف نامعتبر یا منقضی است.",
    discount_exhausted: "ظرفیت این کد تخفیف تمام شده است.",
    discount_scope: "این کد برای همین آزمون نیست.",
    coupon_product_mismatch: "این کد برای همین آزمون صادر نشده است.",
    coupon_issuer_mismatch: "این کد از سوی سازندهٔ این آزمون صادر نشده است.",
    unsupported_discount: "این نوع کد برای تعرفهٔ آزمون پشتیبانی نمی‌شود.",
    assessment_not_ready: "این نوبت هنوز برای خرید آماده نیست.",
  };
  return messages[code] ?? "سفارش ساخته نشد.";
}

export function AssessmentPurchasePanel({
  slug,
  attemptId,
  service,
  title,
  payableIrr,
  entitled,
  initialDiscountCode,
  onEntitled,
}: {
  slug: string;
  attemptId: number;
  service: "execution" | "interpretation" | "document";
  title: string;
  payableIrr: string;
  entitled: boolean;
  initialDiscountCode?: string | null;
  onEntitled?: () => void;
}) {
  const [code, setCode] = useState(initialDiscountCode ?? "");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(entitled ? "دسترسی این نوبت فعال است." : "");
  const [discountNotice, setDiscountNotice] = useState<{
    requestedPercent: number;
    allowedPercent: number;
    overCapPercent: number;
    overCapIrr: string;
  } | null>(null);
  const [currentPayableIrr, setCurrentPayableIrr] = useState(payableIrr);
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
      const data = (await res.json()) as {
        error?: string;
        id?: string;
        state?: string;
        payableIrr?: string;
        discountNotice?: {
          requestedPercent: number;
          allowedPercent: number;
          overCapPercent: number;
          overCapIrr: string;
        } | null;
      };
      if (!res.ok) throw new Error(data.error || "create_failed");
      setOrderId(data.id ?? null);
      setDiscountNotice(data.discountNotice ?? null);
      if (data.payableIrr) setCurrentPayableIrr(data.payableIrr);
      if (data.state === "delivered") {
        setStatus("دسترسی این نوبت فعال شد.");
        setNeedReference(false);
        if (service === "execution") onEntitled?.();
      } else if (data.state === "captured") {
        setStatus(
          service === "document"
            ? "پرداخت ثبت شد؛ دسترسی سند پس از ساخت سند توسط آزمون‌ساز فعال می‌شود."
            : "پرداخت تأیید شد؛ اگر دسترسی فعال نشد صفحه را تازه‌سازی کن.",
        );
        setNeedReference(false);
      } else {
        setNeedReference(true);
        setStatus("شمارهٔ پیگیری را بعد از پرداخت بیرونی ثبت کن.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      setStatus(purchaseErrorFa(message));
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
      <p className="mt-1 text-xs text-muted">
        {service === "execution"
          ? "این خرید یک اجرای همین نوبت را با نتیجهٔ پایه پوشش می‌دهد؛ همان اجرا دوباره قیمت‌گذاری نمی‌شود."
          : "این افزونه مستقل و فقط برای همین نوبت است؛ اجرا، تفسیر و سند سه عرضهٔ جدا هستند."}
      </p>
      <p className="mt-2 text-sm text-ink">{financeMoney(currentPayableIrr, "IRR")}</p>
      {discountNotice ? (
        <p className="mt-2 rounded-[var(--radius-sm)] border border-amber-300 bg-amber-50 px-3 py-2 text-xs leading-6 text-amber-900" role="status">
          این کد {discountNotice.requestedPercent}٪ است و سقف آزمون‌ساز {discountNotice.allowedPercent}٪ است؛ مازاد {discountNotice.overCapPercent}٪ ({financeMoney(discountNotice.overCapIrr, "IRR")}) در صورت تکمیل موفق پرداخت به حساب مالی آزمون‌ساز منظور می‌شود (ابتدا از اعتبار آزاد و در صورت کسری به‌صورت طلب).
        </p>
      ) : null}
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
