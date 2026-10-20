import { parseRelatedSlugs } from "./article";

export type RelatedRecord = {
  sourceKnowledgeId: number;
  targetKnowledgeId: number;
  relation: string;
};

/** Narrow executor so Postgres and the in-memory adapter share one helper. */
export type RelatedExecutor = {
  deleteBySource(sourceId: number): Promise<void>;
  findTargetsBySlugs(slugs: string[]): Promise<{ id: number; slug: string }[]>;
  insertRelations(rows: RelatedRecord[]): Promise<void>;
};

export async function replaceKnowledgeRelated(exec: RelatedExecutor, sourceId: number, slugs: unknown) {
  if (!Array.isArray(slugs)) return;
  const wanted = parseRelatedSlugs(slugs);
  await exec.deleteBySource(sourceId);
  if (wanted.length === 0) return;
  const targets = await exec.findTargetsBySlugs(wanted);
  const rows = targets
    .filter((row) => row.id !== sourceId)
    .map((row) => ({
      sourceKnowledgeId: sourceId,
      targetKnowledgeId: row.id,
      relation: "thread",
    }));
  if (rows.length) await exec.insertRelations(rows);
}
