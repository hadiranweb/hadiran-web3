import assert from "node:assert/strict";
import { test } from "node:test";
import { commitKnowledgeArticle, RevisionConflict } from "./commit";
import { replaceKnowledgeRelated } from "./related";
import { MemoryKnowledgeStore } from "./related-memory";

const seed = {
  articles: [
    { id: 1, slug: "alpha", revision: 2, titleFa: "آلفا" },
    { id: 2, slug: "beta", revision: 1, titleFa: "بتا" },
    { id: 3, slug: "gamma", revision: 1, titleFa: "گاما" },
  ],
  refs: [{ sourceKnowledgeId: 1, targetKnowledgeId: 2, relation: "thread" }],
};

test("failure after delete keeps previous relations", async () => {
  const store = new MemoryKnowledgeStore(seed);
  store.failOnFind = true;
  await assert.rejects(
    () => store.transaction((tx) => replaceKnowledgeRelated(tx, 1, ["gamma"])),
    /find_failed/,
  );
  assert.deepEqual(store.refs, seed.refs);
});

test("failure on insert keeps previous relations", async () => {
  const store = new MemoryKnowledgeStore(seed);
  store.failOnInsert = true;
  await assert.rejects(
    () => store.transaction((tx) => replaceKnowledgeRelated(tx, 1, ["gamma"])),
    /insert_failed/,
  );
  assert.deepEqual(store.refs, seed.refs);
});

test("article update and related replace roll back together", async () => {
  const store = new MemoryKnowledgeStore(seed);
  store.failOnFind = true;
  await assert.rejects(
    () =>
      store.transaction((tx) =>
        commitKnowledgeArticle(tx, {
          id: 1,
          baseRevision: 2,
          columns: { titleFa: "آلفا تازه" },
          relatedSlugs: ["gamma"],
        }),
      ),
    /find_failed/,
  );
  assert.equal(store.articles[0]?.titleFa, "آلفا");
  assert.equal(store.articles[0]?.revision, 2);
  assert.deepEqual(store.refs, seed.refs);
});

test("stale revision does not overwrite a concurrent save", async () => {
  const store = new MemoryKnowledgeStore(seed);
  const first = await store.transaction((tx) =>
    commitKnowledgeArticle(tx, {
      id: 1,
      baseRevision: 2,
      columns: { titleFa: "ذخیره اول" },
      relatedSlugs: ["gamma"],
    }),
  );
  assert.equal(first.revision, 3);
  assert.equal(store.articles[0]?.titleFa, "ذخیره اول");
  assert.deepEqual(store.refs, [{ sourceKnowledgeId: 1, targetKnowledgeId: 3, relation: "thread" }]);

  await assert.rejects(
    () =>
      store.transaction((tx) =>
        commitKnowledgeArticle(tx, {
          id: 1,
          baseRevision: 2,
          columns: { titleFa: "ذخیره کهنه" },
          relatedSlugs: ["beta"],
        }),
      ),
    (error: unknown) => error instanceof RevisionConflict && error.currentRevision === 2,
  );
  assert.equal(store.articles[0]?.titleFa, "ذخیره اول");
  assert.equal(store.articles[0]?.revision, 3);
  assert.deepEqual(store.refs, [{ sourceKnowledgeId: 1, targetKnowledgeId: 3, relation: "thread" }]);
});
