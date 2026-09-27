"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export function BuyerOrderActions({
  orderId,
  state,
}: {
  orderId: string;
  state: string;
}) {
  const router = useRouter();
  const [reference, setReference] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canReference = state === "awaiting_payment_reference" || state === "declined";
  const canAbandon = canReference;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/shop/orders/${orderId}/reference`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error === "invalid_reference" ? "شمارهٔ پیگیری باید ۴ تا ۱۲۸ نویسه باشد." : "ثبت نشد.");
        return;
      }
      router.refresh();
    } catch {
      setError("ثبت نشد.");
    } finally {
      setBusy(false);
    }
  }

  async function abandon() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/shop/orders/${orderId}/abandon`, { method: "POST" });
      if (!res.ok) {
        setError("لغو نشد.");
        return;
      }
      router.refresh();
    } catch {
      setError("لغو نشد.");
    } finally {
      setBusy(false);
    }
  }

  if (!canReference && !canAbandon) return null;

  return (
    <div className="space-y-3">
      {canReference ? (
        <form onSubmit={(event) => void submit(event)} className="space-y-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">شمارهٔ پیگیری پرداخت بیرونی</span>
            <input
              required
              minLength={4}
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              dir="ltr"
              className="w-full rounded-xl border border-slate-200 px-3 py-2"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {busy ? <Loader2 className="inline h-4 w-4 animate-spin" /> : "ارسال برای تأیید"}
          </button>
        </form>
      ) : null}
      {canAbandon ? (
        <button type="button" disabled={busy} onClick={() => void abandon()} className="text-sm text-slate-500">
          انصراف از سفارش
        </button>
      ) : null}
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
    </div>
  );
}
