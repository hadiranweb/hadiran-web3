import { and, count, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { analyzerPacks, bots, collaborations, projects, semanticRecords } from "@/db/schema";

export type ActionItem = {
  id: string;
  kind: "note" | "collab" | "draft" | "bot";
  titleFa: string;
  reason: string;
  href: string;
  at: Date | null;
};

export type ActionGroup = {
  items: ActionItem[];
  count: number | null;
};

export type ActionQueue = {
  notes: ActionGroup;
  collabs: ActionGroup;
  drafts: ActionGroup;
  bots: ActionGroup;
};

const emptyGroup: ActionGroup = { items: [], count: null };

async function loadNotes(ownerId: number): Promise<ActionGroup> {
  const where = and(eq(semanticRecords.ownerId, ownerId), eq(semanticRecords.status, "pending_review"));
  const [total, rows] = await Promise.all([
    db.select({ value: count() }).from(semanticRecords).where(where),
    db
      .select({
        id: semanticRecords.id,
        titleFa: semanticRecords.titleFa,
        updatedAt: semanticRecords.updatedAt,
      })
      .from(semanticRecords)
      .where(where)
      .orderBy(desc(semanticRecords.updatedAt))
      .limit(3),
  ]);
  return {
    count: Number(total[0]?.value ?? 0),
    items: rows.map((row) => ({
      id: row.id,
      kind: "note" as const,
      titleFa: row.titleFa,
      reason: "یادداشت در انتظار بازبینی",
      href: `/workspace/records/${row.id}`,
      at: row.updatedAt,
    })),
  };
}

async function loadCollabs(): Promise<ActionGroup> {
  const where = eq(collaborations.status, "submitted");
  const [total, rows] = await Promise.all([
    db.select({ value: count() }).from(collaborations).where(where),
    db
      .select({
        id: collaborations.id,
        fullName: collaborations.fullName,
        createdAt: collaborations.createdAt,
        projectSlug: projects.slug,
        projectName: projects.nameFa,
      })
      .from(collaborations)
      .innerJoin(projects, eq(collaborations.projectId, projects.id))
      .where(where)
      .orderBy(desc(collaborations.createdAt))
      .limit(3),
  ]);
  return {
    count: Number(total[0]?.value ?? 0),
    items: rows.map((row) => ({
      id: String(row.id),
      kind: "collab" as const,
      titleFa: row.fullName,
      reason: `همکاری در ${row.projectName}`,
      href: `/lab/${row.projectSlug}`,
      at: row.createdAt,
    })),
  };
}

async function loadDrafts(ownerId: number): Promise<ActionGroup> {
  const where = and(eq(analyzerPacks.createdBy, ownerId), eq(analyzerPacks.status, "draft"));
  const [total, rows] = await Promise.all([
    db.select({ value: count() }).from(analyzerPacks).where(where),
    db
      .select({
        slug: analyzerPacks.slug,
        pack: analyzerPacks.pack,
        updatedAt: analyzerPacks.updatedAt,
      })
      .from(analyzerPacks)
      .where(where)
      .orderBy(desc(analyzerPacks.updatedAt))
      .limit(3),
  ]);
  return {
    count: Number(total[0]?.value ?? 0),
    items: rows.map((row) => ({
      id: row.slug,
      kind: "draft" as const,
      titleFa: row.pack?.nameFa || row.slug,
      reason: "پیش‌نویس آزمون",
      href: `/workspace/analyzers/${row.slug}`,
      at: row.updatedAt,
    })),
  };
}

async function loadBrokenBots(ownerId: number): Promise<ActionGroup> {
  const rows = await db
    .select({
      id: bots.id,
      titleFa: bots.titleFa,
      lastError: bots.lastError,
      telegramLastError: bots.telegramLastError,
      updatedAt: bots.updatedAt,
    })
    .from(bots)
    .where(eq(bots.ownerId, ownerId))
    .orderBy(desc(bots.updatedAt));
  const broken = rows.filter((row) => Boolean(row.lastError?.trim() || row.telegramLastError?.trim()));
  return {
    count: broken.length,
    items: broken.slice(0, 3).map((row) => ({
      id: row.id,
      kind: "bot" as const,
      titleFa: row.titleFa,
      reason: "ربات خطا دارد",
      href: `/workspace/bots/${row.id}`,
      at: row.updatedAt,
    })),
  };
}

export async function loadActionQueue(ownerId: number): Promise<ActionQueue> {
  const [notes, collabs, drafts, brokenBots] = await Promise.all([
    loadNotes(ownerId).catch(() => emptyGroup),
    loadCollabs().catch(() => emptyGroup),
    loadDrafts(ownerId).catch(() => emptyGroup),
    loadBrokenBots(ownerId).catch(() => emptyGroup),
  ]);
  return { notes, collabs, drafts, bots: brokenBots };
}

export function queueHasItems(queue: ActionQueue) {
  return [queue.notes, queue.collabs, queue.drafts, queue.bots].some((group) => group.count !== 0);
}
