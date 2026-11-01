import assert from "node:assert/strict";
import { test } from "node:test";

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
