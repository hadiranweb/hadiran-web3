import test from "node:test";
import assert from "node:assert/strict";

async function mapper() {
  return import("./relational-mapper.ts");
}

async function roundTrip(pack) {
  const { packToRelationalRows, relationalRowsToPack } = await mapper();
  const rows = packToRelationalRows(pack);
  assert.deepEqual(rows.content.issues, [], `${pack.slug} should be fully representable`);
  return {
    rows,
    pack: relationalRowsToPack({ id: 1, lifecycleState: "published", ...rows.version }, pack.status, rows.content),
  };
}

test("mapper round-trips manager seeds without losing scoring behavior or graph edges", async () => {
  const { buildMindsetAuthoredPack } = await import("./mindset-gate/authored-pack.ts");
  const { buildSystemDiagnosisAuthoredPack } = await import("./system-diagnosis/authored-pack.ts");
  const { itemsOf } = await import("./pack.ts");
  const { scorePack } = await import("./score.ts");

  for (const build of [buildMindsetAuthoredPack, buildSystemDiagnosisAuthoredPack]) {
    const source = build();
    const { rows, pack: restored } = await roundTrip(source);
    assert.equal(restored.slug, source.slug);
    assert.equal(restored.version, source.version);
    assert.equal(restored.sections.length, source.sections.length);
    assert.equal(restored.edges.length, source.edges.length);
    assert.equal(restored.formulas.length, source.formulas.length);
    assert.equal(rows.content.questions.length, itemsOf(source).length);

    const answers = Object.fromEntries(itemsOf(source).map((item) => [
      item.id,
      item.kind === "range" ? 7 : item.kind === "choice" ? item.options[0]?.value ?? "" : "پاسخ نمونه",
    ]));
    assert.deepEqual(scorePack(restored, answers), scorePack(source, answers), source.slug);
  }
});

test("mapper preserves separate response rules/effects and report references", async () => {
  const { blankPack } = await import("./sanitize.ts");
  const source = blankPack("relational-roundtrip", "آزمون چنداثری");
  source.sections = [{
    id: "section-main",
    titleFa: "بخش اصلی",
    role: "core",
    items: [
      { kind: "choice", id: "q-choice", text: "کدام گزینه؟", options: [{ value: "yes", label: "بله" }, { value: "no", label: "خیر" }] },
      { kind: "range", id: "q-range", text: "چقدر؟", reverse: false, anchors: { 0: "کم", 5: "میانه", 10: "زیاد" } },
    ],
  }];
  source.parameters = [
    { id: "trait-a", labelFa: "بُعد الف", valueKind: "numeric", minValue: 0, maxValue: 10 },
    { id: "trait-b", labelFa: "بُعد ب", valueKind: "numeric" },
  ];
  source.responseRules = [
    { id: "yes-rule", questionId: "q-choice", matchKind: "option", optionValue: "yes", labelFa: "پاسخ بله" },
    { id: "high-range", questionId: "q-range", matchKind: "numeric_range", rangeMin: 7, minInclusive: true },
  ];
  source.responseEffects = [
    { id: "effect-a", questionId: "q-choice", ruleId: "yes-rule", parameterId: "trait-a", operation: "add", value: 2 },
    { id: "effect-b", questionId: "q-choice", ruleId: "yes-rule", parameterId: "trait-b", operation: "add", value: 3 },
    { id: "effect-c", questionId: "q-range", ruleId: "high-range", parameterId: "trait-a", operation: "set_value", value: 9 },
  ];
  source.edges = [
    { from: "q-choice", to: "trait-a", weight: 1, transform: "identity" },
    { from: "q-range", to: "trait-b", weight: 2, transform: "reverse" },
  ];
  source.formulas = [{ id: "total", op: "sum", of: ["q-range"] }];
  source.report = {
    businessNameItemId: "q-choice",
    contextFields: [{ id: "q-range", labelFa: "زمینه" }],
    layerBands: [{ id: "low", labelFa: "پایین", meaningFa: "پایین", min: 0, max: 4, maxInclusive: false }],
    crossPatterns: [{
      id: "pattern-a",
      meaningFa: "الگو",
      actionFa: "اقدام",
      when: { strong: "trait-a", weak: "trait-b", alsoWeak: null, weakAny: ["trait-b"] },
    }],
  };

  const { sanitizePack } = await import("./sanitize.ts");
  const clean = sanitizePack(source, source.slug);
  assert.equal(clean.ok, true);
  const expected = clean.pack;
  const { pack: restored, rows } = await roundTrip(expected);
  assert.equal(rows.content.responseRules.length, 2);
  assert.equal(rows.content.responseEffects.length, 3);
  assert.equal(rows.content.parameters.length, 4); // پارامترهای صریح، خروجی فرمول و بُعد بخش
  assert.deepEqual(restored.responseRules, [
    expected.responseRules[0],
    { ...expected.responseRules[1], minInclusive: true, maxInclusive: true },
  ]);
  assert.deepEqual(restored.responseEffects, expected.responseEffects);
  assert.deepEqual(restored.edges, expected.edges);
  assert.deepEqual(restored.formulas, expected.formulas);
  assert.deepEqual(restored.report, expected.report);
});

test("mapper supports keyword-origin graph edges without flattening them to question edges", async () => {
  const { packToRelationalRows, relationalRowsToPack } = await mapper();
  const { blankPack } = await import("./sanitize.ts");
  const source = blankPack("keyword-graph", "گراف واژه‌ها");
  source.sections = [{
    id: "layer-a",
    titleFa: "لایه",
    items: [{ kind: "range", id: "q-a", text: "پرسش", reverse: false, anchors: { 0: "کم", 5: "میانه", 10: "زیاد" } }],
  }];
  source.keywords = [{ id: "keyword-a", labelFa: "واژه" }];
  source.edges = [
    { from: "q-a", to: "keyword-a", weight: 1, transform: "identity" },
    { from: "keyword-a", to: "layer-a", weight: 1, transform: "identity" },
  ];
  const rows = packToRelationalRows(source);
  assert.deepEqual(rows.content.issues, []);
  assert.equal(rows.content.edges[1].sourceKind, "keyword");
  const restored = relationalRowsToPack({ id: 2, lifecycleState: "draft", ...rows.version }, "draft", rows.content);
  assert.deepEqual(restored.edges, source.edges);
});
