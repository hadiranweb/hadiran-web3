import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { knowledge, knowledgeReferences } from "@/db/schema";
import type { KnowledgeCommitExecutor } from "./commit";
import type { RelatedExecutor, RelatedRecord } from "./related";

type QueryTx = {
  delete: typeof db.delete;
  insert: typeof db.insert;
  select: typeof db.select;
  update: typeof db.update;
};

export function relatedExecutor(tx: QueryTx): RelatedExecutor {
  return {
    async deleteBySource(sourceId) {
      await tx.delete(knowledgeReferences).where(eq(knowledgeReferences.sourceKnowledgeId, sourceId));
    },
    async findTargetsBySlugs(slugs) {
      if (!slugs.length) return [];
      return tx
        .select({ id: knowledge.id, slug: knowledge.slug })
        .from(knowledge)
        .where(inArray(knowledge.slug, slugs));
    },
    async insertRelations(rows: RelatedRecord[]) {
      if (!rows.length) return;
      await tx.insert(knowledgeReferences).values(rows);
    },
  };
}

export function knowledgeCommitExecutor(tx: QueryTx): KnowledgeCommitExecutor {
  return {
    ...relatedExecutor(tx),
    async applyCommit({ id, baseRevision, columns }) {
      const [row] = await tx
        .update(knowledge)
        .set({
          ...(columns as Partial<typeof knowledge.$inferInsert>),
          revision: baseRevision + 1,
          updatedAt: new Date(),
        })
        .where(and(eq(knowledge.id, id), eq(knowledge.revision, baseRevision)))
        .returning({ id: knowledge.id, slug: knowledge.slug, revision: knowledge.revision });
      return row ?? null;
    },
  };
}
