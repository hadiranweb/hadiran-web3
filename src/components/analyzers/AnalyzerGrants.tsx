"use client";
import { previewFetch as fetch } from "@/lib/auth/preview-fetch";

import { useCallback, useEffect, useState } from "react";

type Grant = { publicCode: string; nameFa: string; canEdit: boolean; canReadResponses: boolean };

export function AnalyzerGrants({ slug }: { slug: string }) {
  const [items, setItems] = useState<Grant[]>([]);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/workspace/analyzers/${slug}/grants`, { cache: "no-store" });
    const data = (await res.json()) as { items?: Grant[]; error?: string };
    if (!res.ok) throw new Error(data.error || "بارگذاری دسترسی‌ها انجام نشد.");
    return data.items ?? [];
  }, [slug]);

  useEffect(() => {
    let active = true;
    load().then(items => { if (active) setItems(items); }).catch(() => { if (active) setError("بارگذاری دسترسی‌ها انجام نشد."); });
    return () => { active = false; };
  }, [load]);

  async function add() {
    setBusy(true);
    setError(null);
    try {
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
    } catch { setError("ارتباط برقرار نشد؛ دوباره تلاش کنید."); }
    finally { setBusy(false); }
  }

  async function remove(publicCode: string) {
    setBusy(true);
    try {
    const res = await fetch(`/api/workspace/analyzers/${slug}/grants`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicCode }),
    });
    const data = (await res.json()) as { items?: Grant[]; error?: string };
    if (!res.ok) throw new Error(data.error || "برداشتن دسترسی انجام نشد.");
    setBusy(false);
    setItems(data.items ?? []);
    } catch { setError("ارتباط برقرار نشد؛ دوباره تلاش کنید."); }
    finally { setBusy(false); }
  }

  return (
    <section className="space-y-4 rounded-2xl border border-line bg-elev p-6">
      <p className="text-sm leading-7 text-muted">
        شناسهٔ ۸رقمی آزمون‌ساز را بگذارید. اگر عضو باشد، نقشش آزمون‌ساز می‌شود و این آزمون را می‌بیند.
      </p>
      <div className="flex flex-wrap gap-2">
        <input
          className="rounded-xl border border-line px-3 py-2 text-sm"
          dir="ltr"
          aria-label="شناسهٔ هشت‌رقمی حساب"
          maxLength={8}
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="۱۲۳۴۵۶۷۸"
        />
        <button
          type="button"
          onClick={() => void add()}
          disabled={busy || code.trim().length !== 8}
          className="rounded-xl bg-accent px-4 py-2 text-sm text-accent-fg disabled:opacity-60"
        >
          اعطا
        </button>
      </div>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {items.length === 0 ? (
        <p className="text-sm text-muted">هنوز دسترسی داده نشده.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.publicCode} className="flex items-center justify-between rounded-xl border border-line px-3 py-2 text-sm">
              <span>
                {item.nameFa} · <span dir="ltr">{item.publicCode}</span>
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
