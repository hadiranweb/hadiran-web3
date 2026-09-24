import { and, eq, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { knowledge, memoryItems } from "@/db/schema";

export const publicKnowledgeFilter = and(
  isNotNull(knowledge.memoryItemId),
  eq(knowledge.aiIndexable, true),
  eq(memoryItems.lifecycle, "approved"),
  eq(memoryItems.visibility, "public"),
);

export async function getPublicKnowledgeBySlug(slug: string) {
  const rows = await db
    .select({ item: knowledge })
    .from(knowledge)
    .innerJoin(memoryItems, eq(knowledge.memoryItemId, memoryItems.id))
    .where(and(eq(knowledge.slug, slug), publicKnowledgeFilter));
  return rows[0]?.item ?? null;
}
