"use client";

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
    setItems(data.items ?? []);
  }

  useEffect(() => {
    // بارگذاری اولیه بعد از mount؛ وابستگی به load لازم نیست.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, []);

  async function create() {
    setBusy(true);
    setError(null);
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
    await load();
  }

  async function toggle(item: Item) {
    await fetch("/api/workspace/discounts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: item.code, active: !item.active }),
    });
    await load();
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
        <input
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          dir="ltr"
          placeholder="HADI20"
          value={code}
          onChange={(event) => setCode(event.target.value)}
        />
        <input
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          dir="ltr"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
        <select className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={kind} onChange={(event) => setKind(event.target.value)}>
          <option value="percent">درصد</option>
          <option value="amount">مبلغ</option>
        </select>
        <select className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={scope} onChange={(event) => setScope(event.target.value)}>
          <option value="any">همه</option>
          <option value="shop">فروشگاه</option>
          <option value="analyzer">آزمون</option>
        </select>
        <button
          type="button"
          onClick={() => void create()}
          disabled={busy}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60"
        >
          ساخت کد
        </button>
      </div>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.code} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-sm">
            <span>
              <span dir="ltr">{item.code}</span> · {item.kind === "percent" ? `${item.value}٪` : item.value} · {item.scope} ·{" "}
              {item.usedCount}/{item.maxUses ?? "∞"}
            </span>
            <button type="button" className="text-indigo-700" onClick={() => void toggle(item)}>
              {item.active ? "خاموش" : "روشن"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
