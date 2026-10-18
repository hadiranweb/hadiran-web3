"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { publishAccount } from "@/lib/ui/draft";

const fieldClass =
  "w-full rounded-[var(--radius-md)] border border-line bg-elev px-4 py-2.5 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]";

function persianError(code: string) {
  const map: Record<string, string> = {
    password_too_short: "رمز باید دست‌کم ۸ نویسه باشد.",
    password_too_long: "رمز خیلی بلند است.",
    password_has_space: "رمز نباید فاصله داشته باشد.",
    password_mismatch: "دو رمز یکی نیستند.",
    password_already_set: "برای این حساب قبلاً رمز گذاشته شده.",
    unauthorized: "نشست منقضی شد. دوباره وارد شوید.",
    password_set_failed: "ذخیره نشد. دوباره تلاش کنید.",
  };
  return map[code] || "خطایی رخ داد.";
}

export function AccountPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    if (password !== confirm) {
      setError(persianError("password_mismatch"));
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/password/set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "password_set_failed");
      setPassword("");
      setConfirm("");
      setSaved(true);
      publishAccount({ needsPassword: false });
      router.refresh();
    } catch (err) {
      setError(persianError(err instanceof Error ? err.message : "password_set_failed"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form id="password" onSubmit={onSubmit} className="surface mt-8 space-y-5 p-6">
      <div>
        <h2 className="text-lg font-bold text-ink">رمز ثابت</h2>
        <p className="mt-2 text-sm leading-7 text-muted">
          اجباری نیست. اگر بگذارید دفعه‌های بعد می‌توانید بدون پیامک وارد شوید و نشان روی تصویر حساب برداشته می‌شود.
        </p>
      </div>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-ink">رمز تازه</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          minLength={8}
          className={fieldClass}
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-ink">تکرار رمز</span>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          minLength={8}
          className={fieldClass}
        />
      </label>
      {error ? <p className="text-sm text-mark">{error}</p> : null}
      {saved ? <p className="text-sm text-muted">رمز ذخیره شد.</p> : null}
      <button
        type="submit"
        disabled={submitting || !password}
        className="inline-flex rounded-[var(--radius-md)] bg-accent px-5 py-2.5 text-sm font-medium text-accent-fg disabled:opacity-60"
      >
        {submitting ? "در حال ذخیره…" : "ذخیرهٔ رمز"}
      </button>
    </form>
  );
}
