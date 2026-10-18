import Link from "next/link";
import type { Metadata } from "next";
import { requirePageOwner } from "@/lib/auth/guard";
import { BotCreateForm } from "@/components/bots/BotCreateForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ربات تازه",
  robots: { index: false, follow: false },
};

export default async function NewBotPage() {
  const account = await requirePageOwner("/workspace/bots/new");

  return (
    <main className="ws-page repo-module space-y-6">
      <p className="text-sm">
        <Link href="/workspace/bots" className="text-muted hover:text-mark">
          ربات‌ها
        </Link>
      </p>
      <h1 className="text-2xl font-bold text-ink">ربات تازه</h1>
      <p className="text-sm leading-7 text-muted">
        هر ربات مستقل است و زیر یک آزمون نمی‌آید. توکن را در صفحهٔ بعد می‌گذارید. این ورود سایت نیست.
      </p>
      <fieldset disabled={account.id === 0}><BotCreateForm /></fieldset>
    </main>
  );
}
