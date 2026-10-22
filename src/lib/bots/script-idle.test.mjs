/**
 * «ده دقیقه» نباید متن ثابت باشد: مدت بی‌فعالیتی از script خوانده می‌شود.
 * اجرا: node --import tsx --test src/lib/bots/script-idle.test.mjs
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import { BOT_IDLE_MINUTES_MAX, BOT_IDLE_MINUTES_MIN, defaultScript, parseBotScript, parseIdleMinutes } from "./script.ts";

test("مقدار پیش‌فرض ۱۰ است ولی از script خوانده می‌شود", () => {
  assert.equal(defaultScript("analyzers").idleMinutes, 10);
  assert.equal(parseBotScript({ idleMinutes: 25 }).idleMinutes, 25);
  assert.equal(parseBotScript({ idleMinutes: "45" }).idleMinutes, 45);
});

test("مقدار بیرون بازه و نامعتبر به پیش‌فرض/بازه برمی‌گردد", () => {
  assert.equal(parseIdleMinutes(0), BOT_IDLE_MINUTES_MIN);
  assert.equal(parseIdleMinutes(99999), BOT_IDLE_MINUTES_MAX);
  assert.equal(parseIdleMinutes("abc"), 10);
  assert.equal(parseIdleMinutes(null), 10);
  assert.equal(parseIdleMinutes(3.6), 4);
});

test("سرویس سفارشی هم همان مقدار را نگه می‌دارد", () => {
  assert.equal(parseBotScript({ service: "custom", idleMinutes: 30 }).idleMinutes, 30);
});
