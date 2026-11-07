import test from "node:test";
import assert from "node:assert/strict";

async function scoringFixture() {
  const { blankPack, sanitizePack } = await import("./sanitize.ts");
  const raw = blankPack("response-scoring-test", "آزمون چنداثری");
  raw.status = "open";
  raw.sections = [{
    id: "main",
    titleFa: "بخش اصلی",
    role: "core",
    items: [
      {
        kind: "choice",
        id: "q-choice",
        text: "کدام؟",
        options: [{ value: "yes", label: "بله" }, { value: "no", label: "خیر" }],
      },
      {
        kind: "range",
        id: "q-range",
        text: "چقدر؟",
        reverse: false,
        anchors: { 0: "کم", 5: "میانه", 10: "زیاد" },
      },
    ],
  }];
  raw.parameters = [
    { id: "trait-a", labelFa: "بُعد الف", valueKind: "numeric", minValue: -10, maxValue: 20 },
    { id: "trait-b", labelFa: "بُعد ب", valueKind: "numeric", minValue: 0, maxValue: 10 },
    { id: "answer-kind", labelFa: "نوع پاسخ", valueKind: "category" },
  ];
  raw.responseRules = [
    { id: "yes", questionId: "q-choice", matchKind: "option", optionValue: "yes", labelFa: "بله" },
    { id: "no", questionId: "q-choice", matchKind: "option", optionValue: "no", labelFa: "خیر" },
    { id: "high", questionId: "q-range", matchKind: "numeric_range", rangeMin: 8, rangeMax: 10, minInclusive: true, maxInclusive: true },
    { id: "other", questionId: "q-range", matchKind: "fallback", labelFa: "بازهٔ دیگر" },
  ];
  raw.responseEffects = [
    { id: "add-points", questionId: "q-choice", ruleId: "yes", parameterId: "trait-a", operation: "add", value: 2 },
    { id: "multiply-points", questionId: "q-choice", ruleId: "yes", parameterId: "trait-a", operation: "multiply", coefficient: 3 },
    { id: "set-answer-kind", questionId: "q-choice", ruleId: "yes", parameterId: "answer-kind", operation: "set_value", value: "positive" },
    { id: "negative-points", questionId: "q-choice", ruleId: "no", parameterId: "trait-a", operation: "add", value: -1 },
    { id: "negative-kind", questionId: "q-choice", ruleId: "no", parameterId: "answer-kind", operation: "set_value", value: "negative" },
    { id: "high-weight", questionId: "q-range", ruleId: "high", parameterId: "trait-b", operation: "weighted_value", coefficient: 0.5 },
    { id: "other-weight", questionId: "q-range", ruleId: "other", parameterId: "trait-b", operation: "weighted_value", coefficient: 1 },
  ];
  raw.formulas = [{ id: "combined", op: "sum", of: ["trait-a", "trait-b"] }];
  const result = sanitizePack(raw, raw.slug);
  assert.equal(result.ok, true, result.ok ? "" : result.error);
  return result.pack;
}

test("one answer triggers independent effects and formulas can consume the resulting parameters", async () => {
  const { scorePack } = await import("./score.ts");
  const pack = await scoringFixture();
  const result = scorePack(pack, { "q-choice": "yes", "q-range": 8 });
  assert.deepEqual(result.parameters, {
    "trait-a": 6,
    "answer-kind": "positive",
    "trait-b": 4,
  });
  assert.equal(result.scores.combined, 10);
  assert.equal(result.effective["q-range"], 8);
});

test("identity and reverse source operations preserve scalar types and transform numeric answers deterministically", async () => {
  const { sanitizePack } = await import("./sanitize.ts");
  const { scorePack } = await import("./score.ts");
  const pack = await scoringFixture();
  pack.parameters.push(
    { id: "copied-range", labelFa: "مقدار منتقل‌شده", valueKind: "numeric" },
    { id: "reversed-range", labelFa: "مقدار وارونه", valueKind: "numeric" },
    { id: "copied-choice", labelFa: "گزینهٔ منتقل‌شده", valueKind: "category" },
    { id: "flag", labelFa: "پرچم", valueKind: "boolean" },
  );
  pack.responseEffects.push(
    { id: "identity-range", questionId: "q-range", parameterId: "copied-range", operation: "identity" },
    { id: "reverse-range", questionId: "q-range", parameterId: "reversed-range", operation: "reverse" },
    { id: "identity-choice", questionId: "q-choice", ruleId: "yes", parameterId: "copied-choice", operation: "identity" },
    { id: "set-flag", questionId: "q-choice", ruleId: "yes", parameterId: "flag", operation: "set_value", value: true },
  );
  const sanitized = sanitizePack(pack, pack.slug);
  assert.equal(sanitized.ok, true, sanitized.ok ? "" : sanitized.error);

  const result = scorePack(sanitized.pack, { "q-choice": "yes", "q-range": 8 });
  assert.equal(result.parameters["copied-range"], 8);
  assert.equal(result.parameters["reversed-range"], 2);
  assert.equal(result.parameters["copied-choice"], "yes");
  assert.equal(result.parameters.flag, true);
});

test("first matching rule wins; fallback handles remaining values and reverse uses effective score", async () => {
  const { scorePack } = await import("./score.ts");
  const pack = await scoringFixture();
  const low = scorePack(pack, { "q-choice": "no", "q-range": 5 });
  assert.equal(low.parameters["trait-a"], -1);
  assert.equal(low.parameters["trait-b"], 5);
  assert.equal(low.parameters["answer-kind"], "negative");

  const reversed = structuredClone(pack);
  reversed.sections[0].items[1].reverse = true;
  const result = scorePack(reversed, { "q-choice": "yes", "q-range": 8 });
  assert.equal(result.effective["q-range"], 2);
  assert.equal(result.parameters["trait-b"], 1);
});

test("publish validation rejects uncovered options, unseeded multiplication and type mismatches", async () => {
  const { sanitizePack } = await import("./sanitize.ts");
  const { validateResponseScoring } = await import("./response-scoring.ts");
  const pack = await scoringFixture();

  const uncovered = structuredClone(pack);
  uncovered.responseRules = uncovered.responseRules.filter((rule) => rule.id !== "no");
  uncovered.responseEffects = uncovered.responseEffects.filter((effect) => effect.ruleId !== "no");
  assert.match(validateResponseScoring(uncovered, { requireCoverage: true }).join(" "), /پوشش/);
  assert.equal(sanitizePack(uncovered, uncovered.slug).ok, false);

  const unseeded = structuredClone(pack);
  unseeded.responseEffects = unseeded.responseEffects.filter((effect) => effect.id !== "add-points");
  assert.match(validateResponseScoring(unseeded, { requireCoverage: true }).join(" "), /multiply/);

  const invalidType = structuredClone(pack);
  invalidType.responseEffects.find((effect) => effect.id === "set-answer-kind").value = 7;
  assert.match(validateResponseScoring(invalidType, { requireCoverage: true }).join(" "), /نوع پارامتر/);
  assert.equal(sanitizePack(invalidType, invalidType.slug).ok, false);

  const emptySetValue = structuredClone(pack);
  emptySetValue.responseEffects.find((effect) => effect.id === "set-answer-kind").value = "   ";
  assert.equal(sanitizePack(emptySetValue, emptySetValue.slug).ok, false);

  const nonFiniteEffect = structuredClone(pack);
  nonFiniteEffect.responseEffects.find((effect) => effect.id === "add-points").value = Number.POSITIVE_INFINITY;
  assert.equal(sanitizePack(nonFiniteEffect, nonFiniteEffect.slug).ok, false);

  const overflow = structuredClone(pack);
  overflow.responseEffects.find((effect) => effect.id === "multiply-points").coefficient = Number.MAX_VALUE;
  const { scorePack } = await import("./score.ts");
  assert.throws(() => scorePack(overflow, { "q-choice": "yes", "q-range": 8 }), /not finite/);
});

test("unrecognized executable-like operations are rejected rather than evaluated", async () => {
  const { sanitizePack } = await import("./sanitize.ts");
  const pack = await scoringFixture();
  const bad = structuredClone(pack);
  bad.responseEffects[0].operation = "eval";
  assert.equal(sanitizePack(bad, bad.slug).ok, false);
});
