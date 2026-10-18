import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { GenericReportView } from "@/components/analyzers/GenericReport";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageShell } from "@/components/ui/PageShell";
import { readAttempt } from "@/lib/analyzers/attempts";
import { buildGenericReport } from "@/lib/analyzers/generic-report";
import { getCodePack, loadPack } from "@/lib/analyzers/registry";
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

  let report;
  try {
    report = buildGenericReport(pack, attempt.answers, attempt.results);
  } catch {
    return (
      <PageShell width="narrow">
        <PageHeader title="گزارش" lede="این گزارش از پاسخ‌های ثبت‌شده قابل بازتولید نیست." />
        <Link href={`/analyzers/${slug}`} className="text-sm font-medium text-accent hover:text-ink">
          بازگشت به ارزیابی
        </Link>
      </PageShell>
    );
  }

  return (
    <PageShell width="narrow">
      <p className="mb-4 text-sm">
        <Link href="/analyzers" className="text-muted hover:text-ink">
          تحلیلگر‌ها
        </Link>
        <span className="text-muted"> / {pack.nameFa}</span>
      </p>
      <PageHeader kicker="گزارش شخصی" title={pack.nameFa} lede="نمره و کلیدواژه بر اساس pack همین نسخه." />
      <GenericReportView report={report} hubHref="/analyzers" />
    </PageShell>
  );
}
