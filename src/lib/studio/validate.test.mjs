import assert from "node:assert/strict";
import { test } from "node:test";

test("اعتبارسنجی استودیو: allowlist دقیق است؛ دادهٔ ناشناس یا پیوند ناامن رد/پاک می‌شود", async () => {
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

test("پیش‌فرض‌های قدیمیِ نمایشی در ذخیره/انتشار به محتوای صفحه تبدیل نمی‌شوند", async () => {
  const { validateStudioData } = await import("./validate.ts");
  const out = validateStudioData({
    content: [
      { type: "PageHero", props: { title: "عنوان صفحه" } },
      { type: "SectionHeader", props: { title: "عنوان بخش" } },
      { type: "BentoGrid", props: { items: [{ title: "کارت", body: "" }] } },
      { type: "CTABand", props: { label: "شروع", href: "/" } },
    ],
    root: {},
  });
  assert.ok(out);
  assert.equal(out.content[0].props.title, "");
  assert.equal(out.content[1].props.title, "");
  assert.deepEqual(out.content[2].props.items, []);
  assert.equal(out.content[3].props.label, "");
  assert.equal(out.content[3].props.href, "");
});

test("FAQ فقط پرسش/پاسخ محدود را نگه می‌دارد و متن را به HTML قابل اجرا تبدیل نمی‌کند", async () => {
  const { validateStudioData } = await import("./validate.ts");
  const out = validateStudioData({
    content: [{
      type: "FAQ",
      props: {
        heading: "پرسش‌ها",
        html: "<script>alert(1)</script>",
        items: [
          { question: "چطور شروع کنم؟", answer: "از صفحهٔ خانه شروع کن. <script>alert(1)</script>", extra: "stripped" },
          { question: "", answer: "" },
        ],
      },
    }],
    root: {},
  });
  assert.ok(out);
  assert.equal(out.content[0].props.items.length, 1);
  assert.deepEqual(out.content[0].props.items[0], {
    question: "چطور شروع کنم؟",
    answer: "از صفحهٔ خانه شروع کن. ",
  });
  assert.equal(out.content[0].props.html, undefined);
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

test("ترکیب انتشار به مقصد وابسته است؛ H1 یکتا و بلوک سیستمیِ درست الزامی است", async () => {
  const { validateStudioData } = await import("./validate.ts");
  const make = (type, props = {}) => ({ content: [{ type, props }], root: {} });

  assert.ok(validateStudioData(make("HadiranHomeHero", { title: "خانه" }), { target: "site:home", forPublish: true }));
  assert.equal(validateStudioData(make("HadiranHomeHero", { title: "خانه" }), { target: "site:privacy", forPublish: true }), null);
  assert.ok(validateStudioData(make("SignInPanel", { heading: "ورود" }), { target: "site:signin", forPublish: true }));
  assert.equal(validateStudioData(make("SignInPanel", { heading: "ورود" }), { target: "site:account", forPublish: true }), null);
  assert.ok(validateStudioData(make("AccountPanel"), { target: "site:account", forPublish: true }));
  assert.ok(validateStudioData(make("PageHero", { title: "حریم خصوصی" }), { target: "site:privacy", forPublish: true }));
  assert.equal(validateStudioData({ content: [
    { type: "PageHero", props: { title: "عنوان اول" } },
    { type: "PageHero", props: { title: "عنوان دوم" } },
  ], root: {} }, { target: "site:privacy", forPublish: true }), null);
});

test("تعریف Puck دقیقاً با allowlist اعتبارسنجی یکی است و بلوک‌های سیستمی target-aware هستند", async () => {
  const { STUDIO_BLOCK_TYPES } = await import("./validate.ts");
  const { studioConfig, studioConfigForTarget } = await import("./config.tsx");
  assert.deepEqual(Object.keys(studioConfig.components).sort(), [...STUDIO_BLOCK_TYPES].sort());
  assert.ok("HadiranHomeHero" in studioConfigForTarget("site:home").components);
  assert.ok(!("HadiranHomeHero" in studioConfigForTarget("site:privacy").components));
  assert.ok("SignInPanel" in studioConfigForTarget("site:signin").components);
  assert.ok(!("SignInPanel" in studioConfigForTarget("standalone").components));
  assert.ok("AccountPanel" in studioConfigForTarget("site:account").components);
  assert.ok(!("AccountPanel" in studioConfigForTarget("site:privacy").components));
});

test("resolve بدون دیتابیس: بلوک زنده خالیِ واقعی می‌گیرد و کرش نمی‌کند", async () => {
  const { resolveStudioData } = await import("./resolve.ts");
  const out = await resolveStudioData({
    content: [{ type: "AnalyzerGrid", props: { heading: "آینه‌ها", limit: "6", layout: "cards" } }],
    root: { props: {} },
  });
  assert.ok(Array.isArray(out.content[0].props.items));
  for (const item of out.content[0].props.items) {
    assert.equal(typeof item.title, "string");
    assert.ok(item.href.startsWith("/analyzers/"));
  }
});
