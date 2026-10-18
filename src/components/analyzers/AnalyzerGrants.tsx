"use client";

import { useEffect, useState } from "react";

type Grant = { publicCode: string; nameFa: string; canEdit: boolean; canReadResponses: boolean };

export function AnalyzerGrants({ slug }: { slug: string }) {
  const [items, setItems] = useState<Grant[]>([]);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch(`/api/workspace/analyzers/${slug}/grants`, { cache: "no-store" });
    const data = (await res.json()) as { items?: Grant[] };
    setItems(data.items ?? []);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  async function add() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/workspace/analyzers/${slug}/grants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicCode: code.trim() }),
    });
    const data = (await res.json()) as { error?: string; items?: Grant[] };
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "اعطا نشد.");
      return;
    }
    setCode("");
    setItems(data.items ?? []);
  }

  async function remove(publicCode: string) {
    setBusy(true);
    const res = await fetch(`/api/workspace/analyzers/${slug}/grants`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicCode }),
    });
    const data = (await res.json()) as { items?: Grant[] };
    setBusy(false);
    setItems(data.items ?? []);
  }

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
      <p className="text-sm leading-7 text-slate-500">
        فقط سازندهٔ این آزمون می‌تواند شناسهٔ ۸رقمی همکار را بگذارد. نقش او عوض نمی‌شود؛ به پاسخ‌ها، تفسیر اولیه و پشتهٔ
        همین آزمون دسترسی پیدا می‌کند و میز آزمون را در منوی حساب می‌بیند.
      </p>
      <div className="flex flex-wrap gap-2">
        <input
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          dir="ltr"
          maxLength={8}
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="۱۲۳۴۵۶۷۸"
        />
        <button
          type="button"
          onClick={() => void add()}
          disabled={busy || code.trim().length !== 8}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60"
        >
          اعطا
        </button>
      </div>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {items.length === 0 ? (
        <p className="text-sm text-slate-500">هنوز دسترسی داده نشده.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.publicCode} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-sm">
              <span>
                {item.nameFa} · <span dir="ltr">{item.publicCode}</span>
                {item.canReadResponses ? " · پاسخ و تفسیر" : ""}
              </span>
              <button type="button" className="text-red-700" onClick={() => void remove(item.publicCode)} disabled={busy}>
                برداشتن
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
