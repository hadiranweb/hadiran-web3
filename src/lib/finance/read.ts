import "server-only";
import { and, count, desc, eq, gte, isNull, lt, or, sql, sum, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { accounts, shopEntitlements, shopListings, shopOrders } from "@/db/schema";
import type { SessionAccount } from "@/lib/auth/session";
import { financeHref, type FinanceMode, type FinanceQuery, type FinanceSnapshot } from "./types";

export async function loadFinance(
  account: Pick<SessionAccount, "id" | "role">,
  query: FinanceQuery,
  mode: FinanceMode,
): Promise<FinanceSnapshot> {
  if (mode !== "personal" && account.role !== "owner") throw new Error("forbidden");
  if (mode === "report" && (query.basis !== "settled" || query.state !== "settled")) throw new Error("invalid_report_scope");

  const empty: FinanceSnapshot = {
    source: "unavailable",
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

  try {
    const filters: SQL[] = [];
    if (mode === "personal") filters.push(eq(shopOrders.buyerId, account.id));
    if (query.currency) filters.push(eq(shopOrders.currency, query.currency));
    if (query.product) {
      const productMatch = or(eq(shopListings.id, query.product), eq(shopListings.slug, query.product));
      if (productMatch) filters.push(productMatch);
    }
    if (query.q) {
      const needle = query.q.toLowerCase();
      filters.push(
        sql`position(${needle} in lower(concat_ws(' ', ${shopOrders.id}, ${shopListings.titleFa}))) > 0`,
      );
    }
    const dateCol = query.basis === "settled" ? shopOrders.settledAt : shopOrders.createdAt;
    if (query.start) filters.push(gte(dateCol, new Date(query.start)));
    if (query.end) filters.push(lt(dateCol, new Date(query.end)));
    const windowWhere = filters.length ? and(...filters) : undefined;
    const filteredParts = [...filters];
    if (query.state !== "all") filteredParts.push(eq(shopOrders.state, query.state));
    const filtered = filteredParts.length ? and(...filteredParts) : undefined;

    const stateRows = await db
      .select({ state: shopOrders.state, n: count() })
      .from(shopOrders)
      .innerJoin(shopListings, eq(shopOrders.listingId, shopListings.id))
      .where(windowWhere)
      .groupBy(shopOrders.state);

    const [totalRow] = await db
      .select({ n: count() })
      .from(shopOrders)
      .innerJoin(shopListings, eq(shopOrders.listingId, shopListings.id))
      .where(filtered);

    const money = await db
      .select({
        currency: shopOrders.currency,
        amount: sum(shopOrders.amount),
        discount: sum(shopOrders.discountAmount),
        n: count(),
      })
      .from(shopOrders)
      .innerJoin(shopListings, eq(shopOrders.listingId, shopListings.id))
      .where(filtered)
      .groupBy(shopOrders.currency);

    const path = mode === "personal" ? "/account/purchases" : mode === "report" ? "/workspace/finance" : "/workspace/shop/orders";

    const rows = await db
      .select({
        id: shopOrders.id,
        title: shopListings.titleFa,
        product: shopListings.slug,
        buyerName: accounts.displayName,
        givenName: accounts.givenName,
        familyName: accounts.familyName,
        state: shopOrders.state,
        amount: shopOrders.amount,
        currency: shopOrders.currency,
        discount: shopOrders.discountAmount,
        original: shopOrders.originalAmount,
        createdAt: shopOrders.createdAt,
        settledAt: shopOrders.settledAt,
        buyerId: shopOrders.buyerId,
        listingId: shopOrders.listingId,
      })
      .from(shopOrders)
      .innerJoin(shopListings, eq(shopOrders.listingId, shopListings.id))
      .innerJoin(accounts, eq(shopOrders.buyerId, accounts.id))
      .where(filtered)
      .orderBy(desc(dateCol), desc(shopOrders.id))
      .limit(empty.pageSize)
      .offset((query.page - 1) * empty.pageSize);

    const entitlements = await db
      .select({ accountId: shopEntitlements.accountId, listingId: shopEntitlements.listingId })
      .from(shopEntitlements);

    const entitled = new Set(entitlements.map((row) => `${row.accountId}:${row.listingId}`));

    const [undated] = await db
      .select({ n: count() })
      .from(shopOrders)
      .innerJoin(shopListings, eq(shopOrders.listingId, shopListings.id))
      .where(and(...filters, eq(shopOrders.state, "settled"), isNull(shopOrders.settledAt)));

    return {
      ...empty,
      source: "live",
      asOf: new Date().toISOString(),
      total: Number(totalRow?.n ?? 0),
      stateCounts: Object.fromEntries(stateRows.map((row) => [row.state, Number(row.n)])),
      undatedSettled: Number(undated?.n ?? 0),
      totals: money.map((row) => ({
        currency: row.currency,
        amount: String(row.amount ?? "0"),
        discount: String(row.discount ?? "0"),
        count: Number(row.n),
        href: financeHref(path, query, { page: 1, currency: row.currency }),
      })),
      rows: rows.map((row) => {
        const buyer =
          mode === "personal"
            ? ""
            : [row.givenName, row.familyName].filter(Boolean).join(" ").trim() || row.buyerName || "بدون نام";
        return {
          id: row.id,
          title: row.title,
          product: row.product,
          buyer,
          state: row.state,
          amount: String(row.amount),
          currency: row.currency,
          discount: String(row.discount ?? 0),
          original: row.original == null ? null : String(row.original),
          createdAt: row.createdAt?.toISOString() ?? null,
          settledAt: row.settledAt?.toISOString() ?? null,
          entitled: entitled.has(`${row.buyerId}:${row.listingId}`),
        };
      }),
    };
  } catch (error) {
    console.error("[hadiran] finance read", error instanceof Error ? error.name : "unknown");
    return { ...empty, source: "error" };
  }
}
