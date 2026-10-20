import { NextResponse } from "next/server";
import { parseChrome } from "@/lib/analyzers/document-chrome";
import { saveDocumentTemplateChrome } from "@/lib/analyzers/document-templates-store";
import { requireAnalyzerDesk } from "@/lib/auth/guard";
import { isOwner } from "@/lib/auth/roles";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Props) {
  const auth = await requireAnalyzerDesk();
  if (auth.error) return auth.error;
  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const payload = body as Record<string, unknown>;
  const chrome = parseChrome(payload.chrome);
  if (!chrome.html.trim() && !chrome.css.trim()) {
    return NextResponse.json({ error: "empty" }, { status: 400 });
  }
  const applyBase = isOwner(auth.account.role) && payload.applyBase === true;
  const template = await saveDocumentTemplateChrome({
    id,
    chrome,
    accountId: auth.account.id,
    applyBase,
  });
  if (!template) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ template });
}
