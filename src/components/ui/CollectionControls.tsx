import Link from "next/link";

/** GET form for public lists: no client island, works without JS. */
export function CollectionSearch({
  action,
  q,
  placeholder,
  hidden = {},
}: {
  action: string;
  q: string;
  placeholder: string;
  hidden?: Record<string, string | undefined>;
}) {
  const kept = Object.entries(hidden)
    .filter(([, value]) => value)
    .map(([name, value]) => `${name}=${encodeURIComponent(value as string)}`)
    .join("&");
  const clearHref = kept ? `${action}?${kept}` : action;

  return (
    <form action={action} method="get" className="mb-4 flex w-full max-w-xl flex-wrap items-center gap-2">
      {Object.entries(hidden).map(([name, value]) =>
        value ? <input key={name} type="hidden" name={name} value={value} /> : null,
      )}
      <input
        type="search"
        name="q"
        defaultValue={q}
        placeholder={placeholder}
        aria-label={placeholder}
        className="min-h-11 w-full min-w-0 flex-1 rounded-[var(--radius-md)] border border-line bg-elev px-4 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] sm:w-auto"
      />
      <button type="submit" className="ws-button ws-primary shrink-0">
        جستجو
      </button>
      {q ? (
        <Link href={clearHref} className="shrink-0 text-sm text-muted hover:text-ink" aria-label="پاک کردن جست‌وجو">
          پاک کردن جست‌وجو
        </Link>
      ) : null}
    </form>
  );
}

export type ControlLink = { href: string; label: string; active?: boolean };

export function CollectionChips({ label, links }: { label?: string; links: ControlLink[] }) {
  if (!links.length) return null;
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {label ? <span className="text-xs text-muted">{label}</span> : null}
      {links.map((link) => (
        <Link
          key={link.href + link.label}
          href={link.href}
          className={link.active ? "chip" : "ws-button min-h-9 px-3 py-1 text-xs"}
          aria-current={link.active ? "page" : undefined}
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}

export function CollectionEmpty({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="surface p-6 text-sm leading-7 text-muted">
      <p className="font-medium text-ink">{title}</p>
      {hint ? <p className="mt-2">{hint}</p> : null}
    </div>
  );
}
