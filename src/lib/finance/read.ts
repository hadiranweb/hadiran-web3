import "server-only";
import { sql } from "drizzle-orm";
import { db, hasDatabaseUrl } from "@/db";
import type { SessionAccount } from "@/lib/auth/session";
import { financeHref, type FinanceMode, type FinanceQuery, type FinanceRow, type FinanceSnapshot } from "./types";

function asRows<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === "object" && "rows" in value && Array.isArray((value as { rows: unknown }).rows)) {
    return (value as { rows: T[] }).rows;
  }
  return [];
}

export function emptyFinanceSnapshot(
  query: FinanceQuery,
  mode: FinanceMode,
  source: Exclude<FinanceSnapshot["source"], "live"> = "unavailable",
): FinanceSnapshot {
  return {
    source,
    asOf: null,
    mode,
    query,
    timeZone: "Asia/Tehran",
    total: null,
    pageSize: 20,
    rows: [],
    stateCounts: null,
    totals: [],
    undatedSettled: null,
  };
}

export async function loadFinance(
  account: Pick<SessionAccount, "id" | "role">,
  query: FinanceQuery,
  mode: FinanceMode,
): Promise<FinanceSnapshot> {
  if (mode !== "personal" && account.role !== "owner") throw new Error("forbidden");
  if (mode === "report" && (query.basis !== "settled" || query.state !== "settled")) {
    throw new Error("invalid_report_scope");
  }

  const empty = emptyFinanceSnapshot(query, mode);
  if (!account.id || !hasDatabaseUrl()) return empty;

  try {
    return await db.transaction(
      async (tx) => {
        const table = sql`shop_orders o join shop_listings l on l.id = o.listing_id join accounts a on a.id = o.buyer_id`;
        const scope = mode === "personal" ? sql`o.buyer_id = ${account.id}` : sql`true`;
        const base = sql`${scope}
          and (${query.currency === ""} or o.currency = ${query.currency})
          and (${query.product === ""} or l.id = ${query.product} or l.slug = ${query.product})
          and (${query.q === ""} or position(lower(${query.q}) in lower(concat_ws(' ', o.id, l.title_fa))) > 0)`;
        const date = query.basis === "settled" ? sql`o.settled_at` : sql`o.created_at`;
        const window = sql`${base}
          and (${query.start}::timestamptz is null or ${date} >= ${query.start}::timestamptz)
          and (${query.end}::timestamptz is null or ${date} < ${query.end}::timestamptz)`;
        const filtered = sql`${window} and (${query.state === "all"} or o.state = ${query.state})`;
        const path =
          mode === "personal" ? "/account/purchases" : mode === "report" ? "/workspace/finance" : "/workspace/shop/orders";

        const counts = asRows<{ state: string; n: number }>(
          await tx.execute(sql`select o.state, count(*)::int n from ${table} where ${window} group by o.state`),
        );
        const totalRows = asRows<{ n: number }>(
          await tx.execute(sql`select count(*)::int n from ${table} where ${filtered}`),
        );
        const money = asRows<{ currency: string; amount: string; discount: string; count: number }>(
          await tx.execute(sql`
            select o.currency,
              sum(o.amount)::text amount,
              sum(o.discount_amount)::text discount,
              count(*)::int count
            from ${table}
            where ${filtered}
            group by o.currency
            order by o.currency
          `),
        );
        const buyerName =
          mode === "personal"
            ? sql`''`
            : sql`coalesce(nullif(trim(concat_ws(' ', a.given_name, a.family_name)), ''), nullif(a.display_name, ''), 'بدون نام')`;
        const rows = asRows<
          Omit<FinanceRow, "createdAt" | "settledAt"> & { createdAt: Date | string | null; settledAt: Date | string | null }
        >(
          await tx.execute(sql`
            select o.id,
              l.title_fa title,
              l.slug product,
              ${buyerName} buyer,
              o.state,
              o.amount::text amount,
              o.currency,
              o.discount_amount::text discount,
              o.original_amount::text original,
              o.created_at as "createdAt",
              o.settled_at as "settledAt",
              exists(
                select 1 from shop_entitlements e
                where e.account_id = o.buyer_id and e.listing_id = o.listing_id
              ) entitled
            from ${table}
            where ${filtered}
            order by ${date} desc nulls last, o.id desc
            limit ${empty.pageSize}
            offset ${(query.page - 1) * empty.pageSize}
          `),
        );
        const undated = asRows<{ n: number }>(
          await tx.execute(
            sql`select count(*)::int n from ${table} where ${base} and o.state = 'settled' and o.settled_at is null`,
          ),
        );
        const time = asRows<{ time: Date | string }>(
          await tx.execute(sql`select transaction_timestamp() as time`),
        );

        return {
          ...empty,
          source: "live",
          asOf: time[0]?.time ? new Date(time[0].time).toISOString() : new Date().toISOString(),
          total: totalRows[0]?.n ?? 0,
          stateCounts: Object.fromEntries(counts.map((row) => [row.state, row.n])),
          undatedSettled: undated[0]?.n ?? 0,
          totals: money.map((row) => ({
            ...row,
            href: financeHref(path, query, { page: 1, currency: row.currency }),
          })),
          rows: rows.map((row) => ({
            ...row,
            entitled: Boolean(row.entitled),
            original: row.original ?? null,
            createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : null,
            settledAt: row.settledAt ? new Date(row.settledAt).toISOString() : null,
          })),
        };
      },
      { isolationLevel: "repeatable read", accessMode: "read only" },
    );
  } catch (error) {
    console.error("[hadiran] finance read", error instanceof Error ? error.name : "unknown");
    return { ...empty, source: "error" };
  }
}
