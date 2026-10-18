"use client";

import { useState } from "react";

export function RoleAssignForm() {
  const [code, setCode] = useState("");
  const [role, setRole] = useState<"author" | "member">("author");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    setOk(null);
    const res = await fetch("/api/workspace/roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicCode: code.trim(), role }),
    });
    const data = (await res.json()) as { error?: string; nameFa?: string; role?: string };
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "ثبت نشد.");
      return;
    }
    setCode("");
    const roleFa = data.role === "author" ? "آزمون‌ساز" : "عضو";
    setOk(`${data.nameFa ?? "حساب"} حالا ${roleFa} است.`);
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="text-lg font-bold text-slate-900">نقش حساب</h2>
      <p className="mt-2 text-sm leading-7 text-slate-500">
        شناسهٔ ۸رقمی را بگذارید و نقش بدهید. آزمون‌ساز میز ساخت آزمون می‌بیند. اعطای دسترسی یک آزمون جداست و نقش را عوض
        نمی‌کند.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <input
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          dir="ltr"
          maxLength={8}
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="۱۲۳۴۵۶۷۸"
        />
        <select
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          value={role}
          onChange={(event) => setRole(event.target.value === "member" ? "member" : "author")}
        >
          <option value="author">آزمون‌ساز</option>
          <option value="member">عضو</option>
        </select>
        <button
          type="button"
          onClick={() => void submit()}
          disabled={busy || code.trim().length !== 8}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60"
        >
          {busy ? "در حال ثبت…" : "ثبت نقش"}
        </button>
      </div>
      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
      {ok ? <p className="mt-3 text-sm text-teal-800">{ok}</p> : null}
    </section>
  );
}
