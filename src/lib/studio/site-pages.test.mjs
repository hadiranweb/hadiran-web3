import test from "node:test";
import assert from "node:assert/strict";

test("رجیستری صفحه‌های سایت: کلید و مسیر یکتا و مسیرها معتبرند", async () => {
  const { SITE_PAGES, siteSlug, sitePageByTarget, siteTarget } = await import("./site-pages.ts");
  const keys = SITE_PAGES.map((p) => p.key);
  const paths = SITE_PAGES.map((p) => p.path);
  assert.equal(new Set(keys).size, keys.length);
  assert.equal(new Set(paths).size, paths.length);
  for (const page of SITE_PAGES) {
    assert.ok(page.path.startsWith("/"), page.key);
    assert.equal(siteTarget(page.key), `site:${page.key}`);
    assert.equal(siteSlug(page.key), `site-${page.key}`);
    assert.equal(sitePageByTarget(siteTarget(page.key))?.key, page.key);
  }
  // صفحه‌های حیاتی حتماً داخل رجیستری‌اند.
  for (const key of ["home", "knowledge", "analyzers", "signin", "account"]) {
    assert.ok(keys.includes(key), key);
  }
});

test("گروه‌های متن هر صفحه واقعی‌اند", async () => {
  const { SITE_PAGES } = await import("./site-pages.ts");
  const { COPY_GROUPS } = await import("../content/registry.ts");
  for (const page of SITE_PAGES) {
    for (const group of page.copyGroups) assert.ok(COPY_GROUPS.includes(group), `${page.key}:${group}`);
  }
});

test("takeover فقط با دادهٔ منتشرشدهٔ معتبر و غیرخالی فعال می‌شود", async () => {
  const { publishedTakeoverData } = await import("./takeover.ts");
  assert.equal(publishedTakeoverData(null), null);
  assert.equal(publishedTakeoverData({ content: [], root: {} }), null);
  assert.equal(publishedTakeoverData({ content: [{ type: "Nope", props: {} }], root: {} }), null);
  const ok = publishedTakeoverData({
    content: [{ type: "SignInPanel", props: { heading: "ورود", lead: "" } }],
    root: {},
  });
  assert.ok(ok);
  assert.equal(ok.content[0].type, "SignInPanel");
});
