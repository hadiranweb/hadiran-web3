"use client";

import { useEffect, useState } from "react";
import { Download, NotebookPen, Trash2 } from "lucide-react";

/**
 * دفتر شخصی کنار کتاب — فقط در همین مرورگر.
 * عمداً سروری نیست: یادداشت ممکن است حرف شخصی باشد و جای ذخیره‌اش روی سرور
 * تصمیم جدا می‌خواهد. برای همین، هشدار و راه دریافت فایل کنارش هست.
 */

const keyOf = (slug: string) => `hadiran:note:${slug}`;

function download(fileName: string, text: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export function ArticleNote({ slug, titleFa }: { slug: string; titleFa: string }) {
  const [text, setText] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- پیش‌نویس بعد از هیدریشن خوانده می‌شود؛ در state اولیه هیدریشن‌میزمچ می‌سازد.
    setText(window.localStorage.getItem(keyOf(slug)) ?? "");
    setLoaded(true);
  }, [slug]);

  useEffect(() => {
    if (!loaded) return;
    const timer = window.setTimeout(() => {
      if (text.trim()) {
        window.localStorage.setItem(keyOf(slug), text);
        setSavedAt(new Date().toLocaleTimeString("fa-IR"));
      } else {
        window.localStorage.removeItem(keyOf(slug));
        setSavedAt(null);
      }
    }, 600);
    return () => window.clearTimeout(timer);
  }, [text, loaded, slug]);

  return (
    <section className="surface mt-6 p-5">
      <h2 className="inline-flex items-center gap-2 text-sm font-bold text-ink">
        <NotebookPen className="h-4 w-4" />
        یادداشت من روی این نوشته
      </h2>
      <p className="mt-2 rounded-[var(--radius-sm)] border border-line bg-elev px-3 py-2 text-xs leading-6 text-muted">
        این دفتر فقط در همین مرورگر می‌ماند؛ روی گوشی یا لپ‌تاپ دیگر نمی‌آید و با پاک‌شدن حافظهٔ مرورگر از بین می‌رود.
        جای امنی برای اطلاعات حساس نیست. اگر می‌خواهی نگهش داری، فایلش را دریافت کن.
      </p>
      <label className="mt-3 block">
        <span className="sr-only">یادداشت</span>
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={5}
          placeholder="این بخش به مسئلهٔ من مربوط است؛ قدم بعدی‌ام…"
          className="w-full resize-y rounded-[var(--radius-md)] border border-line bg-paper px-3 py-2 text-sm leading-7 text-ink outline-none focus:border-accent"
        />
      </label>
      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted">
        <button
          type="button"
          onClick={() =>
            download(
              `یادداشت-${slug}.txt`,
              `# ${titleFa}\n\n${text}\n\n— \nهادیران · /knowledge/${slug}\n`,
            )
          }
          disabled={!text.trim()}
          className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1 text-xs text-ink disabled:opacity-50"
        >
          <Download className="h-3.5 w-3.5" />
          دریافت فایل
        </button>
        <button
          type="button"
          onClick={() => setText("")}
          disabled={!text.trim()}
          className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1 text-xs text-muted disabled:opacity-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
          پاک‌کردن
        </button>
        {savedAt ? <span>ذخیره شد {savedAt}</span> : null}
      </div>
    </section>
  );
}
