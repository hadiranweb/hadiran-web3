import type { Metadata } from "next";
import { requirePageOwner } from "@/lib/auth/guard";
import { FinancialLaboratory } from "@/components/finance/FinancialLaboratory";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "آزمایشگاه معماری مالی", robots: { index: false, follow: false } };
export default async function FinanceLabPage() {
  await requirePageOwner("/workspace/finance/lab");
  return <FinancialLaboratory />;
}
