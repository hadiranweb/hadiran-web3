"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BOT_SERVICE_OPTIONS, type BotService } from "@/lib/bots/script";

const fieldClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-400";

export function BotCreateForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [service, setService] = useState<BotService>("analyzers");

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
        service,
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

  const hint = BOT_SERVICE_OPTIONS.find((item) => item.id === service)?.hintFa;

  return (
    <form onSubmit={(event) => void onSubmit(event)} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
      <label className="block text-sm">
        <span className="mb-1 block text-slate-600">نام ربات در میز</span>
        <input name="titleFa" required minLength={3} className={fieldClass} placeholder="مثلاً ربات آزمون‌ها" />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-slate-600">کار این ربات</span>
        <select
          className={fieldClass}
          value={service}
          onChange={(event) => setService(event.target.value as BotService)}
        >
          {BOT_SERVICE_OPTIONS.map((item) => (
            <option key={item.id} value={item.id}>
              {item.labelFa}
            </option>
          ))}
        </select>
        {hint ? <span className="mt-1 block text-xs leading-6 text-slate-500">{hint}</span> : null}
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-slate-600">کانال</span>
        <select className={fieldClass} disabled defaultValue="telegram">
          <option value="telegram">تلگرام</option>
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
