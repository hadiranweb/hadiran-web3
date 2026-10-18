import Link from "@/components/workspace/WorkspaceLink";
import { buildCasioAuthoredPack } from "@/lib/analyzers/casio-ss/authored-pack";
import type { Metadata } from "next";
import { requirePageAnalyzerDesk } from "@/lib/auth/guard";
import { isStaff } from "@/lib/auth/roles";
import { listAccessiblePacks } from "@/lib/analyzers/access";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "میز آزمون‌ساز",
  robots: { index: false, follow: false },
};

const statusFa: Record<string, string> = {
  draft: "پیش‌نویس",
  open: "باز",
  archived: "بایگانی",
};

export default async function WorkspaceAnalyzersPage() {
  const account = await requirePageAnalyzerDesk("/workspace/analyzers");
  const authored = account.id === 0 ? [{ pack: buildCasioAuthoredPack(), access: { view: true, edit: true, responses: false, grant: false } }] : await listAccessiblePacks(account);
  const canCreate = isStaff(account.role);

  return (
    <main className="ws-page repo-module space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">میز آزمون‌ساز</h1>
          <p className="mt-2 text-sm leading-7 text-muted">
            {canCreate
              ? "آزمون بسازید، پاسخ‌ها و تفسیر را ببینید، و با شناسهٔ ۸رقمی به همکار دسترسی همین آزمون را بدهید."
              : "آزمون‌هایی که به شما سپرده شده. پاسخ‌ها و تفسیر اولیه روی همان صفحه است."}
          </p>
        </div>
        {canCreate ? (
          <Link
            href="/workspace/analyzers/new"
            className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-fg"
          >
            آزمون تازه
          </Link>
        ) : null}
      </div>

      <section>
        {authored.length === 0 ? (
          <p className="text-sm text-muted">
            {canCreate ? "آزمونی نیست. از «آزمون تازه» شروع کنید." : "هنوز آزمونی به شما سپرده نشده."}
          </p>
        ) : (
          <ul className="space-y-2">
            {authored.map(({ pack, access }) => (
              <li key={pack.slug}>
                <Link
                  href={`/workspace/analyzers/${pack.slug}`}
                  className="block rounded-2xl border border-line bg-elev p-4 hover:border-accent"
                >
                  <p className="font-medium text-ink">{pack.nameFa}</p>
                  <p className="mt-1 text-xs text-muted">
                    {pack.slug} · {statusFa[pack.status] ?? pack.status} · {pack.version}
                    {access.edit ? "" : " · پاسخ و تفسیر"}
                    {access.grant ? " · اعطا" : ""}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
