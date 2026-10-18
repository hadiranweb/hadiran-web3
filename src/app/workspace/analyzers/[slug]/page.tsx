import { buildCasioAuthoredPack } from "@/lib/analyzers/casio-ss/authored-pack";
import Link from "@/components/workspace/WorkspaceLink";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requirePageStaff } from "@/lib/auth/guard";
import { analyzerAccess } from "@/lib/analyzers/access";
import { AnalyzerEditor } from "@/components/analyzers/AnalyzerEditor";
import { readAuthoredPack } from "@/lib/analyzers/authored";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ویرایش تحلیلگر",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ slug: string }> };

export default async function EditAnalyzerPage({ params }: Props) {
  const account = await requirePageStaff("/workspace/analyzers");
  const { slug } = await params;
  const pack = account.id === 0 ? (slug === "casio-ss" ? buildCasioAuthoredPack() : null) : await readAuthoredPack(slug);
  if (!pack) notFound();
  const access = account.id === 0 ? { view: true, edit: true, responses: false, grant: false } : await analyzerAccess(account, slug);
  if (!access.view) notFound();

  return (
    <main className="ws-page repo-module space-y-6">
      <p className="text-sm">
        <Link href="/workspace/analyzers" className="text-muted hover:text-mark">
          تحلیلگر‌ها
        </Link>
      </p>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-bold text-ink">{pack.nameFa}</h1>
        <Link href={`/analyzers/${pack.slug}`} className="text-sm text-mark">
          اجرای آزمایشی
        </Link>
      </div>
      {account.id === 0 ? <p className="integration-notice">بررسی ویرایشگر و سؤال‌ها آزاد است؛ ذخیره در محیط بدون دیتابیس انجام نمی‌شود.</p> : null}
      <AnalyzerEditor initial={pack} readOnly={account.id === 0} canEdit={access.edit} canReadResponses={account.id !== 0 && access.responses} canGrant={account.id !== 0 && access.grant} />
    </main>
  );
}
