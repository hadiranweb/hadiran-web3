import test from "node:test";
import assert from "node:assert/strict";

function answersFor(pack) {
  const answers = { "BIZ.1": "کسب‌وکار نمونه", "BIZ.2": "service", "BIZ.4": "6-20", "BIZ.6": "3-5" };
  for (const section of pack.sections) {
    for (const item of section.items) {
      if (item.kind === "range") answers[item.id] = item.reverse ? 8 : 2;
      else if (item.kind === "choice") answers[item.id] = item.options[0]?.value ?? "";
    }
  }
  return answers;
}

test("گزارش تاریخی با پیکربندی، نسخه، قالب و تمام داده‌های رندرشده از تغییر بعدی pack مستقل می‌ماند", async () => {
  const { codePacks } = await import("@/lib/analyzers/registry.ts");
  const { scorePack } = await import("@/lib/analyzers/score.ts");
  const { buildInterpretationDocument } = await import("@/lib/analyzers/document-model.ts");
  const { resolveDocumentTemplateId } = await import("@/lib/analyzers/document-templates.ts");
  const {
    createReportConfigSnapshot,
    parseInterpretationDocumentSnapshot,
    serializeInterpretationDocument,
  } = await import("./report-snapshot.ts");

  const originalPack = codePacks().find((pack) => pack.slug === "system-diagnosis");
  const answers = answersFor(originalPack);
  const scores = scorePack(originalPack, answers);
  const row = {
    attemptId: 731,
    publicCode: "12345678",
    nameFa: "پاسخ‌دهنده",
    phone: "",
    status: "submitted",
    instrumentVersion: originalPack.version,
    submittedAt: "2026-01-02T03:04:05.000Z",
    updatedAt: null,
    businessName: "کسب‌وکار نمونه",
    referrerPublicCode: null,
    discountCode: null,
    documentId: null,
    gate: null,
    scores: [],
    answers: [],
    rawAnswers: answers,
    rawResults: scores,
  };
  const generated = buildInterpretationDocument(originalPack, row, "system-diagnosis");
  const expectedDocument = structuredClone(generated);
  const documentSnapshot = serializeInterpretationDocument(generated);
  const configSnapshot = createReportConfigSnapshot(originalPack, "system-diagnosis", 42);

  const editedPack = structuredClone(originalPack);
  editedPack.nameFa = "نسخهٔ ویرایش‌شده";
  editedPack.report.closingFa = "متن تازه نباید وارد سند قبلی شود.";
  editedPack.report.documentTemplateId = "hadiran";
  assert.equal(resolveDocumentTemplateId(editedPack), "hadiran");
  const editedDoc = buildInterpretationDocument(editedPack, row, "system-diagnosis");
  assert.notDeepEqual(editedDoc, expectedDocument);

  const restored = parseInterpretationDocumentSnapshot(documentSnapshot);
  assert.deepEqual(restored, expectedDocument);
  assert.equal(restored.version, originalPack.version);
  assert.equal(restored.templateId, "system-diagnosis");
  assert.ok(restored.deepDive, "renderer-only deep-dive payload is preserved");
  assert.ok(restored.causalGraph, "renderer-only causal graph is preserved");

  assert.equal(configSnapshot.format, "hadiran.report-config.v1");
  assert.equal(configSnapshot.packVersionId, 42);
  assert.equal(configSnapshot.instrumentVersion, originalPack.version);
  assert.equal(configSnapshot.templateId, "system-diagnosis");
  assert.equal(configSnapshot.reportConfig.closingFa, originalPack.report.closingFa);
  assert.notEqual(configSnapshot.reportConfig.closingFa, editedPack.report.closingFa);
  assert.equal(parseInterpretationDocumentSnapshot({ packNameFa: "خراب" }), null);
});
