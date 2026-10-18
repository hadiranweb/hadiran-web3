import Link from "@/components/workspace/WorkspaceLink";
import type { Metadata } from "next";
import { requirePageOwner } from "@/lib/auth/guard";
import { botServiceLabel } from "@/lib/bots/script";
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
  const items = account.id === 0 ? [] : await listBots(account.id);

  return (
    <main className="ws-page repo-module space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">ربات‌ها</h1>
          <p className="mt-2 text-sm leading-7 text-muted">
            بخش مستقل میز. هر ربات تلگرام جدا ساخته می‌شود و زیر هیچ آزمونی — از جمله عارضه‌یابی — نیست. ورود مرورگر با تلگرام نیست.
          </p>
        </div>
        <Link href="/workspace/bots/new" className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-fg">
          ربات تازه
        </Link>
      </div>

      {account.id === 0 ? <p className="integration-notice">اتصال ربات و دریافت پاسخ‌ها به دیتابیس و تنظیمات واقعی سرور نیاز دارد؛ در پیش‌نمایش اتصالی برقرار نمی‌شود.</p> : null}
      {items.length === 0 ? (
        <p className="text-sm text-muted">رباتی نیست.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((bot) => (
            <li key={bot.id}>
              <Link
                href={`/workspace/bots/${bot.id}`}
                className="block rounded-2xl border border-line bg-elev p-4 hover:border-accent"
              >
                <p className="font-medium text-ink">{bot.titleFa}</p>
                <p className="mt-1 text-xs text-muted">
                  تلگرام · {botServiceLabel(bot.service)} · {statusFa[bot.status] ?? bot.status}
                  {bot.telegramUsername ? ` · @${bot.telegramUsername}` : ""}
                  {bot.service === "analyzers" && bot.analyzerSlug ? ` · فقط ${bot.analyzerSlug}` : ""}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
