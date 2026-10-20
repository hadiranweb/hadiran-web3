import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { knowledge, knowledgeReferences } from "@/db/schema";
import { parseRelatedSlugs } from "@/lib/knowledge/article";

export async function replaceKnowledgeRelated(sourceId: number, slugs: unknown) {
  if (!Array.isArray(slugs)) return;
  const wanted = parseRelatedSlugs(slugs);
  await db.delete(knowledgeReferences).where(eq(knowledgeReferences.sourceKnowledgeId, sourceId));
  if (wanted.length === 0) return;
  const targets = await db
    .select({ id: knowledge.id, slug: knowledge.slug })
    .from(knowledge)
    .where(inArray(knowledge.slug, wanted));
  const rows = targets
    .filter((row) => row.id !== sourceId)
    .map((row) => ({
      sourceKnowledgeId: sourceId,
      targetKnowledgeId: row.id,
      relation: "thread",
    }));
  if (rows.length) await db.insert(knowledgeReferences).values(rows);
}
