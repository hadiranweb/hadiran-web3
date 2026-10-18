"use client";
import { previewFetch as fetch } from "@/lib/auth/preview-fetch";

import { useRouter } from "next/navigation";
import { useState } from "react";

const fieldClass =
  "w-full rounded-xl border border-line bg-elev px-3 py-2 text-sm text-ink outline-none focus:border-accent";

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
        analyzerSlug: String(form.get("analyzerSlug") ?? "casio-ss"),
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
    <form onSubmit={(event) => void onSubmit(event)} className="space-y-4 rounded-2xl border border-line bg-elev p-6">
      <label className="block text-sm">
        <span className="mb-1 block text-muted">نام ربات در میز</span>
        <input name="titleFa" required minLength={3} className={fieldClass} placeholder="مثلاً ربات عارضه‌یابی" />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-muted">کانال</span>
        <select className={fieldClass} disabled defaultValue="telegram">
          <option value="telegram">تلگرام</option>
        </select>
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-muted">آزمون متصل</span>
        <select name="analyzerSlug" className={fieldClass} defaultValue="casio-ss">
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
        className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-fg disabled:opacity-60"
      >
        {busy ? "در حال ساخت…" : "ادامه به اتصال"}
      </button>
    </form>
  );
}
