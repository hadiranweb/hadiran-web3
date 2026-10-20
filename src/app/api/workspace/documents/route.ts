import { NextResponse } from "next/server";
import { analyzerAccess, listAccessiblePacks } from "@/lib/analyzers/access";
import { readAuthoredPack } from "@/lib/analyzers/authored";
import { templateAllowedForPack } from "@/lib/analyzers/document-templates";
import { convertAttemptDocument, listConvertedDocuments } from "@/lib/analyzers/persist-report";
import { readWorkspaceAttempt } from "@/lib/analyzers/workspace-attempts";
import { requireAnalyzerDesk } from "@/lib/auth/guard";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireAnalyzerDesk();
  if (auth.error) return auth.error;
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug")?.trim() ?? "";
  if (slug) {
    const access = await analyzerAccess(auth.account, slug);
    if (!access.responses) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    const items = await listConvertedDocuments([slug]);
    return NextResponse.json({ items });
  }
  const packs = (await listAccessiblePacks(auth.account)).filter((row) => row.access.responses);
  const items = await listConvertedDocuments(packs.map((row) => row.pack.slug));
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const auth = await requireAnalyzerDesk();
  if (auth.error) return auth.error;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const row = body as Record<string, unknown>;
  const slug = typeof row.slug === "string" ? row.slug.trim() : "";
  const templateId = typeof row.templateId === "string" ? row.templateId.trim() : "";
  const attemptIds = Array.isArray(row.attemptIds)
    ? row.attemptIds.filter((id): id is number => typeof id === "number" && Number.isInteger(id) && id > 0)
    : [];
  if (!slug || !templateId || !attemptIds.length) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  const pack = await readAuthoredPack(slug);
  if (!pack) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const access = await analyzerAccess(auth.account, slug);
  if (!access.responses) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (!templateAllowedForPack(pack, templateId)) {
    return NextResponse.json({ error: "bad_template" }, { status: 400 });
  }

  const items = [];
  const errors: { attemptId: number; error: string }[] = [];
  const seen = new Set<number>();
  for (const attemptId of attemptIds.slice(0, 50)) {
    if (seen.has(attemptId)) continue;
    seen.add(attemptId);
    const attempt = await readWorkspaceAttempt(slug, attemptId);
    if (!attempt || attempt.status !== "submitted") {
      errors.push({ attemptId, error: "not_submitted" });
      continue;
    }
    try {
      items.push(
        await convertAttemptDocument({
          pack,
          attemptId,
          templateId,
          row: attempt,
          converterAccountId: auth.account.id,
        }),
      );
    } catch (error) {
      const code = error instanceof Error ? error.message : "convert_failed";
      errors.push({ attemptId, error: code });
    }
  }
  return NextResponse.json({ items, errors });
}
