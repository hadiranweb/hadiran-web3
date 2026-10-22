"use client";

import { useState } from "react";
import Link from "next/link";
import { Bookmark, BookmarkCheck } from "lucide-react";

/**
 * روبان شخصی: نوشته دست نمی‌خورد، فقط نشانی‌اش در حساب می‌ماند.
 * اگر حساب نباشد، به ورود راهنمایی می‌کند و هیچ‌جا چیزی ذخیره نمی‌کند.
 */
export function BookmarkButton({
  slug,
  saved,
  signedIn,
}: {
  slug: string;
  saved: boolean;
  signedIn: boolean;
}) {
  const [on, setOn] = useState(saved);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!signedIn) {
    return (
      <Link
        href={`/signin?next=${encodeURIComponent(`/knowledge/${slug}`)}`}
        className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper px-3 py-1.5 text-sm text-muted hover:border-accent hover:text-ink"
        title="روبان در حساب کاربر می‌ماند و روی دستگاه دیگر هم پیدا می‌شود."
      >
        <Bookmark className="h-4 w-4" />
        برای نگه‌داشتن وارد شوید
      </Link>
    );
  }

  async function toggle() {
    setBusy(true);
    setError(null);
    const next = !on;
    try {
      const res = await fetch("/api/account/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, saved: next }),
      });
      if (!res.ok) throw new Error("ذخیره نشد.");
      setOn(next);
    } catch {
      setError("روبان ذخیره نشد. دوباره بزن.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={() => void toggle()}
        disabled={busy}
        aria-pressed={on}
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm disabled:opacity-60 ${
          on ? "border-accent bg-elev text-ink" : "border-line bg-paper text-muted hover:border-accent hover:text-ink"
        }`}
        title={on ? "برداشتن روبان" : "گذاشتن روبان؛ در حساب من می‌ماند"}
      >
        {on ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
        {on ? "نگه داشته شد" : "برای بعد نگه دار"}
      </button>
      {error ? <span className="text-xs text-mark">{error}</span> : null}
    </span>
  );
}
