import "server-only";
import { and, asc, count, desc, eq, isNotNull, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { analyzerPacks, bots, collaborations, semanticRecords, shopListings, shopOrders } from "@/db/schema";
import type { SessionAccount } from "@/lib/auth/session";
import { actionKinds, type ActionKind, type OperationalItem, type OperationalSnapshot } from "./operations-types";

export async function loadOperationalSnapshot(account: Pick<SessionAccount, "id" | "role">, filter: ActionKind | null = null, page = 1): Promise<OperationalSnapshot> {
  if (account.role !== "owner") throw new Error("forbidden");
  const empty: OperationalSnapshot = { source: account.id === 0 ? "preview" : "unavailable", asOf: null,
    counts: { orders: null, notes: null, collaborations: null, analyzers: null, bots: null },
    actions: [], recent: [], filter, page, pageSize: 20 };
  if (account.id === 0 || !process.env.DATABASE_URL) return empty;
  try {
    return await db.transaction(async (tx) => {
      const pendingOrders = eq(shopOrders.state, "awaiting_confirmation");
      const reviewNotes = and(eq(semanticRecords.ownerId, account.id), eq(semanticRecords.status, "pending_review"));
      const newCollaborations = eq(collaborations.status, "submitted");
      const ownDrafts = and(eq(analyzerPacks.createdBy, account.id), eq(analyzerPacks.status, "draft"));
      const botErrors = and(eq(bots.ownerId, account.id), isNotNull(bots.lastError), ne(bots.lastError, ""));
      const orderCount = await tx.select({ value: count() }).from(shopOrders).where(pendingOrders);
      const noteCount = await tx.select({ value: count() }).from(semanticRecords).where(reviewNotes);
      const collaborationCount = await tx.select({ value: count() }).from(collaborations).where(newCollaborations);
      const analyzerCount = await tx.select({ value: count() }).from(analyzerPacks).where(ownDrafts);
      const botCount = await tx.select({ value: count() }).from(bots).where(botErrors);
      const counts = { orders: orderCount[0].value, notes: noteCount[0].value, collaborations: collaborationCount[0].value, analyzers: analyzerCount[0].value, bots: botCount[0].value };
      const limit = filter ? 20 : 3, offset = filter ? (page - 1) * 20 : 0;
      const actions: OperationalItem[] = [];
      if (!filter || filter === "orders") {
        const rows = await tx.select({ id: shopOrders.id, title: shopListings.titleFa, amount: shopOrders.amount, currency: shopOrders.currency, updatedAt: shopOrders.updatedAt })
          .from(shopOrders).innerJoin(shopListings, eq(shopOrders.listingId, shopListings.id)).where(pendingOrders).orderBy(asc(shopOrders.updatedAt), asc(shopOrders.id)).limit(limit).offset(offset);
        actions.push(...rows.map((row) => ({ key: `order:${row.id}`, kind: "orders" as const, title: row.title, href: `/workspace/shop/orders/${encodeURIComponent(row.id)}`, amount: row.amount, currency: row.currency, updatedAt: row.updatedAt?.toISOString() ?? null })));
      }
      if (!filter || filter === "notes") {
        const rows = await tx.select({ id: semanticRecords.id, title: semanticRecords.titleFa, updatedAt: semanticRecords.updatedAt }).from(semanticRecords).where(reviewNotes).orderBy(asc(semanticRecords.updatedAt), asc(semanticRecords.id)).limit(limit).offset(offset);
        actions.push(...rows.map((row) => ({ key: `note:${row.id}`, kind: "notes" as const, title: row.title, href: `/workspace/records/${encodeURIComponent(row.id)}`, updatedAt: row.updatedAt?.toISOString() ?? null })));
      }
      if (!filter || filter === "collaborations") {
        const rows = await tx.select({ id: collaborations.id, title: collaborations.fullName, updatedAt: collaborations.createdAt }).from(collaborations).where(newCollaborations).orderBy(asc(collaborations.createdAt), asc(collaborations.id)).limit(limit).offset(offset);
        actions.push(...rows.map((row) => ({ key: `collaboration:${row.id}`, kind: "collaborations" as const, title: row.title, href: `/workspace/collaborations?record=${row.id}`, updatedAt: row.updatedAt?.toISOString() ?? null })));
      }
      if (!filter || filter === "analyzers") {
        const rows = await tx.select({ slug: analyzerPacks.slug, title: sql<string>`${analyzerPacks.pack}->>'nameFa'`, updatedAt: analyzerPacks.updatedAt }).from(analyzerPacks).where(ownDrafts).orderBy(asc(analyzerPacks.updatedAt), asc(analyzerPacks.slug)).limit(limit).offset(offset);
        actions.push(...rows.map((row) => ({ key: `analyzer:${row.slug}`, kind: "analyzers" as const, title: row.title || row.slug, href: `/workspace/analyzers/${encodeURIComponent(row.slug)}`, updatedAt: row.updatedAt.toISOString() })));
      }
      if (!filter || filter === "bots") {
        const rows = await tx.select({ id: bots.id, title: bots.titleFa, updatedAt: bots.updatedAt }).from(bots).where(botErrors).orderBy(asc(bots.updatedAt), asc(bots.id)).limit(limit).offset(offset);
        actions.push(...rows.map((row) => ({ key: `bot:${row.id}`, kind: "bots" as const, title: row.title, href: `/workspace/bots/${encodeURIComponent(row.id)}`, updatedAt: row.updatedAt.toISOString() })));
      }
      const recentNotes = await tx.select({ id: semanticRecords.id, title: semanticRecords.titleFa, updatedAt: semanticRecords.updatedAt }).from(semanticRecords).where(eq(semanticRecords.ownerId, account.id)).orderBy(desc(semanticRecords.updatedAt), desc(semanticRecords.id)).limit(4);
      const recent: OperationalItem[] = recentNotes.map((row) => ({ key: `note:${row.id}`, kind: "notes", title: row.title, href: `/workspace/records/${encodeURIComponent(row.id)}`, updatedAt: row.updatedAt?.toISOString() ?? null }));
      const snapshotTime = await tx.execute(sql`select transaction_timestamp() as "asOf"`);
      const asOf = new Date(snapshotTime.rows[0].asOf as string).toISOString();
      actions.sort((left, right) => actionKinds.indexOf(left.kind) - actionKinds.indexOf(right.kind));
      return { ...empty, source: "live", asOf, counts, actions, recent };
    }, { isolationLevel: "repeatable read", accessMode: "read only" });
  } catch (error) {
    console.error("[hadiran] operational snapshot unavailable", error instanceof Error ? error.name : "unknown");
    return { ...empty, source: "error" };
  }
}
