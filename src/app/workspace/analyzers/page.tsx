import Link from "next/link";
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
  const authored = await listAccessiblePacks(account);
  const canCreate = isStaff(account.role);

  return (
    <main className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">میز آزمون‌ساز</h1>
          <p className="mt-2 text-sm leading-7 text-slate-500">
            {canCreate
              ? "آزمون بسازید، پاسخ‌ها و تفسیر را ببینید، و با شناسهٔ ۸رقمی به همکار دسترسی همین آزمون را بدهید."
              : "آزمون‌هایی که به شما سپرده شده. پاسخ‌ها و تفسیر اولیه روی همان صفحه است."}
          </p>
        </div>
        {canCreate ? (
          <Link
            href="/workspace/analyzers/new"
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white"
          >
            آزمون تازه
          </Link>
        ) : null}
      </div>

      <section>
        {authored.length === 0 ? (
          <p className="text-sm text-slate-500">
            {canCreate ? "آزمونی نیست. از «آزمون تازه» شروع کن." : "هنوز آزمونی به شما سپرده نشده."}
          </p>
        ) : (
          <ul className="space-y-2">
            {authored.map(({ pack, access }) => (
              <li key={pack.slug}>
                <Link
                  href={`/workspace/analyzers/${pack.slug}`}
                  className="block rounded-2xl border border-slate-200 bg-white p-4 hover:border-indigo-200"
                >
                  <p className="font-medium text-slate-900">{pack.nameFa}</p>
                  <p className="mt-1 text-xs text-slate-500">
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
