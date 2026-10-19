import { NextResponse } from "next/server";
import { documentVariableCatalog } from "@/lib/analyzers/document-chrome";
import { listDocumentTemplates } from "@/lib/analyzers/document-templates-store";
import { requireAnalyzerDesk } from "@/lib/auth/guard";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAnalyzerDesk();
  if (auth.error) return auth.error;
  const templates = await listDocumentTemplates();
  return NextResponse.json({ templates, variables: documentVariableCatalog() });
}
