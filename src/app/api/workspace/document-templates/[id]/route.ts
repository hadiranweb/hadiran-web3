import { NextResponse } from "next/server";
import { parseChrome } from "@/lib/analyzers/document-chrome";
import { updateDocumentTemplateChrome } from "@/lib/analyzers/document-templates-store";
import { requireAnalyzerDesk } from "@/lib/auth/guard";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Props) {
  const auth = await requireAnalyzerDesk();
  if (auth.error) { auth.error.headers.set("Cache-Control","private, no-store"); return auth.error; }
  const { id } = await params;
  if(auth.account.id===0 || !process.env.DATABASE_URL)return privateJson({error:"unavailable"},{status:503});
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return privateJson({ error: "invalid_json" }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return privateJson({ error: "invalid_json" }, { status: 400 });
  }
  const chromeRaw = (body as Record<string, unknown>).chrome;
  const chrome = parseChrome(chromeRaw);
  if (!chrome.html.trim() && !chrome.css.trim()) {
    return privateJson({ error: "empty" }, { status: 400 });
  }
  const template = await updateDocumentTemplateChrome(id, chrome, auth.account.id);
  if (!template) return privateJson({ error: "not_found" }, { status: 404 });
  return privateJson({ template });
}

function privateJson(body: unknown, init?: ResponseInit) {
  const response = NextResponse.json(body,init);
  response.headers.set("Cache-Control","private, no-store");
  return response;
}
