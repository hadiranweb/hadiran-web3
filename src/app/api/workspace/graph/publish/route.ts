import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/guard";
import { publishGraphDraft } from "@/lib/analyzers/graph/editor-service";
import type { SsotDomainCode } from "@/lib/analyzers/graph/types";

export const dynamic = "force-dynamic";

/**
 * Freeze the draft into an immutable revision and rewrite the compiled projection.
 * This is the only way an edit becomes visible to the next respondent.
 */
export async function POST(request: Request) {
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  let body: { domainCode?: unknown; noteFa?: unknown };
  try {
    body = (await request.json()) as { domainCode?: unknown; noteFa?: unknown };
  } catch {
    body = {};
  }
  const domainCode: SsotDomainCode =
    body.domainCode === "DOM.MINDSET_GATE" ? "DOM.MINDSET_GATE" : "DOM.CASIO_SS";
  const noteFa = typeof body.noteFa === "string" ? body.noteFa.replace(/\s+/g, " ").trim().slice(0, 500) : null;

  try {
    const result = await publishGraphDraft({
      domainCode,
      noteFa: noteFa ?? undefined,
      actorId: auth.account.id,
      actorRole: auth.account.role,
    });
    if (!result.ok) {
      return NextResponse.json(
        { error: "integrity_failed", issues: result.issues },
        { status: 409 },
      );
    }
    return NextResponse.json({ ok: true, revision: result.revision, hash: result.hash, counts: result.counts });
  } catch (error) {
    return NextResponse.json({ error: "publish_failed", detail: String(error) }, { status: 500 });
  }
}
