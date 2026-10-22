/** روبان شخصی. فقط نوشته‌های عمومی/منتشرشده در قفسه می‌آیند. */

import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { knowledge, knowledgeBookmarks } from "@/db/schema";
import { publicKnowledgeFilter, publicKnowledgeJoin } from "@/lib/public/policy";
import { memoryItems } from "@/db/schema";

export type ShelfItem = {
  slug: string;
  titleFa: string;
  lineFa: string | null;
  readingMinutes: number | null;
  savedAt: string;
};

export async function isBookmarked(accountId: number, knowledgeId: number): Promise<boolean> {
  const rows = await db
    .select({ knowledgeId: knowledgeBookmarks.knowledgeId })
    .from(knowledgeBookmarks)
    .where(and(eq(knowledgeBookmarks.accountId, accountId), eq(knowledgeBookmarks.knowledgeId, knowledgeId)))
    .limit(1);
  return rows.length > 0;
}

export async function bookmarkBySlug(accountId: number, slug: string, saved: boolean): Promise<{ ok: boolean }> {
  const [row] = await db
    .select({ id: knowledge.id })
    .from(knowledge)
    .innerJoin(memoryItems, publicKnowledgeJoin)
    .where(and(eq(knowledge.slug, slug), publicKnowledgeFilter))
    .limit(1);
  if (!row) return { ok: false };
  if (saved) {
    await db
      .insert(knowledgeBookmarks)
      .values({ accountId, knowledgeId: row.id })
      .onConflictDoNothing();
  } else {
    await db
      .delete(knowledgeBookmarks)
      .where(and(eq(knowledgeBookmarks.accountId, accountId), eq(knowledgeBookmarks.knowledgeId, row.id)));
  }
  return { ok: true };
}

export async function listShelf(accountId: number): Promise<ShelfItem[]> {
  const rows = await db
    .select({
      slug: knowledge.slug,
      titleFa: knowledge.titleFa,
      lineFa: knowledge.lineFa,
      readingMinutes: knowledge.readingMinutes,
      savedAt: knowledgeBookmarks.createdAt,
    })
    .from(knowledgeBookmarks)
    .innerJoin(knowledge, eq(knowledgeBookmarks.knowledgeId, knowledge.id))
    .innerJoin(memoryItems, publicKnowledgeJoin)
    .where(and(eq(knowledgeBookmarks.accountId, accountId), publicKnowledgeFilter))
    .orderBy(desc(knowledgeBookmarks.createdAt))
    .limit(200);
  return rows.map((row) => ({ ...row, savedAt: row.savedAt.toISOString() }));
}
