import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { DocumentToolbar } from "@/components/analyzers/DocumentToolbar";
import { InterpretationDocumentView } from "@/components/analyzers/InterpretationDocument";
import { analyzerAccess } from "@/lib/analyzers/access";
import { readConvertedDocument } from "@/lib/analyzers/persist-report";
import { requirePageAnalyzerDesk } from "@/lib/auth/guard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "سند تفسیر",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ id: string }> };

export default async function ConvertedDocumentPage({ params }: Props) {
  const account = await requirePageAnalyzerDesk("/workspace/documents");
  const { id: raw } = await params;
  const id = Number(raw);
  const row = await readConvertedDocument(id);
  if (!row) notFound();
  const access = await analyzerAccess(account, row.slug);
  if (!access.responses) notFound();

  return (
    <main className="mx-auto max-w-[220mm] space-y-0 px-4 py-8 print:max-w-none print:px-0 print:py-0">
      <DocumentToolbar backHref="/workspace/documents" backLabel="بازگشت به سندساز" />
      <InterpretationDocumentView doc={row.doc} />
    </main>
  );
}
