import type { Metadata } from "next";
import { requirePageOwner } from "@/lib/auth/guard";
import { loadNetworkSnapshot } from "@/lib/workspace/network";
import { parseNetworkQuery } from "@/lib/workspace/network-types";
import { ReferralNetwork } from "@/components/workspace/ReferralNetwork";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "درخت معرف",
  robots: { index: false, follow: false },
};

export default async function NetworkPage({
  searchParams,
}: {
  searchParams: Promise<{ root?: string; q?: string; role?: string; page?: string; depth?: string }>;
}) {
  const account = await requirePageOwner("/workspace/network");
  const params = await searchParams;
  const snapshot = await loadNetworkSnapshot(account, parseNetworkQuery(params));
  return <ReferralNetwork snapshot={snapshot} />;
}
