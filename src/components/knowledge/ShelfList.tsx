"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookmarkX } from "lucide-react";
import type { ShelfItem } from "@/lib/knowledge/bookmarks";

/** قفسهٔ شخصی: چیزهایی که کاربر با روبان نگه داشته. حذف روبان، نوشته را دست نمی‌زند. */
export function ShelfList({ items }: { items: ShelfItem[] }) {
  const router = useRouter();
  const [hidden, setHidden] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const visible = items.filter((item) => !hidden.includes(item.slug));

  async function remove(slug: string) {
    setError(null);
    setHidden((current) => [...current, slug]);
    const res = await fetch("/api/account/bookmarks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, saved: false }),
    });
    if (!res.ok) {
      setHidden((current) => current.filter((item) => item !== slug));
      setError("برداشتن روبان انجام نشد.");
      return;
    }
    router.refresh();
  }

  return (
    <section className="surface mb-8 p-5">
      <h2 className="text-sm font-bold text-ink">قفسهٔ من</h2>
      <p className="mt-1 text-xs leading-6 text-muted">
        نوشته‌هایی که برای بعد کنار گذاشته‌ای. روبان در حسابت می‌ماند؛ روی هر دستگاهی که وارد شوی پیدایشان می‌کنی.
      </p>
      {visible.length ? (
        <ul className="mt-4 divide-y divide-line">
          {visible.map((item) => (
            <li key={item.slug} className="flex items-start justify-between gap-3 py-3">
              <div>
                <Link href={`/knowledge/${item.slug}`} className="text-sm font-medium text-ink hover:text-accent">
                  {item.titleFa}
                </Link>
                {item.lineFa ? <p className="mt-1 text-xs leading-6 text-muted">{item.lineFa}</p> : null}
                <p className="mt-1 text-[11px] text-muted">
                  {item.readingMinutes ? `${item.readingMinutes.toLocaleString("fa-IR")} دقیقه` : "بدون زمان"}
                  {" · "}
                  {new Date(item.savedAt).toLocaleDateString("fa-IR")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void remove(item.slug)}
                className="inline-flex shrink-0 items-center gap-1 rounded-full border border-line px-2.5 py-1 text-xs text-muted hover:border-accent hover:text-ink"
                title="برداشتن روبان"
              >
                <BookmarkX className="h-3.5 w-3.5" />
                بردار
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-muted">
          هنوز چیزی نگه نداشته‌ای. در هر نوشته، بالای صفحه «برای بعد نگه دار» را بزن.
        </p>
      )}
      {error ? <p className="mt-2 text-xs text-mark">{error}</p> : null}
    </section>
  );
}
