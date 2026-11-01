import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

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
  assert.equal(publishedTakeoverData(null, "site:signin"), null);
  assert.equal(publishedTakeoverData({ content: [], root: {} }, "site:signin"), null);
  assert.equal(publishedTakeoverData({ content: [{ type: "Nope", props: {} }], root: {} }, "site:signin"), null);
  const ok = publishedTakeoverData({
    content: [{ type: "SignInPanel", props: { heading: "ورود", lead: "" } }],
    root: {},
  }, "site:signin");
  assert.ok(ok);
  assert.equal(ok.content[0].type, "SignInPanel");
});

test("همهٔ مسیرهای ثابت سطح‌بالای سایت تحت کنترل استودیو هستند و مسیر تازه بدون رجیستری پذیرفته نمی‌شود", async () => {
  const { SITE_PAGES } = await import("./site-pages.ts");
  const appDir = fileURLToPath(new URL("../../app/", import.meta.url));
  const excludedRouteRoots = new Set(["api", "workspace", "p"]);
  const routeDirs = readdirSync(appDir, { withFileTypes: true }).filter(
    (entry) => entry.isDirectory() && !entry.name.startsWith("[") && !excludedRouteRoots.has(entry.name),
  );
  const staticSitePages = [
    { path: "/", file: path.join(appDir, "page.tsx") },
    ...routeDirs
      .map((entry) => ({ path: `/${entry.name}`, file: path.join(appDir, entry.name, "page.tsx") }))
      .filter(({ file }) => existsSync(file)),
  ];

  for (const route of staticSitePages) {
    const definition = SITE_PAGES.find((page) => page.path === route.path);
    assert.ok(definition, `${route.path}: add the route to SITE_PAGES before it can ship`);
    const source = readFileSync(route.file, "utf8");
    const controlled =
      source.includes(`withStudioTakeover("${definition.key}"`) ||
      source.includes(`withStudioTakeover('${definition.key}'`) ||
      source.includes(`<StudioTakeover siteKey="${definition.key}"`);
    assert.ok(controlled, `${route.path}: connect it to StudioTakeover`);
  }

  for (const page of SITE_PAGES.filter((entry) => entry.path.split("/").filter(Boolean).length <= 1)) {
    const route = staticSitePages.find((candidate) => candidate.path === page.path);
    assert.ok(route, `${page.path}: registered studio page must have a route`);
  }
});
