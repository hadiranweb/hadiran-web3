"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AssessmentOrderActions({ orderId, state }: { orderId: string; state: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function post(path: "confirm" | "refund") {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/workspace/assessment-orders/${orderId}/${path}`, { method: "POST" });
      if (!res.ok) {
        setError(path === "confirm" ? "تأیید نشد." : "برگشت نشد.");
        return;
      }
      router.refresh();
    } catch {
      setError("انجام نشد.");
    } finally {
      setBusy(false);
    }
  }

  if (state !== "awaiting_confirmation" && state !== "captured") return null;

  return (
    <div className="flex flex-wrap gap-2">
      {state === "awaiting_confirmation" ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => void post("confirm")}
          className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          تأیید وصول خریدار
        </button>
      ) : null}
      {state === "captured" ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => void post("refund")}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm disabled:opacity-60"
        >
          برگشت پیش از تحویل
        </button>
      ) : null}
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
    </div>
  );
}
