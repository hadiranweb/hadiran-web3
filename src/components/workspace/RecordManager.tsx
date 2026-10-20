import Link from "next/link";
import type { ModuleKind, WorkspaceData, WorkspaceItem } from "@/lib/workspace/types";

const copy: Record<
  Exclude<ModuleKind, "products">,
  { title: string; empty: string; createHref?: string; createLabel?: string }
> = {
  knowledge: {
    title: "دانش میز",
    empty: "ثبتی نیست.",
    createHref: "/workspace/capture",
    createLabel: "ثبت جدید",
  },
  projects: {
    title: "پروژه‌ها",
    empty: "پروژه‌ای در کارگاه نیست.",
  },
  collaborations: {
    title: "همکاری‌ها",
    empty: "درخواست همکاری تازه‌ای نیست.",
  },
};

function statusFa(kind: Exclude<ModuleKind, "products">, status: string) {
  if (kind === "knowledge") {
    const map: Record<string, string> = {
      captured: "ثبت خام",
      pending_review: "در انتظار بازبینی",
      promoted: "ارتقا یافته",
    };
    return map[status] || status;
  }
  if (kind === "collaborations") {
    const map: Record<string, string> = {
      submitted: "ارسال‌شده",
      reviewed: "بررسی‌شده",
      shortlisted: "فهرست کوتاه",
      interview: "مصاحبه",
      accepted: "پذیرفته",
      rejected: "رد شده",
    };
    return map[status] || status;
  }
  return status;
}

function hrefFor(kind: Exclude<ModuleKind, "products">, item: WorkspaceItem) {
  if (kind === "knowledge") return item.editUrl || `/workspace/records/${item.id}`;
  return item.url || item.editUrl || "#";
}

export function RecordManager({
  kind,
  initial,
  source,
}: {
  kind: Exclude<ModuleKind, "products">;
  initial: WorkspaceItem[];
  source: WorkspaceData["source"];
}) {
  const meta = copy[kind];
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">{meta.title}</h1>
          <p className="mt-2 text-sm text-muted">فهرست واقعی پایگاه؛ باغ دانش و کارگاه عمومی سر جایشان می‌مانند.</p>
        </div>
        {meta.createHref ? (
          <Link href={meta.createHref} className="inline-flex min-h-11 items-center rounded-[var(--radius-sm)] bg-accent px-4 text-sm font-medium text-accent-fg">
            {meta.createLabel}
          </Link>
        ) : null}
      </header>
      {source === "error" ? (
        <p className="rounded-[var(--radius-md)] border border-line bg-accent-soft px-4 py-3 text-sm text-ink" role="status">
          داده در دسترس نیست. نمونه جای ردیف واقعی نیامده است.
        </p>
      ) : null}
      {initial.length === 0 ? (
        <p className="text-sm text-muted">{meta.empty}</p>
      ) : (
        <ul className="space-y-2">
          {initial.map((item) => (
            <li key={item.id}>
              <Link
                href={hrefFor(kind, item)}
                className="block rounded-[var(--radius-md)] border border-line bg-elev p-4 hover:border-accent"
              >
                <p className="font-medium text-ink">{item.title}</p>
                <p className="mt-1 text-xs text-muted">
                  {statusFa(kind, item.status)}
                  {item.category ? ` · ${item.category}` : ""}
                </p>
                {item.detail ? <p className="mt-2 line-clamp-2 text-sm text-muted">{item.detail}</p> : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
