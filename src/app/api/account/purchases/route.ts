import { NextResponse } from "next/server";
import { requireAccount } from "@/lib/auth/guard";
import { loadFinance } from "@/lib/finance/read";
import { parseFinanceQuery } from "@/lib/finance/types";
export const dynamic = "force-dynamic";
export async function GET(request:Request) {
  const auth = await requireAccount();
  if (auth.error) return auth.error;
  const headers = {"Cache-Control":"private, no-store",Vary:"Cookie"};
  let query;
  try { query = parseFinanceQuery(Object.fromEntries(new URL(request.url).searchParams),"personal"); }
  catch { return NextResponse.json({error:"invalid_finance_filter"},{status:400,headers}); }
  const data = await loadFinance(auth.account,query,"personal");
  return NextResponse.json(data,{status:data.source === "live" ? 200 : 503,headers});
}
