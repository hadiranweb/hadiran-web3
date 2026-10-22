/**
 * سیاست مقادیر و حکمرانی سرویس MCP: پیش‌فرض/تحمیل/سقف و شرط مؤثربودن ابزار.
 * اجرا: npx tsx --test src/lib/mcp/service-types.test.mjs
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import { applyValuePolicy, isToolEffective, isValidMcpName, publicToolName } from "./service-types.ts";

const tool = { defaults: { limit: 4, lang: "fa" }, caps: { limit: 8 } };

test("پیش‌فرض پر می‌کند، ورودی مدل رویش می‌نشیند", () => {
  const out = applyValuePolicy(tool, {}, { query: "x" });
  assert.equal(out.limit, 4);
  assert.equal(out.lang, "fa");
  assert.equal(out.query, "x");
});

test("تحمیل بستن از ورودی مدل قوی‌تر است", () => {
  const out = applyValuePolicy(tool, { limit: 2 }, { limit: 5 });
  assert.equal(out.limit, 2);
});

test("سقف عددی هرگز رد نمی‌شود و سقف غیرعددی تحمیلی است", () => {
  assert.equal(applyValuePolicy(tool, { limit: 99 }, { limit: 99 }).limit, 8);
  const forced = applyValuePolicy({ defaults: {}, caps: { includeMirrors: false } }, {}, { includeMirrors: true });
  assert.equal(forced.includeMirrors, false);
});

const base = {
  serverStatus: "active",
  serverVisibility: "external",
  toolEnabled: true,
  reviewStatus: "approved",
  bindingEnabled: true,
  consumer: "external_api",
};

test("ابزار فقط با سرور فعال + روشن + تأییدشده + بستن روشن مؤثر است", () => {
  assert.equal(isToolEffective(base), true);
  assert.equal(isToolEffective({ ...base, serverStatus: "disabled" }), false);
  assert.equal(isToolEffective({ ...base, toolEnabled: false }), false);
  assert.equal(isToolEffective({ ...base, reviewStatus: "unreviewed" }), false);
  assert.equal(isToolEffective({ ...base, bindingEnabled: false }), false);
  assert.equal(isToolEffective({ ...base, bindingEnabled: null }), true);
});

test("سرور داخلی (مخاطب) هرگز در بستن بیرونی مؤثر نیست", () => {
  assert.equal(isToolEffective({ ...base, serverVisibility: "internal" }), false);
  assert.equal(isToolEffective({ ...base, serverVisibility: "internal", consumer: "home_chat" }), true);
});

test("نام ابزار و نام عمومیِ بدون برخورد درست ساخته می‌شود", () => {
  assert.equal(isValidMcpName("search_knowledge"), true);
  assert.equal(isValidMcpName("bad name!"), false);
  const counts = new Map([["search", 2], ["list", 1]]);
  assert.equal(publicToolName("knowledge", "search", counts), "knowledge__search");
  assert.equal(publicToolName("knowledge", "list", counts), "list");
});

test("ویرایشگر ساختاری پارامتر: رفت‌وبرگشت اسکیما/پیش‌فرض/سقف سالم است", async () => {
  const { paramsFromSchema, schemaFromParams } = await import("./service-types.ts");
  const rows = paramsFromSchema(
    {
      type: "object",
      properties: {
        query: { type: "string", description: "پرسش" },
        limit: { type: "number" },
        mode: { type: "string", enum: ["a", "b"] },
      },
      required: ["query"],
    },
    { limit: 4 },
    { limit: 8 },
  );
  assert.equal(rows.length, 3);
  assert.equal(rows[0].required, true);
  assert.equal(rows[1].defaultText, "4");
  assert.equal(rows[1].capText, "8");
  assert.equal(rows[2].enumText, "a, b");

  const edited = rows.map((r) => (r.name === "limit" ? { ...r, defaultText: "6", capText: "10" } : r));
  const built = schemaFromParams(edited, { type: "object" }, {}, {});
  assert.equal(built.defaults.limit, 6);
  assert.equal(built.caps.limit, 10);
  assert.deepEqual(built.inputSchema.required, ["query"]);
  assert.deepEqual(built.inputSchema.properties.mode.enum, ["a", "b"]);
});
