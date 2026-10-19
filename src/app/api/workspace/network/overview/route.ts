import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/guard";
import { loadNetworkSnapshot } from "@/lib/workspace/network";
import { parseNetworkQuery } from "@/lib/workspace/network-types";
export const dynamic="force-dynamic";
export async function GET(request:Request) {
  const auth=await requireOwner();if(auth.error)return auth.error;
  const params=new URL(request.url).searchParams;
  const query=parseNetworkQuery(Object.fromEntries(params));
  if(query.invalidRoot)return NextResponse.json({error:"invalid_public_code"},{status:400,headers:{"Cache-Control":"private, no-store"}});
  const data=await loadNetworkSnapshot(auth.account,query);
  return NextResponse.json(data,{status:data.source==="live"?200:data.source==="not_found"?404:503,headers:{"Cache-Control":"private, no-store",Vary:"Cookie"}});
}
