import { replaceKnowledgeRelated, type RelatedExecutor } from "./related";

/**
 * GitHub-style optimistic lock for a linear article history:
 * the editor sends the HEAD revision it loaded (If-Match / fast-forward).
 * A stale base is rejected so a concurrent save cannot overwrite the other.
 */
export class RevisionConflict extends Error {
  readonly code = "revision_conflict" as const;
  readonly currentRevision: number;

  constructor(currentRevision: number) {
    super("revision_conflict");
    this.name = "RevisionConflict";
    this.currentRevision = currentRevision;
  }
}

export function parseBaseRevision(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) return value;
  if (typeof value === "string" && /^\d+$/.test(value.trim())) {
    const next = Number(value.trim());
    return next > 0 ? next : null;
  }
  return null;
}

export type KnowledgeCommitExecutor = RelatedExecutor & {
  applyCommit(input: {
    id: number;
    baseRevision: number;
    columns: Record<string, unknown>;
  }): Promise<{ id: number; slug: string; revision: number } | null>;
};

export async function commitKnowledgeArticle(
  exec: KnowledgeCommitExecutor,
  input: {
    id: number;
    baseRevision: number;
    columns: Record<string, unknown>;
    relatedSlugs: unknown;
  },
) {
  const updated = await exec.applyCommit({
    id: input.id,
    baseRevision: input.baseRevision,
    columns: input.columns,
  });
  if (!updated) throw new RevisionConflict(input.baseRevision);
  await replaceKnowledgeRelated(exec, input.id, input.relatedSlugs);
  return updated;
}
