import type { Metadata } from "next";
import { requirePageAccount } from "@/lib/auth/guard";
import { FinanceDesk } from "@/components/workspace/FinanceDesk";
import { financeQueryFromSearch, flatSearchParams } from "@/lib/finance/params";
import { emptyFinanceSnapshot, loadFinance } from "@/lib/finance/read";

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
  const { query, error } = financeQueryFromSearch(flatSearchParams(await searchParams), "personal");
  const snapshot = error ? emptyFinanceSnapshot(query, "personal") : await loadFinance(account, query, "personal");
  return <FinanceDesk snapshot={snapshot} filterError={error} />;
}
