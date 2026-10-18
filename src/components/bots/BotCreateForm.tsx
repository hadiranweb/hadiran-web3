"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const fieldClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-400";

export function BotCreateForm({
  analyzers,
}: {
  analyzers: { slug: string; nameFa: string }[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/workspace/bots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        titleFa: String(form.get("titleFa") ?? ""),
        analyzerSlug: String(form.get("analyzerSlug") ?? ""),
      }),
    });
    const data = (await res.json()) as { error?: string; bot?: { id: string } };
    setBusy(false);
    if (!res.ok || !data.bot) {
      setError(data.error ?? "ساخته نشد.");
      return;
    }
    router.push(`/workspace/bots/${data.bot.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={(event) => void onSubmit(event)} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
      <label className="block text-sm">
        <span className="mb-1 block text-slate-600">نام ربات در میز</span>
        <input name="titleFa" required minLength={3} className={fieldClass} defaultValue="تحلیل‌گر هوشمند" />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-slate-600">کانال</span>
        <select className={fieldClass} disabled defaultValue="telegram">
          <option value="telegram">تلگرام</option>
        </select>
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-slate-600">آزمون متصل</span>
        <select name="analyzerSlug" className={fieldClass} defaultValue="">
          <option value="">همهٔ آزمون‌های باز — تحلیل‌گر هوشمند</option>
          {analyzers.map((item) => (
            <option key={item.slug} value={item.slug}>
              {item.nameFa} ({item.slug})
            </option>
          ))}
        </select>
      </label>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <button
        type="submit"
        disabled={busy}
        className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {busy ? "در حال ساخت…" : "ادامه به اتصال"}
      </button>
    </form>
  );
}
