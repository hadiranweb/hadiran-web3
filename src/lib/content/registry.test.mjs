/**
 * تست خالصِ ادغام متن و fallback.
 * اجرا: node --import tsx --test src/lib/content/registry.test.mjs
 * (رجیستری TypeScript است؛ tsx بارگذاری می‌کند و DB لازم ندارد.)
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import {
  applyOverrides,
  COPY_FIELDS,
  DEFAULT_COPY,
  FIELD_BY_KEY,
  normalizeCopyValue,
} from "./registry.ts";

test("پیش‌فرض‌ها خوانا و بدون کلید تکراری‌اند", () => {
  assert.ok(COPY_FIELDS.length >= 45);
  const keys = new Set(COPY_FIELDS.map((field) => field.key));
  assert.equal(keys.size, COPY_FIELDS.length);
});

test("override منتشرشده روی پیش‌فرض می‌نشیند", () => {
  const next = applyOverrides(DEFAULT_COPY, { "voice.slogan": "شعار تازه" });
  assert.equal(next.voice.slogan, "شعار تازه");
  assert.equal(DEFAULT_COPY.voice.slogan, "مسئله‌ات را بگو؛ با هم شفافش می‌کنیم");
});

test("کلید ناشناخته و مقدار خالی نادیده گرفته می‌شوند", () => {
  const next = applyOverrides(DEFAULT_COPY, { "voice.unknown": "x", "voice.slogan": "   " });
  assert.equal(next.voice.slogan, DEFAULT_COPY.voice.slogan);
});

test("HTML و متن بلندتر از سقف رد می‌شوند", () => {
  const field = FIELD_BY_KEY.get("voice.distinction");
  assert.equal(normalizeCopyValue(field, "<b>سلام</b>").ok, false);
  assert.equal(normalizeCopyValue(field, "ا".repeat(field.maxLength + 1)).ok, false);
  assert.equal(normalizeCopyValue(field, "  متن ساده  ").value, "متن ساده");
});

test("مقدار خراب در DB صفحه را خراب نمی‌کند", () => {
  const next = applyOverrides(DEFAULT_COPY, { "person.intro.2": "<script>x</script>" });
  assert.equal(next.personCopy.intro[1], DEFAULT_COPY.personCopy.intro[1]);
});

test("آرایه‌ها درست هدف می‌گیرند و پیش‌فرض mutate نمی‌شود", () => {
  const next = applyOverrides(DEFAULT_COPY, { "home.steps.3.title": "گام سوم تازه" });
  assert.equal(next.homeFlow.steps[2].title, "گام سوم تازه");
  assert.equal(DEFAULT_COPY.homeFlow.steps[2].title, "انتخاب ظرف");
  assert.notEqual(next.homeFlow.steps, DEFAULT_COPY.homeFlow.steps);
});
