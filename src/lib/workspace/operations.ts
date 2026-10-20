import "server-only";
import { and, asc, count, desc, eq, isNotNull, ne } from "drizzle-orm";
import { db } from "@/db";
import { analyzerPacks, bots, collaborations, semanticRecords, shopListings, shopOrders } from "@/db/schema";
import type { SessionAccount } from "@/lib/auth/session";
import { actionKinds, type ActionKind, type OperationalItem, type OperationalSnapshot } from "./operations-types";

export async function loadOperationalSnapshot(
  account: Pick<SessionAccount, "id" | "role">,
  filter: ActionKind | null = null,
  page = 1,
): Promise<OperationalSnapshot> {
  const empty: OperationalSnapshot = {
    source: "unavailable",
    asOf: null,
    counts: { orders: null, notes: null, collaborations: null, analyzers: null, bots: null },
    actions: [],
    recent: [],
    filter,
    page,
    pageSize: 20,
  };
  if (account.role !== "owner") return empty;

  try {
    const pendingOrders = eq(shopOrders.state, "awaiting_confirmation");
    const reviewNotes = and(eq(semanticRecords.ownerId, account.id), eq(semanticRecords.status, "pending_review"));
    const newCollaborations = eq(collaborations.status, "submitted");
    const ownDrafts = and(eq(analyzerPacks.createdBy, account.id), eq(analyzerPacks.status, "draft"));
    const botErrors = and(eq(bots.ownerId, account.id), isNotNull(bots.lastError), ne(bots.lastError, ""));

    const [orderCount, noteCount, collaborationCount, analyzerCount, botCount] = await Promise.all([
      db.select({ value: count() }).from(shopOrders).where(pendingOrders),
      db.select({ value: count() }).from(semanticRecords).where(reviewNotes),
      db.select({ value: count() }).from(collaborations).where(newCollaborations),
      db.select({ value: count() }).from(analyzerPacks).where(ownDrafts),
      db.select({ value: count() }).from(bots).where(botErrors),
    ]);

    const counts = {
      orders: Number(orderCount[0]?.value ?? 0),
      notes: Number(noteCount[0]?.value ?? 0),
      collaborations: Number(collaborationCount[0]?.value ?? 0),
      analyzers: Number(analyzerCount[0]?.value ?? 0),
      bots: Number(botCount[0]?.value ?? 0),
    };

    const limit = filter ? 20 : 3;
    const offset = filter ? (page - 1) * 20 : 0;
    const actions: OperationalItem[] = [];

    if (!filter || filter === "orders") {
      const rows = await db
        .select({
          id: shopOrders.id,
          title: shopListings.titleFa,
          amount: shopOrders.amount,
          currency: shopOrders.currency,
          updatedAt: shopOrders.updatedAt,
        })
        .from(shopOrders)
        .innerJoin(shopListings, eq(shopOrders.listingId, shopListings.id))
        .where(pendingOrders)
        .orderBy(asc(shopOrders.updatedAt), asc(shopOrders.id))
        .limit(limit)
        .offset(offset);
      actions.push(
        ...rows.map((row) => ({
          key: `order:${row.id}`,
          kind: "orders" as const,
          title: row.title,
          href: "/workspace/shop/orders",
          amount: row.amount,
          currency: row.currency,
          updatedAt: row.updatedAt?.toISOString() ?? null,
        })),
      );
    }

    if (!filter || filter === "notes") {
      const rows = await db
        .select({ id: semanticRecords.id, title: semanticRecords.titleFa, updatedAt: semanticRecords.updatedAt })
        .from(semanticRecords)
        .where(reviewNotes)
        .orderBy(asc(semanticRecords.updatedAt), asc(semanticRecords.id))
        .limit(limit)
        .offset(offset);
      actions.push(
        ...rows.map((row) => ({
          key: `note:${row.id}`,
          kind: "notes" as const,
          title: row.title,
          href: `/workspace/records/${row.id}`,
          updatedAt: row.updatedAt?.toISOString() ?? null,
        })),
      );
    }

    if (!filter || filter === "collaborations") {
      const rows = await db
        .select({ id: collaborations.id, title: collaborations.fullName, updatedAt: collaborations.createdAt })
        .from(collaborations)
        .where(newCollaborations)
        .orderBy(asc(collaborations.createdAt), asc(collaborations.id))
        .limit(limit)
        .offset(offset);
      actions.push(
        ...rows.map((row) => ({
          key: `collaboration:${row.id}`,
          kind: "collaborations" as const,
          title: row.title,
          href: "/workspace/collaborations",
          updatedAt: row.updatedAt?.toISOString() ?? null,
        })),
      );
    }

    if (!filter || filter === "analyzers") {
      const rows = await db
        .select({ slug: analyzerPacks.slug, pack: analyzerPacks.pack, updatedAt: analyzerPacks.updatedAt })
        .from(analyzerPacks)
        .where(ownDrafts)
        .orderBy(asc(analyzerPacks.updatedAt), asc(analyzerPacks.slug))
        .limit(limit)
        .offset(offset);
      actions.push(
        ...rows.map((row) => ({
          key: `analyzer:${row.slug}`,
          kind: "analyzers" as const,
          title: row.pack?.nameFa || row.slug,
          href: `/workspace/analyzers/${row.slug}`,
          updatedAt: row.updatedAt.toISOString(),
        })),
      );
    }

    if (!filter || filter === "bots") {
      const rows = await db
        .select({ id: bots.id, title: bots.titleFa, updatedAt: bots.updatedAt })
        .from(bots)
        .where(botErrors)
        .orderBy(asc(bots.updatedAt), asc(bots.id))
        .limit(limit)
        .offset(offset);
      actions.push(
        ...rows.map((row) => ({
          key: `bot:${row.id}`,
          kind: "bots" as const,
          title: row.title,
          href: `/workspace/bots/${row.id}`,
          updatedAt: row.updatedAt.toISOString(),
        })),
      );
    }

    actions.sort((left, right) => actionKinds.indexOf(left.kind) - actionKinds.indexOf(right.kind));

    return {
      source: "live",
      asOf: new Date().toISOString(),
      counts,
      actions,
      recent: [],
      filter,
      page,
      pageSize: 20,
    };
  } catch (error) {
    console.error("[hadiran] operational snapshot unavailable", error);
    return { ...empty, source: "error" };
  }
}
