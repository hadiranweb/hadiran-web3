import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/guard";
import { promoteSemanticRecord } from "@/lib/knowledge/promote";

export const dynamic = "force-dynamic";

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: Ctx) {
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const visibility = body.visibility === "private" ? "private" : "public";
  try {
    const result = await promoteSemanticRecord({
      recordId: id,
      accountId: auth.account.id,
      visibility,
      rationaleFa: typeof body.rationaleFa === "string" ? body.rationaleFa : undefined,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "promote_failed";
    const status = message === "not_found" ? 404 : message === "forbidden" ? 403 : 500;
    console.error("[hadiran] promote", error);
    return NextResponse.json({ error: message }, { status });
  }
}
