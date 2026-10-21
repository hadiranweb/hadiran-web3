import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/guard";
import { flatSearchParams } from "@/lib/finance/params";
import { loadFinance } from "@/lib/finance/read";
import { parseFinanceQuery } from "@/lib/finance/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  const url = new URL(request.url);
  const raw = flatSearchParams(Object.fromEntries(url.searchParams.entries()));
  try {
    const query = parseFinanceQuery(raw, "report");
    const snapshot = await loadFinance(auth.account, query, "report");
    if (snapshot.source === "error") {
      return NextResponse.json({ error: "unavailable" }, { status: 503 });
    }
    return NextResponse.json(snapshot, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "invalid_filter" }, { status: 400 });
  }
}
