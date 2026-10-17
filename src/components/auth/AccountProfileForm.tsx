"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

const fieldClass =
  "w-full rounded-[var(--radius-md)] border border-line bg-elev px-4 py-2.5 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]";

function persianError(code: string) {
  const map: Record<string, string> = {
    invalid_given_name: "نام معتبر نیست (حداکثر ۶۴ نویسه).",
    invalid_family_name: "نام خانوادگی معتبر نیست (حداکثر ۶۴ نویسه).",
    unauthorized: "نشست منقضی شد. دوباره وارد شو.",
    save_failed: "ذخیره نشد. دوباره تلاش کنید.",
  };
  return map[code] || "خطایی رخ داد.";
}

export function AccountProfileForm({
  givenName: initialGiven,
  familyName: initialFamily,
}: {
  givenName: string;
  familyName: string;
}) {
  const router = useRouter();
  const [givenName, setGivenName] = useState(initialGiven);
  const [familyName, setFamilyName] = useState(initialFamily);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    setSubmitting(true);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ givenName, familyName }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "save_failed");
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(persianError(err instanceof Error ? err.message : "save_failed"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="surface space-y-5 p-6">
      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-ink">نام</span>
        <input
          value={givenName}
          onChange={(e) => setGivenName(e.target.value)}
          maxLength={64}
          autoComplete="given-name"
          className={fieldClass}
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-ink">نام خانوادگی</span>
        <input
          value={familyName}
          onChange={(e) => setFamilyName(e.target.value)}
          maxLength={64}
          autoComplete="family-name"
          className={fieldClass}
        />
      </label>
      {error ? <p className="text-sm text-mark">{error}</p> : null}
      {saved ? <p className="text-sm text-muted">ذخیره شد.</p> : null}
      <button
        type="submit"
        disabled={submitting}
        className="inline-flex rounded-[var(--radius-md)] bg-accent px-5 py-2.5 text-sm font-medium text-accent-fg disabled:opacity-60"
      >
        {submitting ? "در حال ذخیره…" : "ذخیره"}
      </button>
    </form>
  );
}
