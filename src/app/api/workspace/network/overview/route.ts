import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/guard";
import { loadNetworkSnapshot } from "@/lib/workspace/network";
import { parseNetworkQuery } from "@/lib/workspace/network-types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  const url = new URL(request.url);
  const snapshot = await loadNetworkSnapshot(
    auth.account,
    parseNetworkQuery({
      root: url.searchParams.get("root"),
      q: url.searchParams.get("q"),
      role: url.searchParams.get("role"),
      page: url.searchParams.get("page"),
      depth: url.searchParams.get("depth"),
    }),
  );
  return NextResponse.json(snapshot, { headers: { "Cache-Control": "no-store" } });
}
