import { previewStore } from "@/lib/preview/store";
import { withPreviewAccess } from "@/lib/auth/preview-url";
import type { Metadata } from "next";
import Link from "@/components/workspace/WorkspaceLink";
import { redirect } from "next/navigation";
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
  const pack = account.id === 0 ? buildCasioAuthoredPack() : (await resolveLivePack("casio-ss")) ?? buildCasioAuthoredPack();
  const preview = await previewStore(account);
  const attempt = preview ? preview.attempt : await readAttempt(account.id);
  if (!attempt || attempt.status !== "submitted") {
    redirect(withPreviewAccess("/analyzers/casio-ss", account.previewTicket));
  }

  const summary = renderUserSummary(pack, attempt.answers, attempt.results);

  return (
    <PageShell width="narrow">
      {account.id === 0 ? <p className="integration-notice mb-6">پاسخ‌ها و گزارش فقط در نشست موقت پیش‌نمایش نگه‌داری می‌شوند.</p> : null}
      <p className="mb-4 text-sm">
        <Link href="/analyzers" className="text-muted hover:text-ink">
          آینه‌ها
        </Link>
        <span className="text-muted"> / {pack.nameFa}</span>
      </p>
      <PageHeader kicker="جمع‌بندی" title={pack.nameFa} lede="خلاصهٔ این نوبت. تفسیر تفصیلی نزد آزمون‌ساز است." />
      <UserSummaryView text={summary} />
      <RetakeButton api="/api/analyzers/casio-ss" href="/analyzers/casio-ss" />
    </PageShell>
  );
}
