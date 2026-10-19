import type { Metadata } from "next";
import { DocumentBuilder } from "@/components/analyzers/DocumentBuilder";
import { listAccessiblePacks } from "@/lib/analyzers/access";
import { resolveDocumentTemplateId, templatesForPack } from "@/lib/analyzers/document-templates";
import { listConvertedDocuments } from "@/lib/analyzers/persist-report";
import { requirePageAnalyzerDesk } from "@/lib/auth/guard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "سندساز",
  robots: { index: false, follow: false },
};

export default async function DocumentsWorkspacePage() {
  const account = await requirePageAnalyzerDesk("/workspace/documents");
  const packs = (await listAccessiblePacks(account))
    .filter((row) => row.access.responses)
    .map((row) => ({
      slug: row.pack.slug,
      nameFa: row.pack.nameFa,
      templates: templatesForPack(row.pack).map((template) => ({
        id: template.id,
        titleFa: template.titleFa,
      })),
      defaultTemplateId: resolveDocumentTemplateId(row.pack),
    }));
  const documents = await listConvertedDocuments(packs.map((pack) => pack.slug));

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">سندساز</h1>
        <p className="mt-2 text-sm leading-7 text-slate-500">
          تفسیر را انتخاب کنید، قالب همان تفسیر را بردارید، تکی یا دسته‌ای تبدیل کنید. چاپ از روی سند ساخته‌شده است.
        </p>
      </div>
      <DocumentBuilder packs={packs} initialDocuments={documents} />
    </main>
  );
}
