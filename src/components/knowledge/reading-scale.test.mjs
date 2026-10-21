/**
 * نگهبان رگرسیون: کنترل اندازهٔ متن روی <html> می‌نشیند و نباید داخل
 * .reading-surface بازنویسی شود، وگرنه مقدار محلی، انتخاب کاربر را می‌پوشاند.
 * اجرا: node --test src/components/knowledge/reading-scale.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const css = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");

test("reading-surface مقدار --reading-scale را بازنویسی نمی‌کند", () => {
  const block = css.match(/\.reading-surface\s*\{[^}]*\}/);
  assert.equal(block, null, ".reading-surface باید بدون بلوک اختصاصی بماند");
});

test("اندازه با fallback از متغیر ریشه خوانده می‌شود", () => {
  assert.match(css, /var\(--reading-scale,\s*1\)/);
});

test("هیچ قاعدهٔ دیگری --reading-scale را داخل یک انتخابگر محلی تعریف نمی‌کند", () => {
  const localDeclarations = [...css.matchAll(/([^{}]+)\{[^}]*--reading-scale\s*:[^}]*\}/g)]
    .map((match) => match[1].trim())
    .filter((selector) => !selector.startsWith(":root") && !selector.startsWith("html"));
  assert.deepEqual(localDeclarations, []);
});
