import type { Metadata } from "next";
import { requirePageOwner } from "@/lib/auth/guard";
import { FinanceDesk } from "@/components/workspace/FinanceDesk";
import { financeQueryFromSearch, flatSearchParams } from "@/lib/finance/params";
import { emptyFinanceSnapshot, loadFinance } from "@/lib/finance/read";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "گزارش تسویه",
  robots: { index: false, follow: false },
};

export default async function FinancePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const account = await requirePageOwner("/workspace/finance");
  const { query, error } = financeQueryFromSearch(flatSearchParams(await searchParams), "report");
  const snapshot = error ? emptyFinanceSnapshot(query, "report") : await loadFinance(account, query, "report");
  return <FinanceDesk snapshot={snapshot} filterError={error} />;
}
