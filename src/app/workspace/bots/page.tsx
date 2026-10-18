import Link from "next/link";
import type { Metadata } from "next";
import { requirePageOwner } from "@/lib/auth/guard";
import { listBots } from "@/lib/bots/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ربات‌ها",
  robots: { index: false, follow: false },
};

const statusFa: Record<string, string> = {
  disconnected: "قطع",
  connected: "متصل",
  paused: "متوقف",
  error: "خطا",
};

export default async function WorkspaceBotsPage() {
  const account = await requirePageOwner("/workspace/bots");
  const items = await listBots(account.id);

  return (
    <main className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ربات‌ها</h1>
          <p className="mt-2 text-sm leading-7 text-slate-500">
            ربات لایهٔ سرویس تحلیل‌گر است، نه یک آزمون. اتصال و قالب گفتگو در همین میز. ورود مرورگر با تلگرام نیست.
          </p>
        </div>
        <Link href="/workspace/bots/new" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white">
          ربات تازه
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-slate-500">رباتی نیست.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((bot) => (
            <li key={bot.id}>
              <Link
                href={`/workspace/bots/${bot.id}`}
                className="block rounded-2xl border border-slate-200 bg-white p-4 hover:border-indigo-200"
              >
                <p className="font-medium text-slate-900">{bot.titleFa}</p>
                <p className="mt-1 text-xs text-slate-500">
                  تلگرام · تحلیل‌گر · {statusFa[bot.status] ?? bot.status}
                  {bot.telegramUsername ? ` · @${bot.telegramUsername}` : ""}
                  {bot.analyzerSlug ? ` · فقط ${bot.analyzerSlug}` : ""}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
