import Link from "next/link";
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
  const { id } = await params;
  const bot = await readBot(account.id, id);
  if (!bot) notFound();
  const packs = await loadPacks();
  const analyzers = packs
    .filter((pack) => pack.status !== "archived")
    .map((pack) => ({ slug: pack.slug, nameFa: pack.nameFa }));

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <p className="text-sm">
        <Link href="/workspace/bots" className="text-slate-500 hover:text-indigo-700">
          ربات‌ها
        </Link>
      </p>
      <h1 className="text-2xl font-bold text-slate-900">{bot.titleFa}</h1>
      <BotEditor initial={bot} analyzers={analyzers} />
    </main>
  );
}
