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
  if (auth.error) { auth.error.headers.set("Cache-Control","private, no-store"); return auth.error; }
  if(auth.account.id===0 || !process.env.DATABASE_URL)return privateJson({error:"unavailable"},{status:503});
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug")?.trim() ?? "";
  if (slug) {
    const access = await analyzerAccess(auth.account, slug);
    if (!access.responses) return privateJson({ error: "forbidden" }, { status: 403 });
    const items = await listConvertedDocuments([slug]);
    return privateJson({ items });
  }
  const packs = (await listAccessiblePacks(auth.account)).filter((row) => row.access.responses);
  const items = await listConvertedDocuments(packs.map((row) => row.pack.slug));
  return privateJson({ items });
}

export async function POST(request: Request) {
  const auth = await requireAnalyzerDesk();
  if (auth.error) { auth.error.headers.set("Cache-Control","private, no-store"); return auth.error; }
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
  const row = body as Record<string, unknown>;
  const slug = typeof row.slug === "string" ? row.slug.trim() : "";
  const templateId = typeof row.templateId === "string" ? row.templateId.trim() : "";
  const attemptIds = Array.isArray(row.attemptIds)
    ? row.attemptIds.filter((id): id is number => typeof id === "number" && Number.isInteger(id) && id > 0)
    : [];
  if (Array.isArray(row.attemptIds) && row.attemptIds.length>50)return privateJson({error:"batch_limit"},{status:400});
  if (!slug || !templateId || !attemptIds.length) {
    return privateJson({ error: "missing_fields" }, { status: 400 });
  }
  const pack = await readAuthoredPack(slug);
  if (!pack) return privateJson({ error: "not_found" }, { status: 404 });
  const access = await analyzerAccess(auth.account, slug);
  if (!access.responses) return privateJson({ error: "forbidden" }, { status: 403 });
  if (!templateAllowedForPack(pack, templateId)) {
    return privateJson({ error: "bad_template" }, { status: 400 });
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
          actorId: auth.account.id,
          pack,
          attemptId,
          templateId,
          row: attempt,
        }),
      );
    } catch (error) {
      const code = error instanceof Error && ["bad_template","not_submitted","missing_account"].includes(error.message) ? error.message : "convert_failed";
      errors.push({ attemptId, error: code });
    }
  }
  return privateJson({ items, errors });
}

function privateJson(body: unknown, init?: ResponseInit) {
  const response = NextResponse.json(body,init);
  response.headers.set("Cache-Control","private, no-store");
  return response;
}
