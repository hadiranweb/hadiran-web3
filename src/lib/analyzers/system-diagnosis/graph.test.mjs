import assert from "node:assert/strict";
import { test } from "node:test";

test("کدینگ ده‌محوری: تبدیل رفت‌وبرگشت شناسه‌ها", async () => {
  const { toCanonicalCode, fromCanonicalCode } = await import("./coding-causal-graph.ts");
  assert.equal(toCanonicalCode("L1-K1"), "KW.L1.K1");
  assert.equal(toCanonicalCode("layer-foundation"), "LYR.L1");
  assert.equal(toCanonicalCode("FL.L5.Q4"), "ITM.FL.L5.Q4");
  assert.equal(fromCanonicalCode("KW.L5.K3"), "L5-K3");
  assert.equal(fromCanonicalCode(toCanonicalCode("L3-K2")), "L3-K2");
});

test("موتور علّی: پروفایل هر ۱۵ کلیدواژه با مؤثریت/متأثریت و ربع MICMAC ساخته می‌شود", async () => {
  const { buildCanonicalKeywordCausalProfiles, CAUSAL_KEYWORD_EDGES } = await import("./coding-causal-graph.ts");
  assert.ok(CAUSAL_KEYWORD_EDGES.length >= 20, "causal edges exist");
  const profiles = buildCanonicalKeywordCausalProfiles({});
  const ids = Object.keys(profiles);
  assert.equal(ids.length, 15);
  for (const id of ids) {
    const p = profiles[id];
    assert.ok(Number.isFinite(p.drivingPower) && Number.isFinite(p.dependencePower), id);
    assert.ok(["independent_driver", "linkage_lever", "dependent_outcome", "autonomous"].includes(p.micmacQuadrant), id);
    assert.ok(p.ismLevel >= 1 && p.ismLevel <= 5, id);
  }
});

test("گزارش: هستی‌شناسی و گراف علّی پاسخ‌دهنده روی خروجی می‌نشیند و تلهٔ معلول‌درمانی را می‌گیرد", async () => {
  const { codePacks } = await import("@/lib/analyzers/registry.ts");
  const { buildDiagnosisReport } = await import("./report.ts");
  const sd = codePacks().find((p) => p.slug === "system-diagnosis");
  const rangeIds = sd.sections.flatMap((s) => s.items.filter((i) => i.kind === "range").map((i) => i.id));
  const answers = {};
  // همه‌چیز ضعیف: هم مؤثرهای بالادستی هم متأثرهای پایین‌دستی
  for (const id of rangeIds) {
    const item = sd.sections.flatMap((s) => s.items).find((i) => i.id === id);
    answers[id] = item.reverse ? 9 : 1;
  }
  const report = buildDiagnosisReport(sd, answers, null);
  assert.ok(report.ontology?.dominantRummlerLevel, "ontology diagnosis present");
  assert.ok((report.ontology?.activatedSources?.length ?? 0) > 0, "research sources activated");
  assert.ok(report.causalGraph?.nodes?.length === 15, "causal nodes for all keywords");
  assert.ok(Array.isArray(report.causalGraph?.interventionWaves), "intervention waves present");
  const kw = report.layers.flatMap((l) => l.keywords).find((k) => k.id === "L1-K1");
  assert.equal(kw.canonicalCode, "KW.L1.K1");
  assert.ok((kw.sourceIds?.length ?? 0) > 0, "keyword linked to sources");
});
