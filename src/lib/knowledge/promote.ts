import { db } from "@/db";
import {
  graphEdges,
  knowledge,
  knowledgeClaims,
  knowledgePromotions,
  knowledgeReviews,
  memoryItems,
  provenanceRecords,
  semanticRecords,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { slugify } from "@/lib/markdown";
import { newCanonicalId } from "./ids";
import {
  RELATION_PROMOTED_AS,
  RELATION_PUBLISHED_AS,
  RELATION_SUPPORTS,
  SCHEMA_VERSION,
} from "./vocabulary";

export async function promoteSemanticRecord(opts: {
  recordId: string;
  accountId: number;
  visibility: "public" | "private";
  rationaleFa?: string;
}) {
  const [record] = await db.select().from(semanticRecords).where(eq(semanticRecords.id, opts.recordId));
  if (!record) throw new Error("not_found");
  if (record.ownerId && record.ownerId !== opts.accountId) throw new Error("forbidden");

  const visibility = opts.visibility;
  const statement = record.intent?.trim() || record.summaryFa?.trim() || record.titleFa;
  const now = new Date();

  let claimId = newCanonicalId("CLAIM");
  const [existingClaim] = await db
    .select()
    .from(knowledgeClaims)
    .where(eq(knowledgeClaims.sourceRecordId, record.id));
  if (existingClaim) {
    claimId = existingClaim.id;
    await db
      .update(knowledgeClaims)
      .set({
        statementFa: statement,
        subject: record.titleFa,
        lifecycle: "approved",
        confidence: "validated",
        updatedAt: now,
      })
      .where(eq(knowledgeClaims.id, claimId));
  } else {
    await db.insert(knowledgeClaims).values({
      id: claimId,
      subject: record.titleFa,
      predicate: "asserts",
      statementFa: statement,
      lifecycle: "approved",
      confidence: "validated",
      sourceRecordId: record.id,
      createdBy: opts.accountId,
    });
  }

  const reviewId = newCanonicalId("REVIEW");
  await db.insert(knowledgeReviews).values({
    id: reviewId,
    claimId,
    reviewerId: opts.accountId,
    decision: "approve",
    rationaleFa: opts.rationaleFa?.trim() || "ارتقا توسط owner",
    status: "completed",
  });

  let memoryId = record.promotedMemoryId;
  if (memoryId) {
    await db
      .update(memoryItems)
      .set({
        titleFa: record.titleFa,
        titleEn: record.titleEn,
        summaryFa: record.summaryFa,
        bodyFa: record.bodyFa,
        visibility,
        lifecycle: "approved",
        sourceClaimId: claimId,
        sourceRecordId: record.id,
        updatedAt: now,
      })
      .where(eq(memoryItems.id, memoryId));
  } else {
    memoryId = newCanonicalId("MEMORY");
    await db.insert(memoryItems).values({
      id: memoryId,
      kind: "validated_pattern",
      titleFa: record.titleFa,
      titleEn: record.titleEn,
      summaryFa: record.summaryFa,
      bodyFa: record.bodyFa,
      lifecycle: "approved",
      visibility,
      confidence: "validated",
      sourceClaimId: claimId,
      sourceRecordId: record.id,
    });
  }

  const promotionId = newCanonicalId("PROMOTION");
  await db.insert(knowledgePromotions).values({
    id: promotionId,
    claimId,
    reviewId,
    targetMemoryId: memoryId,
    targetKind: "validated_pattern",
    promotedBy: opts.accountId,
    rationaleFa: opts.rationaleFa?.trim() || null,
  });

  await db
    .update(memoryItems)
    .set({ promotionId, updatedAt: now })
    .where(eq(memoryItems.id, memoryId));

  await db
    .update(semanticRecords)
    .set({
      status: visibility === "public" ? "published" : "approved",
      visibility,
      promotedMemoryId: memoryId,
      updatedAt: now,
    })
    .where(eq(semanticRecords.id, record.id));

  const latin = slugify(record.titleEn || record.slug || "") || slugify(record.titleFa);
  const slug = latin || `k-${memoryId.slice(-8)}`;

  const [existingKnowledge] = await db.select().from(knowledge).where(eq(knowledge.memoryItemId, memoryId));
  let publicSlug = existingKnowledge?.slug ?? slug;
  if (!existingKnowledge) {
    const [dup] = await db.select({ id: knowledge.id }).from(knowledge).where(eq(knowledge.slug, publicSlug));
    if (dup) publicSlug = `${publicSlug}-${memoryId.slice(-4)}`;
    await db.insert(knowledge).values({
      slug: publicSlug,
      type: "article",
      titleFa: record.titleFa,
      titleEn: record.titleEn,
      summaryFa: record.summaryFa,
      bodyFa: record.bodyFa,
      aiIndexable: visibility === "public",
      memoryItemId: memoryId,
    });
  } else {
    await db
      .update(knowledge)
      .set({
        titleFa: record.titleFa,
        titleEn: record.titleEn,
        summaryFa: record.summaryFa,
        bodyFa: record.bodyFa,
        aiIndexable: visibility === "public",
        updatedAt: now,
      })
      .where(eq(knowledge.id, existingKnowledge.id));
  }

  if (!existingKnowledge) {
    await db.insert(graphEdges).values([
      {
        id: newCanonicalId("EDGE"),
        sourceType: "semantic_record",
        sourceId: record.id,
        relationType: RELATION_SUPPORTS,
        targetType: "knowledge_claim",
        targetId: claimId,
        edgeClass: "epistemic",
        createdBy: opts.accountId,
      },
      {
        id: newCanonicalId("EDGE"),
        sourceType: "knowledge_claim",
        sourceId: claimId,
        relationType: RELATION_PROMOTED_AS,
        targetType: "memory_item",
        targetId: memoryId,
        edgeClass: "governance",
        createdBy: opts.accountId,
      },
      {
        id: newCanonicalId("EDGE"),
        sourceType: "memory_item",
        sourceId: memoryId,
        relationType: RELATION_PUBLISHED_AS,
        targetType: "article",
        targetId: publicSlug,
        edgeClass: "publication",
        createdBy: opts.accountId,
      },
    ]);
  }

  await db.insert(provenanceRecords).values({
    id: newCanonicalId("PROV"),
    subjectType: "memory_item",
    subjectId: memoryId,
    sourceType: "human_input",
    actorId: opts.accountId,
    transformation: "promote",
    schemaVersion: SCHEMA_VERSION,
  });

  return { memoryId, slug: publicSlug, visibility };
}
