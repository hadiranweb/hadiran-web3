import Link from "@/components/workspace/WorkspaceLink";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requirePageOwner } from "@/lib/auth/guard";
import { BotEditor } from "@/components/bots/BotEditor";
import { readBot } from "@/lib/bots/store";
import { loadPacks } from "@/lib/analyzers/registry";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "تنظیم ربات",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ id: string }> };

export default async function BotDetailPage({ params }: Props) {
  const account = await requirePageOwner("/workspace/bots");
  if (account.id === 0) return <main className="ws-page"><p className="integration-notice">تنظیم ربات به دیتابیس واقعی نیاز دارد.</p></main>;
  const { id } = await params;
  const bot = await readBot(account.id, id);
  if (!bot) notFound();
  const packs = await loadPacks();
  const analyzers = packs
    .filter((pack) => pack.status !== "archived")
    .map((pack) => ({ slug: pack.slug, nameFa: pack.nameFa }));
  if (!analyzers.some((item) => item.slug === "casio-ss")) {
    analyzers.unshift({ slug: "casio-ss", nameFa: "عارضه‌یابی سازمانی" });
  }

  return (
    <main className="ws-page repo-module space-y-6">
      <p className="text-sm">
        <Link href="/workspace/bots" className="text-muted hover:text-mark">
          ربات‌ها
        </Link>
      </p>
      <h1 className="text-2xl font-bold text-ink">{bot.titleFa}</h1>
      <BotEditor initial={bot} analyzers={analyzers} />
    </main>
  );
}
