import type { Metadata } from "next";
import { requirePageAccount } from "@/lib/auth/guard";
import { FinanceDesk } from "@/components/workspace/FinanceDesk";
import { flatSearchParams } from "@/lib/finance/params";
import { loadFinance } from "@/lib/finance/read";
import { parseFinanceQuery } from "@/lib/finance/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "خریدهای من",
  robots: { index: false, follow: false },
};

export default async function PurchasesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const account = await requirePageAccount("/account/purchases");
  const raw = flatSearchParams(await searchParams);
  let query;
  try {
    query = parseFinanceQuery(raw, "personal");
  } catch {
    query = parseFinanceQuery({ period: "all" }, "personal");
  }
  const snapshot = await loadFinance(account, query, "personal");
  return <FinanceDesk snapshot={snapshot} />;
}
