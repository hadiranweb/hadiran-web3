import Link from "@/components/workspace/WorkspaceLink";
import { requirePageAccount, requirePageOwner } from "@/lib/auth/guard";
import { parseFinanceQuery, type FinanceMode } from "@/lib/finance/types";
import { loadFinance } from "@/lib/finance/read";
import { FinanceCenter } from "./FinanceCenter";
export async function FinancePage({ searchParams, mode }: { searchParams: Promise<Record<string,string|undefined>>; mode: FinanceMode }) {
  const path = mode === "personal" ? "/account/purchases" : mode === "report" ? "/workspace/finance" : "/workspace/shop/orders";
  const account = mode === "personal" ? await requirePageAccount(path) : await requirePageOwner(path);
  let query;
  try { query = parseFinanceQuery(await searchParams,mode); }
  catch { return <main className="ws-page"><h1>فیلتر نامعتبر</h1><p role="alert">تاریخ شمسی و بازهٔ حداکثر یک‌ساله را بررسی کنید؛ بازهٔ دلخواه به هر دو تاریخ نیاز دارد.</p><Link href={path}>پاک‌کردن فیلترها</Link></main>; }
  return <FinanceCenter snapshot={await loadFinance(account,query,mode)}/>;
}
