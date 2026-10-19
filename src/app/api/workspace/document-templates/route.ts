import { NextResponse } from "next/server";
import { documentVariableCatalog } from "@/lib/analyzers/document-chrome";
import { listDocumentTemplates } from "@/lib/analyzers/document-templates-store";
import { requireAnalyzerDesk } from "@/lib/auth/guard";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAnalyzerDesk();
  if (auth.error) { auth.error.headers.set("Cache-Control","private, no-store"); return auth.error; }
  if(auth.account.id===0 || !process.env.DATABASE_URL)return privateJson({error:"unavailable"},{status:503});
  const templates = await listDocumentTemplates(auth.account.id);
  return privateJson({ templates, variables: documentVariableCatalog() });
}

function privateJson(body: unknown, init?: ResponseInit) {
  const response = NextResponse.json(body,init);
  response.headers.set("Cache-Control","private, no-store");
  return response;
}
