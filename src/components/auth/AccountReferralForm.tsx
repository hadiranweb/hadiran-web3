"use client";

import { useState } from "react";

export function AccountReferralForm({ referredBy }: { referredBy: string | null }) {
  const [code, setCode] = useState("");
  const [current, setCurrent] = useState(referredBy);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (current) {
    return (
      <p className="mb-6 text-sm text-muted">
        معرف شما: <span dir="ltr">{current}</span>
      </p>
    );
  }

  async function save() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/account/referral", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ referralCode: code.trim() }),
    });
    const data = (await res.json()) as { error?: string; referredBy?: string };
    setBusy(false);
    if (!res.ok) {
      const map: Record<string, string> = {
        invalid_referral: "کد معرف هشت رقم است.",
        unknown_referral: "این کد پیدا نشد.",
        self_referral: "کد خودتان را نزنید.",
        referral_cycle: "این کد حلقه می‌سازد.",
      };
      setError(map[data.error || ""] || "ثبت نشد.");
      return;
    }
    setCurrent(data.referredBy ?? code.trim());
  }

  return (
    <div className="surface mb-6 space-y-3 p-6">
      <p className="text-sm text-muted">اگر کسی شما را معرفی کرده، کد ۸رقمی‌اش را یک‌بار بزنید. بعد عوض نمی‌شود.</p>
      <div className="flex flex-wrap gap-2">
        <input
          className="rounded-[var(--radius-md)] border border-line bg-elev px-3 py-2 text-sm"
          dir="ltr"
          maxLength={8}
          value={code}
          onChange={(event) => setCode(event.target.value)}
        />
        <button type="button" onClick={() => void save()} disabled={busy} className="rounded-[var(--radius-md)] bg-accent px-4 py-2 text-sm text-accent-fg disabled:opacity-60">
          ثبت معرف
        </button>
      </div>
      {error ? <p className="text-sm text-mark">{error}</p> : null}
    </div>
  );
}
