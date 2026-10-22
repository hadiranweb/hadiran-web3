import assert from "node:assert/strict";
import { test } from "node:test";

test("اعتبارسنجی استودیو: بلوک مجاز پاک می‌شود، بلوک ناشناس و HTML آزاد رد می‌شود", async () => {
  const { validateStudioData, cleanSlug } = await import("./validate.ts");
  const ok = validateStudioData({
    content: [
      { type: "PageHero", props: { id: "a1", title: "سلام", primaryHref: "/knowledge", align: "center" } },
      { type: "CTABand", props: { title: "شروع", href: "javascript:alert(1)" } },
    ],
    root: { props: { title: "صفحه" } },
  });
  assert.ok(ok);
  assert.equal(ok.content.length, 2);
  assert.equal(ok.content[1].props.href, "");
  assert.equal(validateStudioData({ content: [{ type: "EvilBlock", props: {} }], root: {} }), null);
  assert.equal(validateStudioData("nope"), null);
  assert.equal(cleanSlug("My Page!"), null);
  assert.equal(cleanSlug("landing-1"), "landing-1");
});
