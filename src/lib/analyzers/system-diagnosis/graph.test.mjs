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

test("تعدیل‌گر زمینه: وزن کلیدواژه با اندازهٔ کسب‌وکار عوض می‌شود و در گزارش می‌نشیند", async () => {
  const { parseBusinessContext, contextKeywordWeight } = await import("./context-modulation.ts");
  const solo = parseBusinessContext({ "BIZ.2": "service", "BIZ.4": "solo", "BIZ.6": "1-3" });
  const big = parseBusinessContext({ "BIZ.2": "service", "BIZ.4": "50+", "BIZ.6": "5-10" });
  assert.notEqual(contextKeywordWeight("L1-K2", solo), contextKeywordWeight("L1-K2", big));

  const { codePacks } = await import("@/lib/analyzers/registry.ts");
  const { buildDiagnosisReport } = await import("./report.ts");
  const sd = codePacks().find((p) => p.slug === "system-diagnosis");
  const rangeIds = sd.sections.flatMap((s) => s.items.filter((i) => i.kind === "range").map((i) => i.id));
  const base = { "BIZ.1": "نمونه", "BIZ.2": "service", "BIZ.6": "10+" };
  for (const id of rangeIds) {
    const item = sd.sections.flatMap((s) => s.items).find((i) => i.id === id);
    base[id] = item.reverse ? 8 : 2; // عموماً ضعیف
  }
  const report = buildDiagnosisReport(sd, { ...base, "BIZ.4": "solo" }, null);
  assert.ok(report.contextProfile, "context profile in report");
  const kw = report.layers.flatMap((l) => l.keywords).find((k) => k.id === "L1-K2");
  assert.ok(typeof kw.contextWeight === "number" && typeof kw.contextWeightedDeficit === "number");
});

test("بانک ۸۹ سؤالی و کاوش عمیق تطبیقی: ماژول‌ها از کلیدواژه‌های ضعیف انتخاب و برگهٔ A3 ساخته می‌شود", async () => {
  const { SCR_ITEMS, DIAG_DIMENSIONS, selectAdaptiveDeepDiveModules, buildA3ActionSheet } = await import("./deep-dive-a3.ts");
  assert.equal(SCR_ITEMS.length, 15);
  assert.equal(DIAG_DIMENSIONS.length, 9);
  assert.equal(DIAG_DIMENSIONS.reduce((n, d) => n + d.items.length, 0), 54);

  const { codePacks } = await import("@/lib/analyzers/registry.ts");
  const { buildDiagnosisReport } = await import("./report.ts");
  const sd = codePacks().find((p) => p.slug === "system-diagnosis");
  const rangeIds = sd.sections.flatMap((s) => s.items.filter((i) => i.kind === "range").map((i) => i.id));
  const answers = { "BIZ.1": "نمونه", "BIZ.2": "service", "BIZ.4": "6-20", "BIZ.6": "3-5" };
  for (const id of rangeIds) {
    const item = sd.sections.flatMap((s) => s.items).find((i) => i.id === id);
    answers[id] = item.reverse ? 8 : 2;
  }
  const report = buildDiagnosisReport(sd, answers, null);
  assert.ok(report.deepDive, "deep dive in report");
  assert.equal(report.deepDive.totalBankItemsCount, 89);
  assert.ok(report.deepDive.recommendedModules.length >= 1, "adaptive modules chosen");
  assert.ok(report.deepDive.a3Sheet, "A3 sheet built");
  const modules = selectAdaptiveDeepDiveModules(report.layers.flatMap((l) => l.keywords), answers, 2);
  assert.ok(modules.every((m) => m.items.length > 0), "modules carry items");
});

test("سند: قالب مخصوص منظومه با امتیاز کلیدواژه، موج مداخله و برگهٔ A3 رندر می‌شود", async () => {
  const { codePacks } = await import("@/lib/analyzers/registry.ts");
  const { buildInterpretationDocument } = await import("@/lib/analyzers/document-model.ts");
  const { renderChromeDocument } = await import("@/lib/analyzers/document-chrome.ts");
  const { defaultChrome } = await import("@/lib/analyzers/document-templates-store.ts");
  const { resolveDocumentTemplateId, templatesForPack } = await import("@/lib/analyzers/document-templates.ts");

  const sd = codePacks().find((p) => p.slug === "system-diagnosis");
  assert.ok(templatesForPack(sd).some((t) => t.id === "system-diagnosis"), "template offered for pack");
  assert.equal(resolveDocumentTemplateId(sd), "system-diagnosis");

  const rangeIds = sd.sections.flatMap((s) => s.items.filter((i) => i.kind === "range").map((i) => i.id));
  const rawAnswers = { "BIZ.1": "کسب‌وکار نمونه", "BIZ.2": "service", "BIZ.4": "6-20", "BIZ.6": "3-5" };
  for (const id of rangeIds) {
    const item = sd.sections.flatMap((s) => s.items).find((i) => i.id === id);
    rawAnswers[id] = item.reverse ? 8 : 2;
  }
  const row = {
    attemptId: 1, publicCode: "T-1", nameFa: "آزمون", phone: "", status: "submitted",
    instrumentVersion: sd.version, submittedAt: new Date().toISOString(), updatedAt: null,
    businessName: "کسب‌وکار نمونه", referrerPublicCode: null, discountCode: null,
    documentId: null, gate: null, scores: [], answers: [], rawAnswers, rawResults: null,
  };
  const doc = buildInterpretationDocument(sd, row);
  assert.equal(doc.templateId, "system-diagnosis");
  const { html } = renderChromeDocument(defaultChrome("system-diagnosis"), doc);
  assert.ok(html.includes("از ۲۰"), "keyword/layer scores rendered");
  assert.ok(html.includes("موج"), "intervention waves rendered");
  assert.ok(html.includes("هدف ۳۰ روزه") || html.includes("برگهٔ حل مسئله"), "A3 rendered");
});

test("SSOT: مانیفست کامل است، کاسیو بیرون است و همهٔ منابع ارجاعی در رجیستری وجود دارند", async () => {
  const { getSsotManifestSummary, getCanonicalPackBySlug, buildAllCanonicalPacks, RESEARCH_SOURCES } =
    await import("@/lib/analyzers/ssot-registry.ts");
  const m = getSsotManifestSummary();
  assert.equal(m.counts.totalCanonicalItems, 107);
  assert.deepEqual(m.counts.itemsByTier, { BIZ: 6, FL: 20, SCR: 15, DIAG: 54, MND: 12 });
  assert.equal(m.counts.keywords, 15);
  assert.equal(m.counts.subKeywords, 75);
  assert.ok(m.counts.researchSources >= 30, "research sources present");
  assert.equal(buildAllCanonicalPacks().length, 2);
  assert.equal(getCanonicalPackBySlug("casio-ss"), null);
  assert.equal(getCanonicalPackBySlug("system-diagnosis")?.slug, "system-diagnosis");
  assert.equal(getCanonicalPackBySlug("mindset-gate")?.slug, "mindset-gate");

  // هر منبعی که گزارش به کلیدواژه‌ها چسبانده در رجیستری هست
  const { codePacks } = await import("@/lib/analyzers/registry.ts");
  const { buildDiagnosisReport } = await import("./report.ts");
  const sd = codePacks().find((p) => p.slug === "system-diagnosis");
  const rangeIds = sd.sections.flatMap((s) => s.items.filter((i) => i.kind === "range").map((i) => i.id));
  const answers = {};
  for (const id of rangeIds) answers[id] = 5;
  const report = buildDiagnosisReport(sd, answers, null);
  for (const kw of report.layers.flatMap((l) => l.keywords)) {
    for (const srcId of kw.sourceIds ?? []) assert.ok(RESEARCH_SOURCES[srcId], `missing source ${srcId}`);
  }
});
