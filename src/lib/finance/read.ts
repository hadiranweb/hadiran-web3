import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import type { SessionAccount } from "@/lib/auth/session";
import { financeHref, type FinanceMode, type FinanceQuery, type FinanceSnapshot, type FinanceRow } from "./types";

export async function loadFinance(account: Pick<SessionAccount,"id"|"role">, query: FinanceQuery, mode: FinanceMode): Promise<FinanceSnapshot> {
  if (mode !== "personal" && account.role !== "owner") throw new Error("forbidden");
  if (mode === "report" && (query.basis !== "settled" || query.state !== "settled")) throw new Error("invalid_report_scope");
  const empty: FinanceSnapshot = { source: account.id === 0 ? "preview" : "unavailable", asOf: null, mode, query,
    timeZone: "Asia/Tehran", total: null, pageSize: 20, rows: [], stateCounts: null, totals: [], undatedSettled: null };
  if (!account.id || !process.env.DATABASE_URL) return empty;
  try {
    return await db.transaction(async tx => {
      const table = sql`shop_orders o join shop_listings l on l.id=o.listing_id join accounts a on a.id=o.buyer_id`;
      const scope = mode === "personal" ? sql`o.buyer_id=${account.id}` : sql`true`;
      const base = sql`${scope} and (${query.currency === ""} or o.currency=${query.currency}) and (${query.product === ""} or l.id=${query.product} or l.slug=${query.product})
        and (${query.q === ""} or position(lower(${query.q}) in lower(concat_ws(' ',o.id,l.title_fa)))>0)`;
      const date = query.basis === "settled" ? sql`o.settled_at` : sql`o.created_at`;
      const window = sql`${base} and (${query.start}::timestamptz is null or ${date} >= ${query.start}::timestamptz)
        and (${query.end}::timestamptz is null or ${date} < ${query.end}::timestamptz)`;
      const filtered = sql`${window} and (${query.state === "all"} or o.state=${query.state})`;
      const counts = await tx.execute<{state:string;n:number}>(sql`select o.state,count(*)::int n from ${table} where ${window} group by o.state`);
      const number = await tx.execute<{n:number}>(sql`select count(*)::int n from ${table} where ${filtered}`);
      const money = await tx.execute<{currency:string;amount:string;discount:string;count:number}>(sql`select o.currency,
        sum(o.amount)::text amount,sum(o.discount_amount)::text discount,count(*)::int count from ${table}
        where ${filtered} group by o.currency order by o.currency`);
      const rows = await tx.execute<Omit<FinanceRow,"createdAt"|"settledAt"> & {createdAt:Date|null;settledAt:Date|null}>(sql`select o.id,l.title_fa title,l.slug product,
        ${mode === "personal" ? sql`''` : sql`coalesce(nullif(trim(concat_ws(' ',a.given_name,a.family_name)),''),nullif(a.display_name,''),'بدون نام')`} buyer,
        o.state,o.amount::text amount,o.currency,o.discount_amount::text discount,o.original_amount::text original,
        o.created_at as "createdAt",o.settled_at as "settledAt",exists(select 1 from shop_entitlements e where e.account_id=o.buyer_id and e.listing_id=o.listing_id) entitled
        from ${table} where ${filtered} order by ${date} desc nulls last,o.id desc limit ${empty.pageSize} offset ${(query.page-1)*empty.pageSize}`);
      const undated = await tx.execute<{n:number}>(sql`select count(*)::int n from ${table} where ${base} and o.state='settled' and o.settled_at is null`);
      const time = await tx.execute<{time:Date}>(sql`select transaction_timestamp() as time`);
      const path = mode === "personal" ? "/account/purchases" : mode === "report" ? "/workspace/finance" : "/workspace/shop/orders";
      return { ...empty, source: "live", asOf: new Date(time.rows[0].time).toISOString(), total: number.rows[0].n,
        stateCounts: Object.fromEntries(counts.rows.map(row => [row.state,row.n])), undatedSettled: undated.rows[0].n,
        totals: money.rows.map(row => ({...row,href:financeHref(path,query,{page:1,currency:row.currency})})),
        rows: rows.rows.map(row => ({...row,createdAt:row.createdAt ? new Date(row.createdAt).toISOString() : null,settledAt:row.settledAt ? new Date(row.settledAt).toISOString() : null})) };
    },{isolationLevel:"repeatable read",accessMode:"read only"});
  } catch(error) {
    console.error("[hadiran] finance read",error instanceof Error ? error.name : "unknown");
    return {...empty,source:"error"};
  }
}
