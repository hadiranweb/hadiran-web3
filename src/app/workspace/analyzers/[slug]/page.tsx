import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requirePageAnalyzerDesk } from "@/lib/auth/guard";
import { isOwner } from "@/lib/auth/roles";
import { analyzerAccess } from "@/lib/analyzers/access";
import { AnalyzerEditor } from "@/components/analyzers/AnalyzerEditor";
import { readAuthoredPack } from "@/lib/analyzers/authored";
import { listBots } from "@/lib/bots/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ویرایش تحلیلگر",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ slug: string }> };

export default async function EditAnalyzerPage({ params }: Props) {
  const account = await requirePageAnalyzerDesk("/workspace/analyzers");
  const { slug } = await params;
  const pack = await readAuthoredPack(slug);
  if (!pack) notFound();
  const access = await analyzerAccess(account, slug);
  if (!access.view) notFound();
  const bots = isOwner(account.role)
    ? (await listBots(account.id))
        .filter((bot) => bot.service === "analyzers" && (!bot.analyzerSlug || bot.analyzerSlug === pack.slug))
        .map((bot) => ({
          id: bot.id,
          titleFa: bot.titleFa,
          analyzerSlug: bot.analyzerSlug,
          telegramUsername: bot.telegramUsername,
        }))
    : [];

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <p className="text-sm">
        <Link href="/workspace/analyzers" className="text-slate-500 hover:text-indigo-700">
          تحلیلگر‌ها
        </Link>
      </p>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">{pack.nameFa}</h1>
        <Link href={`/analyzers/${pack.slug}`} className="text-sm text-indigo-700">
          اجرای آزمایشی
        </Link>
      </div>
      <AnalyzerEditor
        initial={pack}
        canEdit={access.edit}
        canReadResponses={access.responses}
        canGrant={access.grant}
        bots={bots}
      />
    </main>
  );
}
