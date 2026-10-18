"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const fieldClass =
  "w-full rounded-[var(--radius-md)] border border-line bg-elev px-4 py-2.5 text-sm text-ink outline-none";

export function SetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!token) {
    return <p className="text-sm leading-7 text-muted">این لینک ناقص است. از ربات لینک تازه بگیرید.</p>;
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/auth/password/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = (await res.json()) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      const map: Record<string, string> = {
        password_too_short: "رمز حداقل هشت نویسه باشد.",
        password_too_long: "رمز خیلی بلند است.",
        password_has_space: "رمز فاصله نداشته باشد.",
        invalid_or_expired_token: "لینک منقضی یا مصرف‌شده است.",
        password_already_set: "رمز این حساب قبلاً گذاشته شده.",
      };
      setError(map[data.error ?? ""] ?? "ذخیره نشد.");
      return;
    }
    router.replace("/account");
    router.refresh();
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="surface space-y-4 p-6">
      <label className="block text-sm">
        <span className="mb-1 block text-muted">رمز تازه</span>
        <input
          className={fieldClass}
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength={8}
          required
        />
      </label>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <button
        type="submit"
        disabled={busy}
        className="rounded-[var(--radius-md)] bg-accent px-5 py-2.5 text-sm font-medium text-accent-fg disabled:opacity-60"
      >
        {busy ? "در حال ذخیره…" : "ذخیره و ورود"}
      </button>
    </form>
  );
}
