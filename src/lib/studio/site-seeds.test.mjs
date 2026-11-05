import assert from "node:assert/strict";
import { test } from "node:test";

test("صفحه‌های فعلی از منبع واقعی‌شان draft قابل‌ویرایش Puck می‌گیرند؛ خروجی خالی/placeholder نیست", async () => {
  const { SITE_PAGES } = await import("./site-pages.ts");
  const { DEFAULT_COPY } = await import("../content/registry.ts");
  const { sitePageSeedData } = await import("./site-seeds.ts");
  const { validateStudioData } = await import("./validate.ts");

  for (const page of SITE_PAGES) {
    const seed = sitePageSeedData(page.key, DEFAULT_COPY, page.titleFa);
    const valid = validateStudioData(seed, { target: `site:${page.key}`, forPublish: true });
    assert.ok(valid, `${page.path} must have a publishable baseline`);
    assert.ok(valid.content.length > 0, `${page.path} must not start blank`);
    const ids = valid.content.map((block) => block.props.id);
    assert.equal(new Set(ids).size, ids.length, `${page.path} must have stable unique Puck block ids`);
    assert.ok(ids.every((id) => typeof id === "string" && id.length > 0));
    assert.deepEqual(
      sitePageSeedData(page.key, DEFAULT_COPY, page.titleFa).content.map((block) => block.props.id),
      ids,
      `${page.path} block ids must be deterministic between seed reads`,
    );
  }
});

test("واردسازی خانه/لیست‌ها محتوای فعلی و بلوک دادهٔ زنده را نگه می‌دارد", async () => {
  const { DEFAULT_COPY } = await import("../content/registry.ts");
  const { sitePageSeedData } = await import("./site-seeds.ts");
  const home = sitePageSeedData("home", DEFAULT_COPY);
  assert.equal(home.content[0].type, "HadiranHomeHero");
  assert.equal(home.content[0].props.title, DEFAULT_COPY.voice.slogan);
  assert.equal(home.content[1].type, "HomeMarquee");
  assert.equal(home.content[1].props.items.length, 6);
  assert.equal(home.content[2].type, "HomeFlow");
  assert.equal(home.content[2].props.items.length, DEFAULT_COPY.homeFlow.steps.length);
  assert.equal(home.content[3].type, "HomeRooms");
  assert.equal(home.content[3].props.items[0].href, DEFAULT_COPY.rooms.knowledge.href);

  const knowledge = sitePageSeedData("knowledge", DEFAULT_COPY);
  assert.equal(knowledge.content[0].props.title, DEFAULT_COPY.knowledgeCopy.title);
  assert.equal(knowledge.content[1].type, "KnowledgeList");
  assert.equal(knowledge.content[1].props.limit, "all");
});

test("صفحه‌های آینده و مستقل هم از الگوی شروع معتبر و غیرخالی استفاده می‌کنند", async () => {
  const { DEFAULT_COPY } = await import("../content/registry.ts");
  const { sitePageSeedData, standalonePageSeedData } = await import("./site-seeds.ts");
  const { validateStudioData } = await import("./validate.ts");
  const future = sitePageSeedData("future-page", DEFAULT_COPY, "صفحهٔ آینده");
  const standalone = standalonePageSeedData("صفحهٔ تازه");
  assert.ok(validateStudioData(future, { target: "site:future-page", forPublish: true }));
  assert.ok(validateStudioData(standalone, { target: "standalone", forPublish: true }));
  assert.equal(future.content[0].props.title, "صفحهٔ آینده");
  assert.equal(standalone.content[0].props.title, "صفحهٔ تازه");
});

test("بذر حریم خصوصی متن واقعی و فهرست نشانه‌دار را نگه می‌دارد", async () => {
  const { DEFAULT_COPY } = await import("../content/registry.ts");
  const { privacySummary, privacyUseTerms, privacyDetails } = await import("../privacy/content.ts");
  const { sitePageSeedData } = await import("./site-seeds.ts");
  const { validateStudioData } = await import("./validate.ts");
  const seed = sitePageSeedData("privacy", DEFAULT_COPY);
  const valid = validateStudioData(seed, { target: "site:privacy", forPublish: true });
  assert.ok(valid);
  assert.equal(valid.content[1].props.title, "خلاصه");
  assert.equal(valid.content[2].props.body, privacySummary);
  assert.equal(valid.content[4].props.body, privacyUseTerms.join("\n\n"));
  assert.equal(valid.content[4].props.mode, "bullets");
  assert.equal(valid.content[6].props.body, privacyDetails.join("\n\n"));
  assert.equal(valid.content[6].props.mode, "bullets");
});

test("صفحهٔ معرفی متن قابل‌ویرایش دارد ولی نام و جزئیات شخص را زنده از پروفایل می‌گیرد", async () => {
  const { DEFAULT_COPY } = await import("../content/registry.ts");
  const { sitePageSeedData } = await import("./site-seeds.ts");
  const { validateStudioData } = await import("./validate.ts");
  const seed = sitePageSeedData("person", DEFAULT_COPY);
  assert.equal(seed.content.length, 1);
  assert.equal(seed.content[0].type, "PersonPage");
  assert.equal(seed.content[0].props.fallbackName, "هادی");
  assert.equal(seed.content[0].props.fallbackKicker, DEFAULT_COPY.voice.altTitle);
  assert.equal(seed.content[0].props.intro, DEFAULT_COPY.personCopy.intro.join("\n\n"));
  assert.equal(seed.content[0].props.missingText, DEFAULT_COPY.personCopy.missing);
  assert.ok(validateStudioData(seed, { target: "site:person", forPublish: true }));
});
