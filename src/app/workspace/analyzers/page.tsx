import Link from "next/link";
import type { Metadata } from "next";
import { requirePageOwner } from "@/lib/auth/guard";
import { listAuthoredPacks } from "@/lib/analyzers/authored";
import { codePacks } from "@/lib/analyzers/registry";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "تألیف تحلیلگر‌ها",
  robots: { index: false, follow: false },
};

const statusFa: Record<string, string> = {
  draft: "پیش‌نویس",
  open: "باز",
  archived: "بایگانی",
};

export default async function WorkspaceAnalyzersPage() {
  await requirePageOwner("/workspace/analyzers");
  const authored = await listAuthoredPacks();
  const code = codePacks();

  return (
    <main className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">تحلیلگر‌ها</h1>
          <p className="mt-2 text-sm leading-7 text-slate-500">
            تألیف فقط برای مالک است و ایندکس نمی‌شود. casio-ss از کد می‌آید.
          </p>
        </div>
        <Link
          href="/workspace/analyzers/new"
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white"
        >
          آزمون تازه
        </Link>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-bold text-slate-900">از کد</h2>
        <ul className="space-y-2">
          {code.map((pack) => (
            <li key={pack.slug} className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="font-medium text-slate-900">{pack.nameFa}</p>
              <p className="mt-1 text-xs text-slate-500">
                {pack.slug} · {statusFa[pack.status] ?? pack.status} · ویرایش از میز نیست
              </p>
              <Link href={`/analyzers/${pack.slug}`} className="mt-2 inline-block text-sm text-indigo-700">
                صفحهٔ اجرا
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold text-slate-900">تألیف‌شده</h2>
        {authored.length === 0 ? (
          <p className="text-sm text-slate-500">هنوز آزمون دومی نیست.</p>
        ) : (
          <ul className="space-y-2">
            {authored.map((pack) => (
              <li key={pack.slug}>
                <Link
                  href={`/workspace/analyzers/${pack.slug}`}
                  className="block rounded-2xl border border-slate-200 bg-white p-4 hover:border-indigo-200"
                >
                  <p className="font-medium text-slate-900">{pack.nameFa}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {pack.slug} · {statusFa[pack.status] ?? pack.status} · {pack.version}
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
