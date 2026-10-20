import type { KnowledgeCommitExecutor } from "./commit";
import type { RelatedRecord } from "./related";

export type MemoryArticle = {
  id: number;
  slug: string;
  revision: number;
  titleFa?: string;
};

export type MemoryStoreSnapshot = {
  articles: MemoryArticle[];
  refs: RelatedRecord[];
};

export class MemoryKnowledgeStore {
  articles: MemoryArticle[];
  refs: RelatedRecord[];
  failOnFind = false;
  failOnInsert = false;

  constructor(init?: Partial<MemoryStoreSnapshot>) {
    this.articles = (init?.articles ?? []).map((row) => ({ ...row }));
    this.refs = (init?.refs ?? []).map((row) => ({ ...row }));
  }

  snapshot(): MemoryStoreSnapshot {
    return {
      articles: this.articles.map((row) => ({ ...row })),
      refs: this.refs.map((row) => ({ ...row })),
    };
  }

  restore(snap: MemoryStoreSnapshot) {
    this.articles = snap.articles.map((row) => ({ ...row }));
    this.refs = snap.refs.map((row) => ({ ...row }));
  }

  executor(): KnowledgeCommitExecutor {
    return {
      deleteBySource: async (sourceId) => {
        this.refs = this.refs.filter((row) => row.sourceKnowledgeId !== sourceId);
      },
      findTargetsBySlugs: async (slugs) => {
        if (this.failOnFind) throw new Error("find_failed");
        const wanted = new Set(slugs);
        return this.articles.filter((row) => wanted.has(row.slug)).map((row) => ({ id: row.id, slug: row.slug }));
      },
      insertRelations: async (rows) => {
        if (this.failOnInsert) throw new Error("insert_failed");
        this.refs.push(...rows.map((row) => ({ ...row })));
      },
      applyCommit: async ({ id, baseRevision, columns }) => {
        const article = this.articles.find((row) => row.id === id);
        if (!article || article.revision !== baseRevision) return null;
        if (typeof columns.titleFa === "string") article.titleFa = columns.titleFa;
        if (typeof columns.slug === "string") article.slug = columns.slug;
        article.revision = baseRevision + 1;
        return { id: article.id, slug: article.slug, revision: article.revision };
      },
    };
  }

  async transaction<T>(fn: (exec: KnowledgeCommitExecutor) => Promise<T>): Promise<T> {
    const snap = this.snapshot();
    try {
      return await fn(this.executor());
    } catch (error) {
      this.restore(snap);
      throw error;
    }
  }
}
