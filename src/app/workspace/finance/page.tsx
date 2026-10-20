import type { Metadata } from "next";
import { requirePageOwner } from "@/lib/auth/guard";
import { FinanceDesk } from "@/components/workspace/FinanceDesk";
import { flatSearchParams } from "@/lib/finance/params";
import { loadFinance } from "@/lib/finance/read";
import { parseFinanceQuery } from "@/lib/finance/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "گزارش مالی",
  robots: { index: false, follow: false },
};

export default async function FinancePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const account = await requirePageOwner("/workspace/finance");
  const raw = flatSearchParams(await searchParams);
  let query;
  try {
    query = parseFinanceQuery(raw, "report");
  } catch {
    query = parseFinanceQuery({ period: "month" }, "report");
  }
  const snapshot = await loadFinance(account, query, "report");
  return <FinanceDesk snapshot={snapshot} />;
}
