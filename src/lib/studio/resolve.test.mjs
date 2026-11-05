import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("فقط خروجی عمومی Hero را به HomeChat واقعی وصل می‌کند؛ preview تعاملی نیست", async () => {
  const { resolveStudioData } = await import("./resolve.ts");
  const data = { content: [{ type: "HadiranHomeHero", props: { title: "خانه" } }], root: {} };
  const preview = await resolveStudioData(data, { mode: "preview" });
  const published = await resolveStudioData(data, { mode: "public" });
  assert.equal(preview.content[0].props.interactive, false);
  assert.equal(published.content[0].props.interactive, true);
});

test("SignInPanel مقصد next را فقط از مسیر داخلی امن می‌گیرد", async () => {
  const { resolveStudioData } = await import("./resolve.ts");
  const data = { content: [{ type: "SignInPanel", props: { heading: "ورود" } }], root: {} };
  const safe = await resolveStudioData(data, { mode: "public", signInNextPath: "/account?tab=profile" });
  const unsafe = await resolveStudioData(data, { mode: "public", signInNextPath: "//evil.example" });
  const encodedBackslash = await resolveStudioData(data, { mode: "public", signInNextPath: "/%5c%5cevil.example" });
  assert.equal(safe.content[0].props.nextPath, "/account?tab=profile");
  assert.equal(unsafe.content[0].props.nextPath, "/");
  assert.equal(encodedBackslash.content[0].props.nextPath, "/");
});

test("مقصد ورود مسیرهای خارجی، backslash و control character را رد می‌کند", async () => {
  const { safeInternalNext } = await import("../auth/next-path.ts");
  assert.equal(safeInternalNext("/account/orders?page=2"), "/account/orders?page=2");
  assert.equal(safeInternalNext("https://evil.example"), "/");
  assert.equal(safeInternalNext("//evil.example"), "/");
  assert.equal(safeInternalNext("/\\\\evil.example"), "/");
  assert.equal(safeInternalNext("/%5C%5Cevil.example"), "/");
  assert.equal(safeInternalNext("/account\nheader"), "/");
});

test("resolve مسیرهای GET فهرست‌ها را حفظ می‌کند و دادهٔ خام را به آیتم واقعی وصل می‌کند", async () => {
  const { resolveStudioData } = await import("./resolve.ts");
  const data = {
    content: [
      { type: "KnowledgeList", props: { heading: "دانش", limit: "all", layout: "cards" } },
      { type: "CourseGrid", props: { heading: "دوره‌ها", limit: "all", layout: "cards" } },
      { type: "ShopGrid", props: { heading: "فروشگاه", limit: "all", layout: "cards" } },
    ],
    root: {},
  };
  const out = await resolveStudioData(data, {
    mode: "public",
    searchParams: { q: "آزمون", type: "free", topic: "systems", sort: "old", view: "list", short: "1", kind: "physical_good" },
  });
  const [knowledge, courses, shop] = out.content.map((block) => block.props);
  assert.equal(knowledge.controls.action, "/knowledge");
  assert.equal(knowledge.controls.q, "آزمون");
  assert.equal(knowledge.controls.hidden.topic, "systems");
  assert.equal(knowledge.layout, "list");
  assert.ok(knowledge.controls.groups.find((group) => group.label === "نمایش").links.some((link) => link.active && link.label === "فهرست"));
  assert.equal(knowledge.hasActiveFilter, true);
  assert.ok(Array.isArray(knowledge.items));
  assert.equal(courses.controls.action, "/courses");
  assert.ok(courses.controls.groups.some((group) => group.label === "موضوع"));
  assert.ok(courses.controls.groups.find((group) => group.label === "موضوع").links[0].href.startsWith("/courses?"));
  assert.equal(shop.controls.action, "/shop");
  assert.equal(shop.controls.hidden.kind, "physical_good");
  assert.ok(shop.controls.groups.some((group) => group.label === "مرتب‌سازی"));
  assert.ok([knowledge, courses, shop].every((block) => block.liveSource === "unavailable"));
});

test("صفحه‌های فهرستی با Puck به RSC رندر می‌شوند، نه جزیرهٔ کلاینت", async () => {
  const source = await readFile(new URL("../../components/studio/StudioRender.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(source, /^\s*["']use client["']/);
  assert.match(source, /@puckeditor\/core\/rsc/);
});
