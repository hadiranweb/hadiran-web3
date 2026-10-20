export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16" aria-busy="true" aria-live="polite">
      <span className="sr-only">در حال بارگذاری</span>
      <div className="h-8 w-40 animate-pulse rounded-[var(--radius-sm)] bg-elev" />
      <div className="mt-4 h-4 w-full max-w-md animate-pulse rounded-[var(--radius-sm)] bg-elev" />
      <div className="mt-2 h-4 w-2/3 animate-pulse rounded-[var(--radius-sm)] bg-elev" />
    </div>
  );
}
