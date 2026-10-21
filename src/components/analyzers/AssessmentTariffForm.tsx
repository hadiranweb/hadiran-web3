"use client";

import { useState } from "react";

type Tariff = {
  service: "interpretation" | "document";
  priceToman: string;
  commissionPercent: string;
  rounding: "" | "floor" | "ceil";
  active: boolean;
  version: number | null;
};

const LABELS = {
  interpretation: "تفسیر کامل",
  document: "سند چندصفحه",
} as const;

export function AssessmentTariffForm({
  slug,
  canPrice,
  canCommission,
  initial,
}: {
  slug: string;
  canPrice: boolean;
  canCommission: boolean;
  initial: Tariff[];
}) {
  const [rows, setRows] = useState<Tariff[]>(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [status, setStatus] = useState("");

  async function save(row: Tariff, activate: boolean) {
    setBusy(row.service);
    setStatus("");
    try {
      const res = await fetch(`/api/workspace/analyzers/${slug}/tariffs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service: row.service,
          priceToman: canPrice ? row.priceToman : undefined,
          commissionPercent: canCommission ? row.commissionPercent : undefined,
          rounding: canCommission ? row.rounding : undefined,
          activate,
        }),
      });
      const data = (await res.json()) as { error?: string; version?: number; active?: boolean };
      if (!res.ok) throw new Error(data.error || "save_failed");
      setRows((current) =>
        current.map((item) =>
          item.service === row.service
            ? { ...item, version: data.version ?? item.version, active: Boolean(data.active) }
            : item,
        ),
      );
      setStatus(activate ? "تعرفه فعال شد." : "تعرفه ذخیره شد.");
    } catch (error) {
      setStatus(error instanceof Error && error.message === "tariff_undefined" ? "کارمزد یا گردکردن ناقص است؛ صفر فرض نشد." : "ذخیره نشد.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
      <h2 className="text-base font-bold text-slate-900">تعرفهٔ خدمات این نوبت</h2>
      <p className="text-sm leading-7 text-slate-600">
        ذخیره به ریال دقیق است؛ نمایش تومان. کارمزد از قیمت پیش از تخفیف. بدون تعرفهٔ کامل، فروش فعال نمی‌شود و قیمت صفر
        فرض نمی‌شود.
      </p>
      {rows.map((row) => (
        <fieldset key={row.service} className="space-y-3 rounded-xl border border-slate-100 p-3" disabled={Boolean(busy)}>
          <legend className="px-1 text-sm font-medium">{LABELS[row.service]}</legend>
          <label className="block text-sm">
            قیمت (تومان)
            <input
              dir="ltr"
              value={row.priceToman}
              disabled={!canPrice}
              onChange={(event) =>
                setRows((current) =>
                  current.map((item) => (item.service === row.service ? { ...item, priceToman: event.target.value } : item)),
                )
              }
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
            />
          </label>
          {canCommission ? (
            <>
              <label className="block text-sm">
                کارمزد سکوی (درصد)
                <input
                  dir="ltr"
                  value={row.commissionPercent}
                  onChange={(event) =>
                    setRows((current) =>
                      current.map((item) =>
                        item.service === row.service ? { ...item, commissionPercent: event.target.value } : item,
                      ),
                    )
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                />
              </label>
              <label className="block text-sm">
                گردکردن کسر ریال کارمزد
                <select
                  value={row.rounding}
                  onChange={(event) =>
                    setRows((current) =>
                      current.map((item) =>
                        item.service === row.service
                          ? { ...item, rounding: event.target.value as Tariff["rounding"] }
                          : item,
                      ),
                    )
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                >
                  <option value="">فقط اگر تقسیم دقیق باشد</option>
                  <option value="floor">کف</option>
                  <option value="ceil">سقف</option>
                </select>
              </label>
            </>
          ) : (
            <p className="text-xs text-slate-500">کارمزد را فقط مالک سکو می‌گذارد.</p>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void save(row, false)}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm"
            >
              ذخیرهٔ نسخه
            </button>
            {canCommission ? (
              <button
                type="button"
                onClick={() => void save(row, true)}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white"
              >
                فعال‌سازی فروش
              </button>
            ) : null}
          </div>
          <p className="text-xs text-slate-500">
            {row.active ? "فعال" : "غیرفعال"}
            {row.version ? ` · نسخه ${row.version}` : ""}
          </p>
        </fieldset>
      ))}
      <p className="text-sm text-slate-600" role="status">
        {busy ? "در حال ذخیره…" : status}
      </p>
    </section>
  );
}
