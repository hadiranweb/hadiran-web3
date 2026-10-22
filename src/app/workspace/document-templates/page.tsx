import type { Metadata } from "next";
import Link from "next/link";
import { DocumentTemplateEditor } from "@/components/analyzers/DocumentTemplateEditor";
import { listDocumentTemplates } from "@/lib/analyzers/document-templates-store";
import { requirePageAnalyzerDesk } from "@/lib/auth/guard";
import { isOwner } from "@/lib/auth/roles";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "قالب‌ساز",
  robots: { index: false, follow: false },
};

export default async function DocumentTemplatesWorkspacePage() {
  const account = await requirePageAnalyzerDesk("/workspace/document-templates");
  const templates = await listDocumentTemplates(account.id);

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">قالب‌ساز</h1>
        <p className="mt-2 text-sm leading-7 text-slate-500">
          این‌جا خودِ قالب سند را می‌سازی و ویرایش می‌کنی (کد یا ویرایش بصری). ساختن سند نهایی از روی قالب کار{" "}
          <Link href="/workspace/documents" className="font-bold text-indigo-700">
            سندساز
          </Link>{" "}
          است؛ هر تغییری این‌جا روی سندهایی که از این پس ساخته می‌شوند اثر می‌گذارد.
        </p>
      </div>
      {templates.length ? (
        <DocumentTemplateEditor initial={templates} canEditBase={isOwner(account.role)} />
      ) : (
        <p className="text-sm text-slate-500">هنوز قالبی در دسترس نیست.</p>
      )}
    </main>
  );
}
