import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/guard";
import { loadOperationalSnapshot } from "@/lib/workspace/operations";
import { parseActionKind, parseActionPage } from "@/lib/workspace/operations-types";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  const params = new URL(request.url).searchParams;
  const data = await loadOperationalSnapshot(auth.account, parseActionKind(params.get("kind")), parseActionPage(params.get("page")));
  return NextResponse.json(data, { status: data.source === "live" ? 200 : 503, headers: { "Cache-Control": "private, no-store" } });
}
