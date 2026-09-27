"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";

export function PayoutForm({
  initial,
}: {
  initial?: { accountHandle: string; accountAlias?: string | null } | null;
}) {
  const router = useRouter();
  const [accountHandle, setAccountHandle] = useState(initial?.accountHandle ?? "");
  const [accountAlias, setAccountAlias] = useState(initial?.accountAlias ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setOk(false);
    try {
      const res = await fetch("/api/workspace/shop/payout", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountHandle, accountAlias }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "ذخیره نشد.");
        return;
      }
      setOk(true);
      router.refresh();
    } catch {
      setError("ذخیره نشد.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={(event) => void onSubmit(event)} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-sm font-medium text-slate-900">مقصد دریافت (بیرون از سایت)</p>
      <p className="text-xs text-slate-500">
        کارت، شبا یا هر نشانی ریل بیرونی. سایت پول را نگه نمی‌دارد؛ همین متن عیناً به خریدار نشان داده می‌شود.
      </p>
      <label className="block text-sm">
        <span className="mb-1 block text-slate-700">نشانی اصلی</span>
        <input
          required
          minLength={4}
          value={accountHandle}
          onChange={(e) => setAccountHandle(e.target.value)}
          dir="ltr"
          className="w-full rounded-xl border border-slate-200 px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-slate-700">نام/توضیح (اختیاری)</span>
        <input
          value={accountAlias}
          onChange={(e) => setAccountAlias(e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-3 py-2"
        />
      </label>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {ok ? <p className="text-sm text-emerald-700">ذخیره شد.</p> : null}
      <button
        type="submit"
        disabled={saving}
        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        ذخیرهٔ مقصد
      </button>
    </form>
  );
}
