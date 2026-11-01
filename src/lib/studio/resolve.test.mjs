import assert from "node:assert/strict";
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
