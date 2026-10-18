import { NextResponse } from "next/server";
import { requireAnalyzerDesk } from "@/lib/auth/guard";
import { loadAnalyzerSnapshot } from "@/lib/workspace/analyzer-overview";
import { deskFilter } from "@/lib/workspace/role-home-types";
import { parseActionPage } from "@/lib/workspace/operations-types";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const auth = await requireAnalyzerDesk();
  if (auth.error) return auth.error;
  const query = new URL(request.url).searchParams;
  const snapshot = await loadAnalyzerSnapshot(auth.account, deskFilter(query.get("filter")), parseActionPage(query.get("page")));
  return NextResponse.json(snapshot, { status: snapshot.source === "live" ? 200 : 503, headers: { "Cache-Control": "private, no-store", Vary: "Cookie" } });
}
