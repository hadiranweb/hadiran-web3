import type { Metadata } from "next";
import { requirePageOwner } from "@/lib/auth/guard";
import { listFinancePlans, FINANCE_CONFIG_WRITE_FLAG } from "@/lib/finance/plan-store";
import type { FinancePlanRevision } from "@/lib/finance/tariffs";
import { FinancePlanSettings } from "@/components/finance/FinancePlanSettings";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "تعرفه‌ها و قواعد پلن", robots: { index: false, follow: false } };
export default async function FinancePlansPage() {
  const account = await requirePageOwner("/workspace/finance/plans");
  let initialPlans: FinancePlanRevision[] = [], storageState: "ready" | "preview" | "unavailable" = account.id === 0 ? "preview" : "unavailable";
  if (account.id > 0) {
    try { initialPlans = await listFinancePlans(account.id); storageState = "ready"; }
    catch { /* Fail closed; never run automatic DDL or fabricate saved plans. */ }
  }
  return <FinancePlanSettings initialPlans={initialPlans} storageState={storageState} writable={storageState === "ready" && process.env[FINANCE_CONFIG_WRITE_FLAG] === "1"} />;
}
