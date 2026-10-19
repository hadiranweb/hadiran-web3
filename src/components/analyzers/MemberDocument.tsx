import { DocumentToolbar } from "@/components/analyzers/DocumentToolbar";
import { InterpretationDocumentView } from "@/components/analyzers/InterpretationDocument";
import { readMemberConvertedDocument } from "@/lib/analyzers/persist-report";
import type { AnalyzerPack } from "@/lib/analyzers/pack";

export async function MemberDocument({ pack, accountId }: { pack: AnalyzerPack; accountId: number }) {
  const doc = await readMemberConvertedDocument(pack, accountId);
  if (!doc) return null;
  return (
    <div className="mt-10">
      <DocumentToolbar backHref="/analyzers" backLabel="آینه‌ها" />
      <InterpretationDocumentView doc={doc} />
    </div>
  );
}
