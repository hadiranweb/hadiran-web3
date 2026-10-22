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

test("بلوک زنده: آیتم‌ها هرگز ذخیره نمی‌شوند و فقط تنظیمات می‌ماند", async () => {
  const { validateStudioData } = await import("./validate.ts");
  const out = validateStudioData({
    content: [
      {
        type: "KnowledgeList",
        props: { heading: "دانش", topicSlug: "system-design", limit: "6", layout: "cards", items: [{ title: "جعلی" }] },
      },
      { type: "ShopGrid", props: { heading: "فروشگاه", kind: "course;DROP", items: [1] } },
    ],
    root: {},
  });
  assert.ok(out);
  assert.equal(out.content[0].props.items, undefined);
  assert.equal(out.content[0].props.topicSlug, "system-design");
  assert.equal(out.content[1].props.kind, "");
});

test("resolve بدون دیتابیس: بلوک زنده خالیِ واقعی می‌گیرد و کرش نمی‌کند", async () => {
  const { resolveStudioData } = await import("./resolve.ts");
  const out = await resolveStudioData({
    content: [{ type: "AnalyzerGrid", props: { heading: "آینه‌ها", limit: "6", layout: "cards" } }],
    root: { props: {} },
  });
  // آینه‌ها از رجیستری کدی هم می‌آیند؛ دست‌کم ساختار آیتم‌ها سالم است.
  assert.ok(Array.isArray(out.content[0].props.items));
  for (const item of out.content[0].props.items) {
    assert.equal(typeof item.title, "string");
    assert.ok(item.href.startsWith("/analyzers/"));
  }
});
