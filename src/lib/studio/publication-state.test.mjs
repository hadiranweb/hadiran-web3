import assert from "node:assert/strict";
import { test } from "node:test";

test("seed فقط draft خالیِ دست‌نخورده را پر می‌کند و draft خالیِ ذخیره‌شده را بازنویسی نمی‌کند", async () => {
  const { canSeedUnmodifiedEmptyDraft } = await import("./publication-state.ts");
  const created = new Date("2026-01-01T00:00:00.000Z");
  assert.equal(canSeedUnmodifiedEmptyDraft({ content: [], root: {} }, created, created), true);
  assert.equal(canSeedUnmodifiedEmptyDraft({ content: [], root: {} }, created, new Date(created.getTime() + 1)), false);
  assert.equal(canSeedUnmodifiedEmptyDraft({ content: [], root: {} }, created, new Date(created.getTime() + 2_000)), false);
  assert.equal(canSeedUnmodifiedEmptyDraft({ content: [{ type: "PageHero" }], root: {} }, created, created), false);
  assert.equal(canSeedUnmodifiedEmptyDraft(null, created, created), false);
});

test("ذخیرهٔ draft نسخهٔ منتشرشده را زنده نگه می‌دارد", async () => {
  const { statusAfterSavingDraft, hasUnpublishedDraft } = await import("./publication-state.ts");
  const published = { content: [{ type: "PageHero", props: { title: "نسخهٔ یک" } }], root: {} };
  const edited = { content: [{ type: "PageHero", props: { title: "نسخهٔ دو" } }], root: {} };

  assert.equal(statusAfterSavingDraft("published", published), "published");
  assert.equal(statusAfterSavingDraft("published", null), "draft");
  assert.equal(statusAfterSavingDraft("archived", published), "archived");
  assert.equal(hasUnpublishedDraft(published, JSON.parse(JSON.stringify(published))), false);
  assert.equal(hasUnpublishedDraft(edited, published), true);
  assert.equal(hasUnpublishedDraft(edited, null), false);
});
