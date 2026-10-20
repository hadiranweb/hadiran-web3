import type { Metadata } from "next";
import { requirePageOwner } from "@/lib/auth/guard";
import { FinanceDesk } from "@/components/workspace/FinanceDesk";
import { financeQueryFromSearch, flatSearchParams } from "@/lib/finance/params";
import { emptyFinanceSnapshot, loadFinance } from "@/lib/finance/read";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "مرکز سفارش",
  robots: { index: false, follow: false },
};

export default async function ShopOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const account = await requirePageOwner("/workspace/shop/orders");
  const { query, error } = financeQueryFromSearch(flatSearchParams(await searchParams), "orders");
  const snapshot = error ? emptyFinanceSnapshot(query, "orders") : await loadFinance(account, query, "orders");
  return <FinanceDesk snapshot={snapshot} filterError={error} />;
}
