import { NextResponse } from "next/server";
import { requireAccount } from "@/lib/auth/guard";
import { loadPersonalSnapshot } from "@/lib/account/overview";
import { personalKind } from "@/lib/workspace/role-home-types";
import { parseActionPage } from "@/lib/workspace/operations-types";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const auth = await requireAccount();
  if (auth.error) return auth.error;
  const query = new URL(request.url).searchParams;
  const snapshot = await loadPersonalSnapshot(auth.account, personalKind(query.get("kind")), parseActionPage(query.get("page")));
  return NextResponse.json(snapshot, { status: snapshot.source === "live" ? 200 : 503, headers: { "Cache-Control": "private, no-store", Vary: "Cookie" } });
}
