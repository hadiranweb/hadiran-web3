import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import type { SessionAccount } from "@/lib/auth/session";
import { RESERVED_SLUGS } from "@/lib/analyzers/sanitize";
import type { DeskFilter, DeskItem, DeskSnapshot } from "./role-home-types";

export async function loadAnalyzerSnapshot(account: Pick<SessionAccount, "id" | "role">, filter: DeskFilter = "all", page = 1): Promise<DeskSnapshot> {
  const empty: DeskSnapshot = { source: account.id === 0 ? "preview" : "unavailable", asOf: null, counts: { all: null, drafts: null, responses: null, mine: null }, items: [], filter, page, pageSize: 20 };
  if (account.id === 0 || !process.env.DATABASE_URL) return empty;
  if (!Number.isSafeInteger(account.id) || account.id < 1) throw new Error("invalid_account");
  const reserved = sql.join([...RESERVED_SLUGS].map(slug => sql`${slug}`), sql`, `);
  const accessible = sql`with accessible as (
    select p.slug, p.pack->>'nameFa' as title, p.status, p.updated_at as "updatedAt", coalesce(p.created_by=${account.id},false) as mine,
      (${account.role === "owner"} or p.created_by=${account.id} or coalesce(g.can_edit,false)) as edit,
      (${account.role === "owner"} or p.created_by=${account.id} or coalesce(g.can_read_responses,false)) as responses,
      (${account.role === "owner"} or coalesce(p.created_by=${account.id},false)) as grant
    from analyzer_packs p left join analyzer_grants g on g.slug=p.slug and g.account_id=${account.id}
    where (${account.role === "owner"} or p.created_by=${account.id} or g.account_id is not null) and p.slug not in (${reserved}) and p.pack->>'slug'=p.slug
  )`;
  const condition = filter === "drafts" ? sql`status='draft' and edit` : filter === "responses" ? sql`responses` : filter === "mine" ? sql`mine` : sql`true`;
  try {
    return await db.transaction(async (tx) => {
      const totals = await tx.execute<Record<DeskFilter, number>>(sql`${accessible} select count(*)::int as all, count(*) filter (where status='draft' and edit)::int as drafts, count(*) filter (where responses)::int as responses, count(*) filter (where mine)::int as mine from accessible`);
      const rows = await tx.execute<Omit<DeskItem, "updatedAt"> & { updatedAt: Date }>(sql`${accessible} select * from accessible where ${condition} order by "updatedAt" desc, slug asc limit 20 offset ${(page - 1) * 20}`);
      const time = await tx.execute<{ asOf: Date }>(sql`select transaction_timestamp() as "asOf"`);
      return { ...empty, source: "live", asOf: new Date(time.rows[0].asOf).toISOString(), counts: totals.rows[0], items: rows.rows.map(row => ({ ...row, title: row.title || row.slug, edit: Boolean(row.edit), responses: Boolean(row.responses), updatedAt: new Date(row.updatedAt).toISOString() })) };
    }, { isolationLevel: "repeatable read", accessMode: "read only" });
  } catch (error) {
    console.error("[hadiran] analyzer desk unavailable", error instanceof Error ? error.name : "unknown");
    return { ...empty, source: "error" };
  }
}
