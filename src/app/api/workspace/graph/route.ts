import { NextResponse } from "next/server";
import { requireOwner, requireStaff } from "@/lib/auth/guard";
import { loadGraphForEditor, saveGraphDraft } from "@/lib/analyzers/graph/editor-service";
import type { GraphManifest } from "@/lib/analyzers/graph/types";

export const dynamic = "force-dynamic";

/** The draft graph, its integrity report and the published revision it will become. */
export async function GET(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;
  const url = new URL(request.url);
  const domain = url.searchParams.get("domain") === "DOM.MINDSET_GATE" ? "DOM.MINDSET_GATE" : "DOM.CASIO_SS";
  try {
    const view = await loadGraphForEditor(domain);
    return NextResponse.json({
      domain,
      counts: view.counts,
      draftHash: view.draftHash,
      seedHash: view.seedHash,
      inSyncWithSeed: view.draftHash === view.seedHash,
      drift: view.drift,
      revision: view.revision,
      issues: view.issues,
      blocking: view.blocking,
      audit: view.audit,
      manifest: view.manifest,
    });
  } catch (error) {
    return NextResponse.json({ error: "database_unavailable", detail: String(error) }, { status: 503 });
  }
}

/** Save the working copy. Nothing here reaches a respondent until a revision is published. */
export async function PUT(request: Request) {
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  let body: { manifest?: GraphManifest };
  try {
    body = (await request.json()) as { manifest?: GraphManifest };
  } catch {
    return NextResponse.json({ error: "بدنهٔ نامعتبر است." }, { status: 400 });
  }
  if (!body.manifest || !Array.isArray(body.manifest.items) || !Array.isArray(body.manifest.keywords)) {
    return NextResponse.json({ error: "مانیفست گراف کامل نیست." }, { status: 400 });
  }
  try {
    const result = await saveGraphDraft(body.manifest, auth.account);
    if (!result.ok) {
      return NextResponse.json({ error: result.error, issues: result.issues }, { status: 409 });
    }
    return NextResponse.json({ ok: true, counts: result.counts, hash: result.hash });
  } catch (error) {
    return NextResponse.json({ error: "save_failed", detail: String(error) }, { status: 500 });
  }
}
