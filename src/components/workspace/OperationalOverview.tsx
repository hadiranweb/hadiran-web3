import Link from "next/link";
import { actionKinds, type ActionKind, type OperationalSnapshot } from "@/lib/workspace/operations-types";

const labels: Record<ActionKind, string> = {
  orders: "بررسی دریافت وجه",
  notes: "بازبینی یادداشت‌ها",
  collaborations: "درخواست‌های همکاری",
  analyzers: "تکمیل آزمون‌های من",
  bots: "بررسی خطای ربات‌ها",
};

export function OperationalOverview({ snapshot, listOnly = false }: { snapshot: OperationalSnapshot; listOnly?: boolean }) {
  return (
    <main className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      <header>
        <p className="text-xs font-medium text-muted">{snapshot.source === "live" ? "دادهٔ پایگاه" : "بدون اتصال داده"}</p>
        <h1 className="mt-1 text-2xl font-bold text-ink">{listOnly ? "نیازمند اقدام" : "میز کار"}</h1>
      </header>

      {snapshot.source !== "live" ? (
        <p className="rounded-[var(--radius-md)] border border-line bg-accent-soft px-4 py-3 text-sm text-ink" role="status">
          داده در دسترس نیست. نمونه جای اطلاع واقعی نیامده است.
        </p>
      ) : null}

      {!listOnly ? (
        <section className="grid gap-3 sm:grid-cols-3" aria-label="کارهای منتظر بررسی">
          {(["orders", "notes", "collaborations"] as const).map((kind) => (
            <Link key={kind} href={`/workspace/actions?kind=${kind}`} className="rounded-[var(--radius-md)] border border-line bg-elev p-4 hover:border-accent">
              <p className="text-sm text-muted">{labels[kind]}</p>
              <p className="mt-2 text-2xl font-bold tabular-nums text-ink">
                {snapshot.counts[kind] == null ? "—" : snapshot.counts[kind]!.toLocaleString("fa-IR")}
              </p>
            </Link>
          ))}
        </section>
      ) : (
        <nav className="flex flex-wrap gap-2" aria-label="نوع اقدام">
          {actionKinds.map((kind) => (
            <Link
              key={kind}
              href={`/workspace/actions?kind=${kind}`}
              className={`min-h-11 rounded-full border px-3 text-sm leading-[2.75rem] ${
                snapshot.filter === kind ? "border-accent bg-accent-soft text-ink" : "border-line text-muted hover:text-ink"
              }`}
            >
              {labels[kind]}
              {snapshot.counts[kind] != null ? ` · ${snapshot.counts[kind]!.toLocaleString("fa-IR")}` : ""}
            </Link>
          ))}
        </nav>
      )}

      <section>
        <h2 className="mb-3 text-lg font-bold text-ink">فهرست</h2>
        {snapshot.actions.length === 0 ? (
          <p className="text-sm text-muted">اقدام معلقی در این صافی نیست.</p>
        ) : (
          <ul className="space-y-2">
            {snapshot.actions.map((item) => (
              <li key={item.key}>
                <Link href={item.href} className="block rounded-[var(--radius-md)] border border-line bg-elev p-4 hover:border-accent">
                  <p className="font-medium text-ink">{item.title}</p>
                  <p className="mt-1 text-xs text-muted">{labels[item.kind]}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
