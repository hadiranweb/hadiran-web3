"use client";
import { previewFetch as fetch } from "@/lib/auth/preview-fetch";

import { useEffect, useState } from "react";

type Item = {
  code: string;
  kind: string;
  value: number;
  scope: string;
  analyzerSlug: string | null;
  maxUses: number | null;
  usedCount: number;
  active: boolean;
};

export function DiscountManager() {
  const [items, setItems] = useState<Item[]>([]);
  const [code, setCode] = useState("");
  const [value, setValue] = useState("10");
  const [kind, setKind] = useState("percent");
  const [scope, setScope] = useState("any");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch("/api/workspace/discounts", { cache: "no-store" });
    const data = (await res.json()) as { items?: Item[] };
    if (!res.ok) throw new Error("بارگذاری تخفیف‌ها انجام نشد.");
    return data.items ?? [];
  }

  useEffect(() => {
    let active = true;
    load().then(items => { if (active) setItems(items); }).catch(() => { if (active) setError("بارگذاری تخفیف‌ها انجام نشد."); });
    return () => { active = false; };
  }, []);

  async function create() {
    setBusy(true);
    setError(null);
    try {
    const res = await fetch("/api/workspace/discounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, value: Number(value), kind, scope }),
    });
    const data = (await res.json()) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "ساخته نشد.");
      return;
    }
    setCode("");
    setItems(await load());
    } catch { setError("ارتباط برقرار نشد؛ دوباره تلاش کنید."); }
    finally { setBusy(false); }
  }

  async function toggle(item: Item) {
    if (busy) return;
    setBusy(true); setError(null);
    try {
    const res = await fetch("/api/workspace/discounts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: item.code, active: !item.active }),
    });
    if (!res.ok) throw new Error("به‌روزرسانی انجام نشد.");
    setItems(await load());
    } catch { setError("ارتباط برقرار نشد؛ دوباره تلاش کنید."); }
    finally { setBusy(false); }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 rounded-2xl border border-line bg-elev p-4 sm:grid-cols-2">
        <input
          className="rounded-xl border border-line px-3 py-2 text-sm"
          dir="ltr"
          aria-label="کد تخفیف"
          placeholder="HADI20"
          value={code}
          onChange={(event) => setCode(event.target.value)}
        />
        <input
          className="rounded-xl border border-line px-3 py-2 text-sm"
          dir="ltr"
          aria-label="مقدار تخفیف"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
        <select aria-label="نوع تخفیف" className="rounded-xl border border-line px-3 py-2 text-sm" value={kind} onChange={(event) => setKind(event.target.value)}>
          <option value="percent">درصد</option>
          <option value="amount">مبلغ</option>
        </select>
        <select aria-label="دامنهٔ تخفیف" className="rounded-xl border border-line px-3 py-2 text-sm" value={scope} onChange={(event) => setScope(event.target.value)}>
          <option value="any">همه</option>
          <option value="shop">فروشگاه</option>
          <option value="analyzer">آزمون</option>
        </select>
        <button
          type="button"
          onClick={() => void create()}
          disabled={busy}
          className="rounded-xl bg-accent px-4 py-2 text-sm text-accent-fg disabled:opacity-60"
        >
          ساخت کد
        </button>
      </div>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.code} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-line bg-elev p-4 text-sm">
            <span>
              <span dir="ltr">{item.code}</span> · {item.kind === "percent" ? `${item.value}٪` : item.value} · {item.scope} ·{" "}
              {item.usedCount}/{item.maxUses ?? "∞"}
            </span>
            <button type="button" disabled={busy} className="text-mark" onClick={() => void toggle(item)}>
              {item.active ? "خاموش" : "روشن"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
