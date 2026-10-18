import Link from "@/components/workspace/WorkspaceLink";
import type { Metadata } from "next";
import { requirePageOwner } from "@/lib/auth/guard";
import { AnalyzerCreateForm } from "@/components/analyzers/AnalyzerCreateForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "آزمون تازه",
  robots: { index: false, follow: false },
};

export default async function NewAnalyzerPage() {
  const account = await requirePageOwner("/workspace/analyzers/new");
  return (
    <main className="ws-page repo-module space-y-6">
      <p className="text-sm">
        <Link href="/workspace/analyzers" className="text-muted hover:text-mark">
          تحلیلگر‌ها
        </Link>
      </p>
      <h1 className="text-2xl font-bold text-ink">آزمون تازه</h1>
      <p className="text-sm leading-7 text-muted">
        سؤال‌ها ردیف دیتابیس نمی‌شوند؛ یک pack نسخه‌دار ذخیره می‌شود. Typeform نیست.
      </p>
      {account.id === 0 ? <p className="integration-notice">فرم واقعی تألیف تحلیلگر؛ ذخیره در محیط بدون دیتابیس غیرفعال است.</p> : null}
      <section className="ws-panel p-6"><fieldset disabled={account.id === 0}><AnalyzerCreateForm /></fieldset></section>
    </main>
  );
}
