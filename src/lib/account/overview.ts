import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import type { SessionAccount } from "@/lib/auth/session";
import type { PersonalKind, PersonalItem, PersonalSnapshot } from "@/lib/workspace/role-home-types";

// One current attempt per instrument, matching the runtime's open-before-submitted rule.
export async function loadPersonalSnapshot(account: Pick<SessionAccount, "id">, filter: PersonalKind | null = null, page = 1): Promise<PersonalSnapshot> {
  const empty: PersonalSnapshot = { source: account.id === 0 ? "preview" : "unavailable", asOf: null, counts: { orders: null, inProgress: null, reports: null }, items: [], filter, page, pageSize: 20 };
  if (account.id === 0 || !process.env.DATABASE_URL) return empty;
  if (!Number.isSafeInteger(account.id) || account.id < 1) throw new Error("invalid_account");
  const current = sql`with attempt_rows as (
    select id, 'casio-ss'::text as slug, status, updated_at, submitted_at from casio_attempts where account_id=${account.id} and status in ('in_progress','submitted')
    union all select id, slug, status, updated_at, submitted_at from analyzer_attempts where account_id=${account.id} and slug<>'casio-ss' and status in ('in_progress','submitted')
  ), current_attempts as (
    select distinct on (slug) id, slug, status, updated_at from attempt_rows order by slug, (status='in_progress') desc, submitted_at desc nulls last, id desc
  )`;
  try {
    return await db.transaction(async (tx) => {
      const orderCount = await tx.execute<{ n: number }>(sql`select count(*)::int as n from shop_orders where buyer_id=${account.id}`);
      const attemptsCount = await tx.execute<{ pending: number; reports: number }>(sql`${current} select count(*) filter (where status='in_progress')::int as pending, count(*) filter (where status='submitted')::int as reports from current_attempts`);
      const counts = { orders: orderCount.rows[0].n, inProgress: attemptsCount.rows[0].pending, reports: attemptsCount.rows[0].reports };
      const items: PersonalItem[] = [];
      const limit = filter ? 20 : 3, offset = filter ? (page - 1) * 20 : 0;
      if (!filter || filter === "orders") {
        const rows = await tx.execute<{ id: string; title: string; state: string; updated_at: Date | null; amount: number; currency: string }>(sql`select o.id, l.title_fa as title, o.state, o.updated_at, o.amount, o.currency from shop_orders o join shop_listings l on l.id=o.listing_id where o.buyer_id=${account.id} order by o.updated_at desc nulls last, o.id desc limit ${limit} offset ${offset}`);
        items.push(...rows.rows.map(row => ({ key: `order:${row.id}`, kind: "orders" as const, title: row.title, status: row.state, amount: row.amount, currency: row.currency, href: `/shop/orders/${encodeURIComponent(row.id)}`, updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null })));
      }
      for (const kind of ["inProgress", "reports"] as const) {
        if (filter && filter !== kind) continue;
        const status = kind === "inProgress" ? "in_progress" : "submitted";
        const rows = await tx.execute<{ id: number; slug: string; title: string | null; status: string; updated_at: Date | null; available: boolean | null }>(sql`${current}
          select a.*, p.pack->>'nameFa' as title, (a.slug='casio-ss' or p.status='open') as available from current_attempts a left join analyzer_packs p on p.slug=a.slug
          where a.status=${status} order by a.updated_at desc nulls last, a.slug desc limit ${limit} offset ${offset}`);
        items.push(...rows.rows.map(row => ({ key: `attempt:${row.slug}:${row.id}`, kind, title: row.title || (row.slug === "casio-ss" ? "عارضه‌یابی سازمانی" : row.slug), status: row.status, href: row.available ? `/analyzers/${encodeURIComponent(row.slug)}${kind === "reports" ? "/report" : ""}` : null, updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null })));
      }
      const time = await tx.execute<{ asOf: Date }>(sql`select transaction_timestamp() as "asOf"`);
      return { ...empty, source: "live", asOf: new Date(time.rows[0].asOf).toISOString(), counts, items };
    }, { isolationLevel: "repeatable read", accessMode: "read only" });
  } catch (error) {
    console.error("[hadiran] personal snapshot unavailable", error instanceof Error ? error.name : "unknown");
    return { ...empty, source: "error" };
  }
}
