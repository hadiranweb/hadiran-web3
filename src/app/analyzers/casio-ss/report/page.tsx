import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CasioSsReport } from "@/components/analyzers/CasioSsReport";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageShell } from "@/components/ui/PageShell";
import { readAttempt } from "@/lib/analyzers/casio-ss/attempts";
import { buildCasioReport } from "@/lib/analyzers/casio-ss/report";
import { requirePageAccount } from "@/lib/auth/guard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "گزارش عارضه‌یابی سازمانی",
  robots: { index: false, follow: false },
};

export default async function CasioSsReportPage() {
  const account = await requirePageAccount("/analyzers/casio-ss/report");
  const attempt = await readAttempt(account.id);
  if (!attempt || attempt.status !== "submitted") {
    redirect("/analyzers/casio-ss");
  }

  let report;
  try {
    report = buildCasioReport(attempt.answers, attempt.results);
  } catch {
    return (
      <PageShell width="narrow">
        <PageHeader title="گزارش عارضه‌یابی سازمانی" lede="این گزارش از پاسخ‌های ثبت‌شده قابل بازتولید نیست." />
        <Link href="/analyzers/casio-ss" className="text-sm font-medium text-accent hover:text-ink">
          بازگشت به ارزیابی
        </Link>
      </PageShell>
    );
  }

  const title = report.businessName
    ? `گزارش عارضه‌یابی — ${report.businessName}`
    : "گزارش عارضه‌یابی سازمانی";

  return (
    <PageShell width="narrow">
      <p className="mb-4 text-sm">
        <Link href="/analyzers" className="text-muted hover:text-ink">
          تحلیلگر‌ها
        </Link>
        <span className="text-muted"> / عارضه‌یابی سازمانی</span>
      </p>
      <PageHeader kicker="گزارش شخصی" title={title} lede="پنج لایه، گلوگاه، و درخت کلیدواژه بر اساس پاسخ‌های شما." />
      <CasioSsReport report={report} />
    </PageShell>
  );
}
