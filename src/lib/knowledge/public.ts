import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { knowledge, memoryItems } from "@/db/schema";
import { publicKnowledgeFilter, publicKnowledgeJoin } from "@/lib/public/policy";

export { publicKnowledgeFilter, publicKnowledgeJoin };

export async function getPublicKnowledgeBySlug(slug: string) {
  const rows = await db
    .select({ item: knowledge })
    .from(knowledge)
    .innerJoin(memoryItems, publicKnowledgeJoin)
    .where(and(eq(knowledge.slug, slug), publicKnowledgeFilter));
  return rows[0]?.item ?? null;
}
