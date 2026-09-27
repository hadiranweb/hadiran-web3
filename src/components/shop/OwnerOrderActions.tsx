"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export function OwnerOrderActions({ orderId, state }: { orderId: string; state: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (state !== "awaiting_confirmation") return null;

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/workspace/shop/orders/${orderId}/confirm`, { method: "POST" });
      if (!res.ok) {
        setError("تأیید نشد.");
        return;
      }
      router.refresh();
    } catch {
      setError("تأیید نشد.");
    } finally {
      setBusy(false);
    }
  }

  async function decline() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/workspace/shop/orders/${orderId}/decline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) {
        setError("رد نشد.");
        return;
      }
      router.refresh();
    } catch {
      setError("رد نشد.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
      <p className="text-sm text-slate-700">
        سایت نمی‌گوید پول آمده یا نه. اگر در حساب بیرونی‌ات رسید را دیدی، تأیید کن. دسترسی همان لحظه باز می‌شود.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void confirm()}
          className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {busy ? <Loader2 className="inline h-4 w-4 animate-spin" /> : "تأیید دریافت"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void decline()}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm disabled:opacity-60"
        >
          دریافت نشد
        </button>
      </div>
      <input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="دلیل رد (اختیاری)"
        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
      />
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
    </div>
  );
}
