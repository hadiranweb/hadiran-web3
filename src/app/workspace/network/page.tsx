import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePageOwner } from "@/lib/auth/guard";
import { loadNetworkSnapshot } from "@/lib/workspace/network";
import { parseNetworkQuery } from "@/lib/workspace/network-types";
import { ReferralNetwork } from "@/components/workspace/ReferralNetwork";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"درخت معرف",robots:{index:false,follow:false}};
export default async function NetworkPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
  const account=await requirePageOwner("/workspace/network");
  const query=parseNetworkQuery(await searchParams);
  if(query.invalidRoot)notFound();
  const snapshot=await loadNetworkSnapshot(account,query);
  if(snapshot.source==="not_found")notFound();
  return <ReferralNetwork key={`${query.root}:${query.q}:${query.role}:${query.page}:${query.depth}`} snapshot={snapshot}/>;
}
