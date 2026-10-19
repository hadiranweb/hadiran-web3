import { NextResponse } from "next/server";
import { parseChrome } from "@/lib/analyzers/document-chrome";
import { updateDocumentTemplateChrome } from "@/lib/analyzers/document-templates-store";
import { requireAnalyzerDesk } from "@/lib/auth/guard";

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
  const chromeRaw = (body as Record<string, unknown>).chrome;
  const chrome = parseChrome(chromeRaw);
  if (!chrome.html.trim() && !chrome.css.trim()) {
    return NextResponse.json({ error: "empty" }, { status: 400 });
  }
  const template = await updateDocumentTemplateChrome(id, chrome);
  if (!template) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ template });
}
