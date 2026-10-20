"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto max-w-xl px-4 py-16 text-center">
      <p className="mb-2 text-sm font-medium text-mark">خطا</p>
      <h1 className="text-2xl font-extrabold text-ink">صفحه الان باز نشد</h1>
      <p className="mt-3 text-sm leading-7 text-muted">یک لحظه دیگر دوباره تلاش کنید. اگر ادامه داشت، از خانه شروع کنید.</p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          className="inline-flex min-h-11 items-center rounded-[var(--radius-sm)] bg-accent px-4 text-sm font-medium text-accent-fg"
          onClick={() => reset()}
        >
          تلاش دوباره
        </button>
        <a href="/" className="inline-flex min-h-11 items-center rounded-[var(--radius-sm)] px-4 text-sm font-medium text-ink hover:bg-elev">
          خانه
        </a>
      </div>
    </main>
  );
}
