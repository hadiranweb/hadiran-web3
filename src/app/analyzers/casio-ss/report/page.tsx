import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MemberDocument } from "@/components/analyzers/MemberDocument";
import { RetakeButton } from "@/components/analyzers/RetakeButton";
import { UserSummaryView } from "@/components/analyzers/UserSummary";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageShell } from "@/components/ui/PageShell";
import { resolveLivePack } from "@/lib/analyzers/authored";
import { readAttempt } from "@/lib/analyzers/casio-ss/attempts";
import { buildCasioAuthoredPack } from "@/lib/analyzers/casio-ss/authored-pack";
import { renderUserSummary } from "@/lib/analyzers/summary-template";
import { requirePageAccount } from "@/lib/auth/guard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "گزارش عارضه‌یابی سازمانی",
  robots: { index: false, follow: false },
};

export default async function CasioSsReportPage() {
  const account = await requirePageAccount("/analyzers/casio-ss/report");
  const pack = (await resolveLivePack("casio-ss")) ?? buildCasioAuthoredPack();
  const attempt = await readAttempt(account.id);
  if (!attempt || attempt.status !== "submitted") {
    redirect("/analyzers/casio-ss");
  }

  const summary = renderUserSummary(pack, attempt.answers, attempt.results);

  return (
    <PageShell width="wide" className="print:max-w-none print:px-0 print:py-0">
      <div className="print:hidden">
        <p className="mb-4 text-sm">
          <Link href="/analyzers" className="text-muted hover:text-ink">
            تحلیلگر‌ها
          </Link>
          <span className="text-muted"> / {pack.nameFa}</span>
        </p>
        <PageHeader kicker="گزارش" title={pack.nameFa} lede="خلاصهٔ این نوبت. سند چندصفحه اگر آزمون‌ساز تبدیل کرده باشد اینجاست." />
        <UserSummaryView text={summary} />
        <RetakeButton api="/api/analyzers/casio-ss" href="/analyzers/casio-ss" />
      </div>
      <MemberDocument pack={pack} accountId={account.id} />
    </PageShell>
  );
}
