import type { Metadata } from "next";
import { requirePageStaff } from "@/lib/auth/guard";
import { listMyReferrals } from "@/lib/auth/network";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "معرف‌ها",
  robots: { index: false, follow: false },
};

export default async function ReferralsPage() {
  const account = await requirePageStaff("/workspace/referrals");
  const data = await listMyReferrals(account.id);

  return (
    <main className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">کسانی که کد شما را زدند</h1>
      <section>
        <h2 className="text-base font-medium text-slate-800">درخت حساب</h2>
        {data.accounts.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">هنوز کسی با کد شما وارد نشده.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {data.accounts.map((row) => (
              <li key={row.publicCode} className="rounded-2xl border border-slate-200 bg-white p-4 text-sm">
                {row.nameFa} · <span dir="ltr">{row.publicCode}</span> · {row.roleFa}
              </li>
            ))}
          </ul>
        )}
      </section>
      <section>
        <h2 className="text-base font-medium text-slate-800">در آزمون</h2>
        {data.attempts.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">هنوز کسی در آزمون کد شما را نزده.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {data.attempts.map((row) => (
              <li key={`${row.slug}-${row.publicCode}`} className="rounded-2xl border border-slate-200 bg-white p-4 text-sm">
                {row.nameFa} · <span dir="ltr">{row.publicCode}</span> · {row.slug}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
