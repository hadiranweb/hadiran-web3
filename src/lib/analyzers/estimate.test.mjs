/**
 * تخمین زمان آزمون از ساختار pack — نه متن ثابت.
 * اجرا: node --import tsx --test src/lib/analyzers/estimate.test.mjs
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import { estimateLabelFa, estimatePack } from "./estimate.ts";

const range = (id) => ({ kind: "range", id, text: "x", reverse: false, anchors: { 0: "", 5: "", 10: "" } });
const text = (id) => ({ kind: "text", id, text: "x", maxLength: 200 });
const choice = (id) => ({ kind: "choice", id, text: "x", options: [{ value: "a", label: "الف" }] });

test("شمارش پرسش و بخش از ساختار می‌آید", () => {
  const estimate = estimatePack([
    { items: [range("a"), range("b")] },
    { items: [text("c"), choice("d")] },
  ]);
  assert.equal(estimate.questionCount, 4);
  assert.equal(estimate.sectionCount, 2);
  assert.ok(estimate.minutes >= 1);
});

test("بخش خالی معرفی حساب نمی‌شود و آزمون خالی صفر می‌دهد", () => {
  const empty = estimatePack([{ items: [] }]);
  assert.equal(empty.minutes, 0);
  assert.equal(estimateLabelFa(empty.minutes), "زمان نامشخص");
});

test("پاسخ متنی از مقیاس کندتر است", () => {
  const fast = estimatePack([{ items: [range("a"), range("b"), range("c"), range("d")] }]);
  const slow = estimatePack([{ items: [text("a"), text("b"), text("c"), text("d")] }]);
  assert.ok(slow.minutes >= fast.minutes);
});

test("برچسب فارسی عدد را با رقم فارسی می‌نویسد", () => {
  assert.match(estimateLabelFa(11), /۱۱/);
});
