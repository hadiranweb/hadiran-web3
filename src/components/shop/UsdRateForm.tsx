"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function UsdRateForm({ initialRate }: { initialRate: number | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    const form = new FormData(event.currentTarget);
    const usdRate = Number(form.get("usdRate"));
    const res = await fetch("/api/workspace/shop/rate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usdRate }),
    });
    const data = (await res.json()) as { error?: string; updatedListings?: number };
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "ثبت نشد.");
      return;
    }
    setMessage(`نرخ ثبت شد. ${data.updatedListings ?? 0} کالا به‌روز شد.`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-bold text-slate-900">نرخ دلار هفته</h2>
      <p className="mt-1 text-xs text-slate-500">
        کالاهایی که نسبت دلاری دارند با این نرخ دوباره قیمت‌گذاری می‌شوند. پرداخت در سایت انجام نمی‌شود.
      </p>
      {error ? <p className="mt-2 text-sm text-rose-700">{error}</p> : null}
      {message ? <p className="mt-2 text-sm text-emerald-700">{message}</p> : null}
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <label className="text-sm">
          ریال به‌ازای یک دلار
          <input
            name="usdRate"
            type="number"
            min={1}
            step="1"
            required
            defaultValue={initialRate ?? ""}
            className="mt-1 block w-48 rounded-xl border border-slate-200 px-3 py-2"
            dir="ltr"
          />
        </label>
        <button disabled={busy} className="rounded-full bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60">
          {busy ? "…" : "اعمال نرخ"}
        </button>
      </div>
    </form>
  );
}
