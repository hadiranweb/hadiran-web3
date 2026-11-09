import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AssessmentOffers } from "@/components/analyzers/AssessmentOffers";
import { AssessmentResultPaywall } from "@/components/analyzers/AssessmentResultPaywall";
import { MemberDocument } from "@/components/analyzers/MemberDocument";
import { RetakeButton } from "@/components/analyzers/RetakeButton";
import { UserSummaryView } from "@/components/analyzers/UserSummary";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageShell } from "@/components/ui/PageShell";
import { readAttempt } from "@/lib/analyzers/attempts";
import { loadPack } from "@/lib/analyzers/registry";
import { renderUserSummary } from "@/lib/analyzers/summary-template";
import { requirePageAccount } from "@/lib/auth/guard";
import { activeAssessmentTariff, hasAssessmentEntitlement } from "@/lib/finance/assessment-orders";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "گزارش آینه",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ slug: string }> };

export default async function AnalyzerReportPage({ params }: Props) {
  const { slug } = await params;
  const account = await requirePageAccount(`/analyzers/${slug}/report`);
  const pack = await loadPack(slug);
  if (!pack) notFound();
  if (pack.status !== "open" && account.role !== "owner") notFound();

  const attempt = await readAttempt(account.id, pack);
  if (!attempt || attempt.status !== "submitted") {
    redirect(`/analyzers/${slug}`);
  }

  const isOwner = account.role === "owner";
  const executionEntitled =
    isOwner || (await hasAssessmentEntitlement(account.id, "analyzer", attempt.id, "execution"));
  const executionTariff = executionEntitled ? null : await activeAssessmentTariff(pack.slug, "execution");
  const summary = executionEntitled ? renderUserSummary(pack, attempt.answers, attempt.results) : null;

  return (
    <PageShell width="wide" className="print:max-w-none print:px-0 print:py-0">
      <div className="print:hidden">
        <p className="mb-4 text-sm">
          <Link href="/analyzers" className="text-muted hover:text-ink">
            آینه‌ها
          </Link>
          <span className="text-muted"> / {pack.nameFa}</span>
        </p>
        <PageHeader kicker="گزارش" title={pack.nameFa} lede="خلاصهٔ این نوبت. سند چندصفحه اگر آزمون‌ساز تبدیل کرده باشد اینجاست." />
        {summary != null ? (
          <UserSummaryView text={summary} />
        ) : (
          <AssessmentResultPaywall
            slug={pack.slug}
            attemptId={attempt.id}
            priceIrr={executionTariff ? String(executionTariff.priceIrr) : null}
            initialDiscountCode={attempt.discountCode}
            canPurchase={attempt.executionPaymentMode !== "before_start"}
          />
        )}
        <AssessmentOffers slug={pack.slug} attemptId={attempt.id} accountId={account.id} />
        <RetakeButton api={`/api/analyzers/${pack.slug}`} href={`/analyzers/${pack.slug}`} />
      </div>
      <MemberDocument pack={pack} accountId={account.id} />
    </PageShell>
  );
}
