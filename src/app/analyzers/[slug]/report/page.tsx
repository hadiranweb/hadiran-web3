import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { RetakeButton } from "@/components/analyzers/RetakeButton";
import { UserSummaryView } from "@/components/analyzers/UserSummary";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageShell } from "@/components/ui/PageShell";
import { readAttempt } from "@/lib/analyzers/attempts";
import { getCodePack, loadPack } from "@/lib/analyzers/registry";
import { renderUserSummary } from "@/lib/analyzers/summary-template";
import { requirePageAccount } from "@/lib/auth/guard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "گزارش تحلیلگر",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ slug: string }> };

export default async function AnalyzerReportPage({ params }: Props) {
  const { slug } = await params;
  if (getCodePack(slug)) notFound();
  const account = await requirePageAccount(`/analyzers/${slug}/report`);
  const pack = await loadPack(slug);
  if (!pack) notFound();
  if (pack.status !== "open" && account.role !== "owner") notFound();

  const attempt = await readAttempt(account.id, pack);
  if (!attempt || attempt.status !== "submitted") {
    redirect(`/analyzers/${slug}`);
  }

  const summary = renderUserSummary(pack, attempt.answers, attempt.results);

  return (
    <PageShell width="narrow">
      <p className="mb-4 text-sm">
        <Link href="/analyzers" className="text-muted hover:text-ink">
          تحلیلگر‌ها
        </Link>
        <span className="text-muted"> / {pack.nameFa}</span>
      </p>
      <PageHeader kicker="جمع‌بندی" title={pack.nameFa} lede="خلاصهٔ این نوبت. تفسیر تفصیلی نزد آزمون‌ساز است." />
      <UserSummaryView text={summary} />
      <RetakeButton api={`/api/analyzers/${pack.slug}`} href={`/analyzers/${pack.slug}`} />
    </PageShell>
  );
}
