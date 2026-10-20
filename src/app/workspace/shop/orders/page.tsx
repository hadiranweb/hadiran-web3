import type { Metadata } from "next";
import { requirePageOwner } from "@/lib/auth/guard";
import { FinanceDesk } from "@/components/workspace/FinanceDesk";
import { flatSearchParams } from "@/lib/finance/params";
import { loadFinance } from "@/lib/finance/read";
import { parseFinanceQuery } from "@/lib/finance/types";

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
  const raw = flatSearchParams(await searchParams);
  let query;
  try {
    query = parseFinanceQuery(raw, "orders");
  } catch {
    query = parseFinanceQuery({ period: "month" }, "orders");
  }
  const snapshot = await loadFinance(account, query, "orders");
  return <FinanceDesk snapshot={snapshot} />;
}
