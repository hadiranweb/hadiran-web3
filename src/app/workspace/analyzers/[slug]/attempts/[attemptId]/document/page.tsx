import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requirePageAnalyzerDesk } from "@/lib/auth/guard";
import { analyzerAccess } from "@/lib/analyzers/access";
import { readAuthoredPack } from "@/lib/analyzers/authored";
import { buildInterpretationDocument } from "@/lib/analyzers/document-model";
import { readWorkspaceAttempt } from "@/lib/analyzers/workspace-attempts";
import { DocumentToolbar } from "@/components/analyzers/DocumentToolbar";
import { InterpretationDocumentView } from "@/components/analyzers/InterpretationDocument";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "پیش‌نمایش تفسیر",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ slug: string; attemptId: string }> };

export default async function InterpretationPreviewPage({ params }: Props) {
  const account = await requirePageAnalyzerDesk("/workspace/analyzers");
  const { slug, attemptId: rawId } = await params;
  const attemptId = Number(rawId);
  const pack = await readAuthoredPack(slug);
  if (!pack) notFound();
  const access = await analyzerAccess(account, slug);
  if (!access.responses) notFound();
  const row = await readWorkspaceAttempt(slug, attemptId);
  if (!row || row.status !== "submitted") notFound();

  let doc;
  try {
    doc = buildInterpretationDocument(pack, row);
  } catch {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-sm text-red-700">این نوبت پیش‌نمایش نشد.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[220mm] space-y-0 px-4 py-8 print:max-w-none print:px-0 print:py-0">
      <DocumentToolbar backHref={`/workspace/analyzers/${pack.slug}`} backLabel="بازگشت به تفسیر" />
      <p className="print:hidden mb-4 text-sm text-slate-500">پیش‌نمایش زنده از تفسیر فعلی. سند کالا بعد از تبدیل در سندساز است.</p>
      <InterpretationDocumentView doc={doc} />
    </main>
  );
}
