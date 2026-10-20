import { eq } from "drizzle-orm";
import { db } from "@/db";
import { knowledge, memoryItems, semanticRecords } from "@/db/schema";
import { parseClosingOptions, parseRelatedSlugs, parseSimulator } from "@/lib/knowledge/article";
import { commitKnowledgeArticle } from "@/lib/knowledge/commit";
import { gardenPhase } from "@/lib/knowledge/garden-phase";
import { knowledgeCommitExecutor } from "@/lib/knowledge/related-db";

export { canDeleteDraft, gardenPhase, gardenPhaseFa, type GardenPhase } from "@/lib/knowledge/garden-phase";

export function articleColumnsFromRecord(record: typeof semanticRecords.$inferSelect) {
  return {
    titleFa: record.titleFa,
    titleEn: record.titleEn,
    summaryFa: record.summaryFa,
    bodyFa: record.bodyFa,
    growth: record.growth,
    readingMinutes: record.readingMinutes,
    lineFa: record.lineFa,
    questionFa: record.questionFa,
    rootFa: record.rootFa,
    firstStepFa: record.firstStepFa,
    marginNoteFa: record.marginNoteFa,
    prunedAt: record.prunedAt,
    audioUrl: record.audioUrl,
    simulator: parseSimulator(record.simulator),
    closingQuestionFa: record.closingQuestionFa,
    closingOptions: parseClosingOptions(record.closingOptions),
    closingPromptFa: record.closingPromptFa,
  };
}

export async function syncPublishedArticle(record: typeof semanticRecords.$inferSelect) {
  if (!record.promotedMemoryId) return;
  const [page] = await db
    .select({ id: knowledge.id, revision: knowledge.revision })
    .from(knowledge)
    .where(eq(knowledge.memoryItemId, record.promotedMemoryId))
    .limit(1);
  if (!page) return;
  await db.transaction(async (tx) => {
    await commitKnowledgeArticle(knowledgeCommitExecutor(tx), {
      id: page.id,
      baseRevision: page.revision,
      columns: articleColumnsFromRecord(record),
      relatedSlugs: parseRelatedSlugs(record.relatedSlugs),
    });
  });
}

export async function unpublishGarden(recordId: string, ownerId: number) {
  const [record] = await db.select().from(semanticRecords).where(eq(semanticRecords.id, recordId)).limit(1);
  if (!record) throw new Error("not_found");
  if (record.ownerId && record.ownerId !== ownerId) throw new Error("forbidden");
  if (gardenPhase(record) !== "published") throw new Error("not_published");
  const now = new Date();
  await db.transaction(async (tx) => {
    await tx
      .update(semanticRecords)
      .set({ visibility: "private", updatedAt: now })
      .where(eq(semanticRecords.id, recordId));
    if (!record.promotedMemoryId) return;
    await tx
      .update(memoryItems)
      .set({ visibility: "private", updatedAt: now })
      .where(eq(memoryItems.id, record.promotedMemoryId));
    await tx
      .update(knowledge)
      .set({ aiIndexable: false, updatedAt: now })
      .where(eq(knowledge.memoryItemId, record.promotedMemoryId));
  });
}

export async function archiveGarden(recordId: string, ownerId: number) {
  const [record] = await db.select().from(semanticRecords).where(eq(semanticRecords.id, recordId)).limit(1);
  if (!record) throw new Error("not_found");
  if (record.ownerId && record.ownerId !== ownerId) throw new Error("forbidden");
  if (record.status === "archived") return;
  const now = new Date();
  await db.transaction(async (tx) => {
    await tx
      .update(semanticRecords)
      .set({ status: "archived", visibility: "private", updatedAt: now })
      .where(eq(semanticRecords.id, recordId));
    if (!record.promotedMemoryId) return;
    await tx
      .update(memoryItems)
      .set({ visibility: "private", updatedAt: now })
      .where(eq(memoryItems.id, record.promotedMemoryId));
    await tx
      .update(knowledge)
      .set({ aiIndexable: false, updatedAt: now })
      .where(eq(knowledge.memoryItemId, record.promotedMemoryId));
  });
}
