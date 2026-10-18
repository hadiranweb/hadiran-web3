"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const fieldClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-400";

export function AnalyzerCreateForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/workspace/analyzers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: String(form.get("slug") ?? ""),
        nameFa: String(form.get("nameFa") ?? ""),
      }),
    });
    const data = (await res.json()) as { error?: string; slug?: string };
    setBusy(false);
    if (!res.ok || !data.slug) {
      setError(data.error ?? "ساخته نشد.");
      return;
    }
    router.push(`/workspace/analyzers/${data.slug}`);
    router.refresh();
  }

  return (
    <form onSubmit={(event) => void onSubmit(event)} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
      <label className="block text-sm">
        <span className="mb-1 block text-slate-600">نام فارسی</span>
        <input name="nameFa" required minLength={3} className={fieldClass} placeholder="مثلاً ارزیابی تیم فروش" />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-slate-600">شناسهٔ لاتین پایدار</span>
        <input name="slug" required className={fieldClass} placeholder="sales-health" dir="ltr" />
        <span className="mt-1 block text-xs text-slate-500">حروف کوچک انگلیسی و خط تیره. بعداً عوض نمی‌شود.</span>
      </label>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <button
        type="submit"
        disabled={busy}
        className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {busy ? "در حال ساخت…" : "ساخت پیش‌نویس"}
      </button>
    </form>
  );
}
