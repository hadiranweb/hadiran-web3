import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  analyzerPackAuthoringIssues,
  analyzerPackChoiceOptions,
  analyzerPackEdges,
  analyzerPackFindings,
  analyzerPackFormulaBands,
  analyzerPackFormulaInputs,
  analyzerPackFormulaRules,
  analyzerPackFormulas,
  analyzerPackKeywordChildren,
  analyzerPackKeywords,
  analyzerPackParameters,
  analyzerPackQuestions,
  analyzerPackReleases,
  analyzerPackReportConfigs,
  analyzerPackReportContextFields,
  analyzerPackReportCrossPatterns,
  analyzerPackReportLayerBands,
  analyzerPackReportPatternParameters,
  analyzerPackResponseEffects,
  analyzerPackResponseRules,
  analyzerPackSections,
  analyzerPackVersions,
  analyzerPacks,
} from "@/db/schema";
import type { AnalyzerPack } from "@/lib/analyzers/pack";
import {
  packToRelationalRows,
  relationalRowsToPack,
  type RelationalPackContentRows,
  type RelationalPackVersionData,
} from "@/lib/analyzers/relational-mapper";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type PackRow = typeof analyzerPacks.$inferSelect;
type VersionRow = typeof analyzerPackVersions.$inferSelect;

const AUTHORING_TABLES = [
  "analyzer_pack_versions",
  "analyzer_pack_releases",
  "analyzer_pack_sections",
  "analyzer_pack_questions",
  "analyzer_pack_choice_options",
  "analyzer_pack_parameters",
  "analyzer_pack_response_rules",
  "analyzer_pack_response_effects",
  "analyzer_pack_formulas",
  "analyzer_pack_formula_inputs",
  "analyzer_pack_formula_bands",
  "analyzer_pack_formula_rules",
  "analyzer_pack_findings",
  "analyzer_pack_keywords",
  "analyzer_pack_keyword_children",
  "analyzer_pack_edges",
  "analyzer_pack_report_configs",
  "analyzer_pack_report_context_fields",
  "analyzer_pack_report_layer_bands",
  "analyzer_pack_report_cross_patterns",
  "analyzer_pack_report_pattern_parameters",
  "analyzer_pack_authoring_issues",
];

let relationalSchemaReady = false;

/**
 * The old JSONB path remains available until migration 0038 is present. This is
 * deliberately a probe only: application code must never create or migrate the
 * normalized schema as a side effect of a request.
 */
export async function hasRelationalAuthoringSchema(): Promise<boolean> {
  if (relationalSchemaReady) return true;
  const result = await db.execute(sql`
    SELECT
      NOT EXISTS (
        SELECT 1
        FROM unnest(${AUTHORING_TABLES}::text[]) AS required(name)
        WHERE to_regclass(required.name) IS NULL
      )
      AND EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'analyzer_attempts'
          AND column_name = 'pack_version_id'
      )
      AND EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'analyzer_pack_edges'
          AND column_name = 'source_kind'
      ) AS ready
  `);
  const rows = (result as unknown as { rows?: { ready?: boolean }[] }).rows ?? [];
  const ready = rows[0]?.ready === true;
  if (ready) relationalSchemaReady = true;
  return ready;
}

function emptyContentRows(): RelationalPackContentRows {
  return {
    sections: [], questions: [], choiceOptions: [], parameters: [], responseRules: [], responseEffects: [],
    formulas: [], formulaInputs: [], formulaBands: [], formulaRules: [], findings: [], keywords: [], keywordChildren: [],
    edges: [], reportConfig: null, reportContextFields: [], reportLayerBands: [], reportCrossPatterns: [],
    reportPatternParameters: [], issues: [],
  };
}

async function readContentRows(versionIds: number[]): Promise<Map<number, RelationalPackContentRows>> {
  const contentById = new Map<number, RelationalPackContentRows>();
  for (const id of versionIds) contentById.set(id, emptyContentRows());
  if (!versionIds.length) return contentById;

  const [
    sectionRows,
    questionRows,
    optionRows,
    parameterRows,
    responseRuleRows,
    responseEffectRows,
    formulaRows,
    formulaInputRows,
    formulaBandRows,
    formulaRuleRows,
    findingRows,
    keywordRows,
    keywordChildRows,
    edgeRows,
    reportConfigRows,
    reportContextRows,
    reportLayerBandRows,
    reportCrossPatternRows,
    reportPatternParameterRows,
    issueRows,
  ] = await Promise.all([
    db.select().from(analyzerPackSections).where(inArray(analyzerPackSections.versionId, versionIds)).orderBy(asc(analyzerPackSections.sortOrder)),
    db.select().from(analyzerPackQuestions).where(inArray(analyzerPackQuestions.versionId, versionIds)).orderBy(asc(analyzerPackQuestions.sectionId), asc(analyzerPackQuestions.sortOrder)),
    db.select().from(analyzerPackChoiceOptions).where(inArray(analyzerPackChoiceOptions.versionId, versionIds)).orderBy(asc(analyzerPackChoiceOptions.questionId), asc(analyzerPackChoiceOptions.sortOrder)),
    db.select().from(analyzerPackParameters).where(inArray(analyzerPackParameters.versionId, versionIds)).orderBy(asc(analyzerPackParameters.sortOrder)),
    db.select().from(analyzerPackResponseRules).where(inArray(analyzerPackResponseRules.versionId, versionIds)).orderBy(asc(analyzerPackResponseRules.questionId), asc(analyzerPackResponseRules.sortOrder)),
    db.select().from(analyzerPackResponseEffects).where(inArray(analyzerPackResponseEffects.versionId, versionIds)).orderBy(asc(analyzerPackResponseEffects.sortOrder)),
    db.select().from(analyzerPackFormulas).where(inArray(analyzerPackFormulas.versionId, versionIds)).orderBy(asc(analyzerPackFormulas.sortOrder)),
    db.select().from(analyzerPackFormulaInputs).where(inArray(analyzerPackFormulaInputs.versionId, versionIds)).orderBy(asc(analyzerPackFormulaInputs.formulaId), asc(analyzerPackFormulaInputs.inputKind), asc(analyzerPackFormulaInputs.sortOrder)),
    db.select().from(analyzerPackFormulaBands).where(inArray(analyzerPackFormulaBands.versionId, versionIds)).orderBy(asc(analyzerPackFormulaBands.formulaId), asc(analyzerPackFormulaBands.sortOrder)),
    db.select().from(analyzerPackFormulaRules).where(inArray(analyzerPackFormulaRules.versionId, versionIds)).orderBy(asc(analyzerPackFormulaRules.formulaId), asc(analyzerPackFormulaRules.ruleKind), asc(analyzerPackFormulaRules.sortOrder)),
    db.select().from(analyzerPackFindings).where(inArray(analyzerPackFindings.versionId, versionIds)).orderBy(asc(analyzerPackFindings.sortOrder)),
    db.select().from(analyzerPackKeywords).where(inArray(analyzerPackKeywords.versionId, versionIds)).orderBy(asc(analyzerPackKeywords.sortOrder)),
    db.select().from(analyzerPackKeywordChildren).where(inArray(analyzerPackKeywordChildren.versionId, versionIds)).orderBy(asc(analyzerPackKeywordChildren.keywordId), asc(analyzerPackKeywordChildren.sortOrder)),
    db.select().from(analyzerPackEdges).where(inArray(analyzerPackEdges.versionId, versionIds)).orderBy(asc(analyzerPackEdges.sortOrder)),
    db.select().from(analyzerPackReportConfigs).where(inArray(analyzerPackReportConfigs.versionId, versionIds)),
    db.select().from(analyzerPackReportContextFields).where(inArray(analyzerPackReportContextFields.versionId, versionIds)).orderBy(asc(analyzerPackReportContextFields.sortOrder)),
    db.select().from(analyzerPackReportLayerBands).where(inArray(analyzerPackReportLayerBands.versionId, versionIds)).orderBy(asc(analyzerPackReportLayerBands.sortOrder)),
    db.select().from(analyzerPackReportCrossPatterns).where(inArray(analyzerPackReportCrossPatterns.versionId, versionIds)).orderBy(asc(analyzerPackReportCrossPatterns.sortOrder)),
    db.select().from(analyzerPackReportPatternParameters).where(inArray(analyzerPackReportPatternParameters.versionId, versionIds)).orderBy(asc(analyzerPackReportPatternParameters.sortOrder)),
    db.select().from(analyzerPackAuthoringIssues).where(inArray(analyzerPackAuthoringIssues.versionId, versionIds)),
  ]);

  for (const row of sectionRows) contentById.get(row.versionId)?.sections.push({
    sectionId: row.sectionId, titleFa: row.titleFa, introFa: row.introFa, role: row.role as RelationalPackContentRows["sections"][number]["role"], sortOrder: row.sortOrder,
  });
  for (const row of questionRows) contentById.get(row.versionId)?.questions.push({
    questionId: row.questionId, sectionId: row.sectionId, kind: row.kind as RelationalPackContentRows["questions"][number]["kind"],
    promptFa: row.promptFa, sortOrder: row.sortOrder, required: row.required, reverse: row.reverse, minValue: row.minValue,
    maxValue: row.maxValue, maxLength: row.maxLength, anchors: row.anchors, config: row.config,
  });
  for (const row of optionRows) contentById.get(row.versionId)?.choiceOptions.push({
    questionId: row.questionId, value: row.value, label: row.label, sortOrder: row.sortOrder, config: row.config,
  });
  for (const row of parameterRows) contentById.get(row.versionId)?.parameters.push({
    parameterId: row.parameterId, labelFa: row.labelFa, valueKind: row.valueKind as RelationalPackContentRows["parameters"][number]["valueKind"],
    minValue: row.minValue, maxValue: row.maxValue, unit: row.unit, sortOrder: row.sortOrder, config: row.config,
  });
  for (const row of responseRuleRows) contentById.get(row.versionId)?.responseRules.push({
    questionId: row.questionId, ruleId: row.ruleId, matchKind: row.matchKind as RelationalPackContentRows["responseRules"][number]["matchKind"],
    optionValue: row.optionValue, exactValue: row.exactValue, rangeMin: row.rangeMin, rangeMax: row.rangeMax,
    minInclusive: row.minInclusive, maxInclusive: row.maxInclusive, labelFa: row.labelFa, sortOrder: row.sortOrder, config: row.config,
  });
  for (const row of responseEffectRows) contentById.get(row.versionId)?.responseEffects.push({
    effectId: row.effectId, questionId: row.questionId, ruleId: row.ruleId, parameterId: row.parameterId,
    operation: row.operation as RelationalPackContentRows["responseEffects"][number]["operation"], value: row.value,
    coefficient: row.coefficient, sortOrder: row.sortOrder, config: row.config,
  });
  for (const row of formulaRows) contentById.get(row.versionId)?.formulas.push({
    formulaId: row.formulaId, outputParameterId: row.outputParameterId, operation: row.operation as RelationalPackContentRows["formulas"][number]["operation"],
    divisor: row.divisor, sortOrder: row.sortOrder, config: row.config,
  });
  for (const row of formulaInputRows) contentById.get(row.versionId)?.formulaInputs.push({
    formulaId: row.formulaId, inputKind: row.inputKind as RelationalPackContentRows["formulaInputs"][number]["inputKind"],
    sortOrder: row.sortOrder, sourceKind: row.sourceKind as RelationalPackContentRows["formulaInputs"][number]["sourceKind"],
    questionRef: row.questionRef, parameterRef: row.parameterRef, dimensionParameterId: row.dimensionParameterId, weight: row.weight,
  });
  for (const row of formulaBandRows) contentById.get(row.versionId)?.formulaBands.push({
    formulaId: row.formulaId, bandId: row.bandId, labelFa: row.labelFa, gteValue: row.gteValue, ltValue: row.ltValue,
    lteValue: row.lteValue, sortOrder: row.sortOrder,
  });
  for (const row of formulaRuleRows) contentById.get(row.versionId)?.formulaRules.push({
    formulaId: row.formulaId, ruleKind: row.ruleKind as RelationalPackContentRows["formulaRules"][number]["ruleKind"],
    sortOrder: row.sortOrder, thresholdLte: row.thresholdLte, setValue: row.setValue, fromValue: row.fromValue, toValue: row.toValue,
  });
  for (const row of findingRows) contentById.get(row.versionId)?.findings.push({
    findingId: row.findingId, titleFa: row.titleFa, kind: row.kind as RelationalPackContentRows["findings"][number]["kind"],
    parentFindingId: row.parentFindingId, constructFa: row.constructFa, asIsFa: row.asIsFa, toBeFa: row.toBeFa,
    actionsFa: row.actionsFa, sortOrder: row.sortOrder,
  });
  for (const row of keywordRows) contentById.get(row.versionId)?.keywords.push({ keywordId: row.keywordId, labelFa: row.labelFa, sortOrder: row.sortOrder });
  for (const row of keywordChildRows) contentById.get(row.versionId)?.keywordChildren.push({ keywordId: row.keywordId, sortOrder: row.sortOrder, labelFa: row.labelFa });
  for (const row of edgeRows) contentById.get(row.versionId)?.edges.push({
    sourceKind: row.sourceKind as RelationalPackContentRows["edges"][number]["sourceKind"],
    sourceQuestionId: row.sourceQuestionId, sourceParameterId: row.sourceParameterId,
    sourceKeywordId: row.sourceKeywordId, sourceFindingId: row.sourceFindingId,
    targetKind: row.targetKind as RelationalPackContentRows["edges"][number]["targetKind"],
    targetParameterId: row.targetParameterId, targetKeywordId: row.targetKeywordId, targetFindingId: row.targetFindingId,
    weight: row.weight, transform: row.transform as RelationalPackContentRows["edges"][number]["transform"], sortOrder: row.sortOrder,
  });
  for (const row of reportConfigRows) {
    const content = contentById.get(row.versionId);
    if (content) content.reportConfig = {
      hideGateScores: row.hideGateScores, interpretationVersion: row.interpretationVersion, closingFa: row.closingFa,
      userSummaryTemplateFa: row.userSummaryTemplateFa, documentTemplateId: row.documentTemplateId,
      businessNameQuestionId: row.businessNameQuestionId,
    };
  }
  for (const row of reportContextRows) contentById.get(row.versionId)?.reportContextFields.push({
    fieldId: row.fieldId, questionId: row.questionId, labelFa: row.labelFa, sortOrder: row.sortOrder,
  });
  for (const row of reportLayerBandRows) contentById.get(row.versionId)?.reportLayerBands.push({
    bandId: row.bandId, parameterId: row.parameterId, labelFa: row.labelFa, meaningFa: row.meaningFa,
    minValue: row.minValue, maxValue: row.maxValue, maxInclusive: row.maxInclusive, sortOrder: row.sortOrder,
  });
  for (const row of reportCrossPatternRows) contentById.get(row.versionId)?.reportCrossPatterns.push({
    patternId: row.patternId, meaningFa: row.meaningFa, actionFa: row.actionFa, strongParameterId: row.strongParameterId,
    weakParameterId: row.weakParameterId, alsoWeakParameterId: row.alsoWeakParameterId, sortOrder: row.sortOrder,
  });
  for (const row of reportPatternParameterRows) contentById.get(row.versionId)?.reportPatternParameters.push({
    patternId: row.patternId, parameterId: row.parameterId, sortOrder: row.sortOrder,
  });
  for (const row of issueRows) contentById.get(row.versionId)?.issues.push({
    component: row.component, entityId: row.entityId, issueCode: row.issueCode, detail: row.detail,
  });
  return contentById;
}

function normalizedVersion(row: VersionRow): RelationalPackVersionData {
  return {
    id: row.id,
    packSlug: row.packSlug,
    version: row.version,
    lifecycleState: row.lifecycleState as RelationalPackVersionData["lifecycleState"],
    nameFa: row.nameFa,
    summaryFa: row.summaryFa,
    scaleConfig: row.scaleConfig,
    consentConfig: row.consentConfig,
    botDisplayConfig: row.botDisplayConfig,
  };
}

function legacyProjection(row: PackRow): AnalyzerPack | null {
  const pack = row.pack;
  if (!pack || typeof pack !== "object") return null;
  return { ...pack, slug: row.slug, status: row.status as AnalyzerPack["status"] };
}

function preferredVersion(row: PackRow, versions: VersionRow[], releases: Map<string, number>): VersionRow | null {
  const candidates = versions.filter((version) => version.packSlug === row.slug);
  if (row.status === "open") {
    const releaseId = releases.get(row.slug);
    return candidates.find((version) => version.id === releaseId) ?? null;
  }
  return candidates.find((version) => version.lifecycleState === "draft") ?? candidates[0] ?? null;
}

export async function readAuthoredPacksFromRelational(rows: PackRow[]): Promise<Map<string, AnalyzerPack>> {
  const output = new Map<string, AnalyzerPack>();
  const slugs = [...new Set(rows.map((row) => row.slug))];
  if (!slugs.length) return output;
  const [versions, releases] = await Promise.all([
    db.select().from(analyzerPackVersions).where(inArray(analyzerPackVersions.packSlug, slugs)).orderBy(desc(analyzerPackVersions.createdAt), desc(analyzerPackVersions.id)),
    db.select().from(analyzerPackReleases).where(inArray(analyzerPackReleases.packSlug, slugs)),
  ]);
  const releaseIds = new Map(releases.map((release) => [release.packSlug, release.versionId]));
  const selected = rows.map((row) => ({ row, version: preferredVersion(row, versions, releaseIds) }));
  const contentById = await readContentRows(selected.flatMap((item) => item.version ? [item.version.id] : []));

  for (const { row, version } of selected) {
    if (!version) {
      const fallback = legacyProjection(row);
      if (fallback) output.set(row.slug, fallback);
      continue;
    }
    const content = contentById.get(version.id);
    if (!content || content.issues.length) {
      const fallback = legacyProjection(row);
      if (fallback) output.set(row.slug, fallback);
      continue;
    }
    const pack = relationalRowsToPack(normalizedVersion(version), row.status as AnalyzerPack["status"], content);
    output.set(row.slug, pack);
  }
  return output;
}

export async function readAuthoredPackVersion(versionId: number): Promise<AnalyzerPack | null> {
  if (!Number.isInteger(versionId) || versionId <= 0) return null;
  const [version] = await db.select().from(analyzerPackVersions).where(eq(analyzerPackVersions.id, versionId)).limit(1);
  if (!version) return null;
  const content = (await readContentRows([versionId])).get(versionId);
  if (!content || content.issues.length) return null;
  const [stable] = await db.select({ status: analyzerPacks.status }).from(analyzerPacks).where(eq(analyzerPacks.slug, version.packSlug)).limit(1);
  const status = (stable?.status ?? (version.lifecycleState === "published" ? "open" : "draft")) as AnalyzerPack["status"];
  return relationalRowsToPack(normalizedVersion(version), status, content);
}

function chooseUniqueVersion(desired: string, versions: { id: number; version: string }[], excludeId?: number): string {
  const used = new Set(versions.filter((row) => row.id !== excludeId).map((row) => row.version));
  if (!used.has(desired)) return desired;
  let revision = 2;
  while (revision < 100_000) {
    const suffix = `-r${revision}`;
    const candidate = `${desired.slice(0, 64 - suffix.length)}${suffix}`;
    if (!used.has(candidate)) return candidate;
    revision += 1;
  }
  throw new Error("analyzer_pack_version_space_exhausted");
}

async function insertContentRows(tx: Tx, versionId: number, content: RelationalPackContentRows) {
  if (content.sections.length) await tx.insert(analyzerPackSections).values(content.sections.map((row) => ({ ...row, versionId })));
  if (content.questions.length) await tx.insert(analyzerPackQuestions).values(content.questions.map((row) => ({ ...row, versionId })));
  if (content.choiceOptions.length) await tx.insert(analyzerPackChoiceOptions).values(content.choiceOptions.map((row) => ({ ...row, versionId })));
  if (content.parameters.length) await tx.insert(analyzerPackParameters).values(content.parameters.map((row) => ({ ...row, versionId })));
  if (content.responseRules.length) await tx.insert(analyzerPackResponseRules).values(content.responseRules.map((row) => ({ ...row, versionId })));
  if (content.findings.length) {
    await tx.insert(analyzerPackFindings).values(content.findings.map((row) => ({ ...row, versionId, parentFindingId: null })));
    for (const finding of content.findings) {
      if (finding.parentFindingId) {
        await tx.update(analyzerPackFindings)
          .set({ parentFindingId: finding.parentFindingId })
          .where(and(eq(analyzerPackFindings.versionId, versionId), eq(analyzerPackFindings.findingId, finding.findingId)));
      }
    }
  }
  if (content.keywords.length) await tx.insert(analyzerPackKeywords).values(content.keywords.map((row) => ({ ...row, versionId })));
  if (content.keywordChildren.length) await tx.insert(analyzerPackKeywordChildren).values(content.keywordChildren.map((row) => ({ ...row, versionId })));
  if (content.formulas.length) await tx.insert(analyzerPackFormulas).values(content.formulas.map((row) => ({ ...row, versionId })));
  if (content.formulaInputs.length) await tx.insert(analyzerPackFormulaInputs).values(content.formulaInputs.map((row) => ({ ...row, versionId })));
  if (content.formulaBands.length) await tx.insert(analyzerPackFormulaBands).values(content.formulaBands.map((row) => ({ ...row, versionId })));
  if (content.formulaRules.length) await tx.insert(analyzerPackFormulaRules).values(content.formulaRules.map((row) => ({ ...row, versionId })));
  if (content.responseEffects.length) await tx.insert(analyzerPackResponseEffects).values(content.responseEffects.map((row) => ({ ...row, versionId })));
  if (content.edges.length) await tx.insert(analyzerPackEdges).values(content.edges.map((row) => ({ ...row, versionId })));
  if (content.reportConfig) await tx.insert(analyzerPackReportConfigs).values({ ...content.reportConfig, versionId, config: {} });
  if (content.reportContextFields.length) await tx.insert(analyzerPackReportContextFields).values(content.reportContextFields.map((row) => ({ ...row, versionId })));
  if (content.reportLayerBands.length) await tx.insert(analyzerPackReportLayerBands).values(content.reportLayerBands.map((row) => ({ ...row, versionId })));
  if (content.reportCrossPatterns.length) await tx.insert(analyzerPackReportCrossPatterns).values(content.reportCrossPatterns.map((row) => ({ ...row, versionId })));
  if (content.reportPatternParameters.length) await tx.insert(analyzerPackReportPatternParameters).values(content.reportPatternParameters.map((row) => ({ ...row, versionId })));
  if (content.issues.length) await tx.insert(analyzerPackAuthoringIssues).values(content.issues.map((row) => ({ ...row, versionId })));
}

async function clearDraftContent(tx: Tx, versionId: number) {
  await tx.delete(analyzerPackAuthoringIssues).where(eq(analyzerPackAuthoringIssues.versionId, versionId));
  await tx.delete(analyzerPackReportPatternParameters).where(eq(analyzerPackReportPatternParameters.versionId, versionId));
  await tx.delete(analyzerPackReportCrossPatterns).where(eq(analyzerPackReportCrossPatterns.versionId, versionId));
  await tx.delete(analyzerPackReportLayerBands).where(eq(analyzerPackReportLayerBands.versionId, versionId));
  await tx.delete(analyzerPackReportContextFields).where(eq(analyzerPackReportContextFields.versionId, versionId));
  await tx.delete(analyzerPackReportConfigs).where(eq(analyzerPackReportConfigs.versionId, versionId));
  await tx.delete(analyzerPackEdges).where(eq(analyzerPackEdges.versionId, versionId));
  await tx.delete(analyzerPackResponseEffects).where(eq(analyzerPackResponseEffects.versionId, versionId));
  await tx.delete(analyzerPackResponseRules).where(eq(analyzerPackResponseRules.versionId, versionId));
  await tx.delete(analyzerPackFormulaRules).where(eq(analyzerPackFormulaRules.versionId, versionId));
  await tx.delete(analyzerPackFormulaBands).where(eq(analyzerPackFormulaBands.versionId, versionId));
  await tx.delete(analyzerPackFormulaInputs).where(eq(analyzerPackFormulaInputs.versionId, versionId));
  await tx.delete(analyzerPackFormulas).where(eq(analyzerPackFormulas.versionId, versionId));
  await tx.update(analyzerPackFindings).set({ parentFindingId: null }).where(eq(analyzerPackFindings.versionId, versionId));
  await tx.delete(analyzerPackFindings).where(eq(analyzerPackFindings.versionId, versionId));
  await tx.delete(analyzerPackKeywordChildren).where(eq(analyzerPackKeywordChildren.versionId, versionId));
  await tx.delete(analyzerPackKeywords).where(eq(analyzerPackKeywords.versionId, versionId));
  await tx.delete(analyzerPackParameters).where(eq(analyzerPackParameters.versionId, versionId));
  await tx.delete(analyzerPackChoiceOptions).where(eq(analyzerPackChoiceOptions.versionId, versionId));
  await tx.delete(analyzerPackQuestions).where(eq(analyzerPackQuestions.versionId, versionId));
  await tx.delete(analyzerPackSections).where(eq(analyzerPackSections.versionId, versionId));
}

async function saveNewVersion(tx: Tx, pack: AnalyzerPack, createdBy: number | null) {
  const [existingVersions, draftRows] = await Promise.all([
    tx.select({ id: analyzerPackVersions.id, version: analyzerPackVersions.version })
      .from(analyzerPackVersions).where(eq(analyzerPackVersions.packSlug, pack.slug)),
    tx.select().from(analyzerPackVersions)
      .where(and(eq(analyzerPackVersions.packSlug, pack.slug), eq(analyzerPackVersions.lifecycleState, "draft")))
      .orderBy(desc(analyzerPackVersions.createdAt), desc(analyzerPackVersions.id)).limit(1).for("update"),
  ]);
  const draft = draftRows[0];
  const uniqueVersion = chooseUniqueVersion(pack.version, existingVersions, draft?.id);
  const effectivePack = uniqueVersion === pack.version ? pack : { ...pack, version: uniqueVersion };
  const mapped = packToRelationalRows(effectivePack);
  let versionId: number;

  if (draft) {
    versionId = draft.id;
    await tx.update(analyzerPackVersions).set({
      version: effectivePack.version,
      nameFa: effectivePack.nameFa,
      summaryFa: effectivePack.summaryFa,
      scaleConfig: effectivePack.scale,
      consentConfig: effectivePack.consent,
      botDisplayConfig: effectivePack.botDisplay ?? null,
      createdBy: createdBy ?? draft.createdBy,
      lifecycleState: "draft",
      publishedAt: null,
    }).where(eq(analyzerPackVersions.id, versionId));
    await clearDraftContent(tx, versionId);
  } else {
    const [inserted] = await tx.insert(analyzerPackVersions).values({
      ...mapped.version,
      lifecycleState: "draft",
      createdBy,
      publishedAt: null,
    }).returning({ id: analyzerPackVersions.id });
    if (!inserted) throw new Error("analyzer_pack_version_create_failed");
    versionId = inserted.id;
  }

  await insertContentRows(tx, versionId, mapped.content);
  const publishable = effectivePack.status === "open" && mapped.content.issues.length === 0;
  if (publishable) {
    const publishedAt = new Date();
    await tx.update(analyzerPackVersions).set({ lifecycleState: "published", publishedAt }).where(eq(analyzerPackVersions.id, versionId));
    await tx.insert(analyzerPackReleases).values({ packSlug: effectivePack.slug, versionId, publishedAt }).onConflictDoUpdate({
      target: analyzerPackReleases.packSlug,
      set: { versionId, publishedAt },
    });
  } else {
    await tx.delete(analyzerPackReleases).where(eq(analyzerPackReleases.packSlug, effectivePack.slug));
  }
  return effectivePack;
}

export async function insertAuthoredPackInTransaction(tx: Tx, pack: AnalyzerPack, createdBy: number | null): Promise<AnalyzerPack> {
  const now = new Date();
  await tx.insert(analyzerPacks).values({
    slug: pack.slug,
    status: pack.status,
    pack,
    createdBy,
    updatedAt: now,
  });
  const storedPack = await saveNewVersion(tx, pack, createdBy);
  if (storedPack !== pack) {
    await tx.update(analyzerPacks).set({ pack: storedPack, status: storedPack.status, updatedAt: now }).where(eq(analyzerPacks.slug, pack.slug));
  }
  return storedPack;
}

export async function updateAuthoredPackRelational(slug: string, pack: AnalyzerPack): Promise<AnalyzerPack> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT slug FROM analyzer_packs WHERE slug = ${slug} FOR UPDATE`);
    const [existing] = await tx.select().from(analyzerPacks).where(eq(analyzerPacks.slug, slug)).limit(1);
    if (!existing) throw new Error("not_found");
    const existingPack = { ...pack, slug };
    const storedPack = await saveNewVersion(tx, existingPack, existing.createdBy);
    await tx.update(analyzerPacks).set({
      status: storedPack.status,
      pack: storedPack,
      updatedAt: new Date(),
    }).where(eq(analyzerPacks.slug, slug));
    return storedPack;
  });
}

/** Freeze a mutable draft before a new attempt binds to it; published snapshots are never rewritten. */
export async function packVersionIdForAttempt(tx: Tx, pack: AnalyzerPack): Promise<number | null> {
  const [version] = pack.packVersionId != null
    ? await tx.select().from(analyzerPackVersions)
      .where(and(eq(analyzerPackVersions.id, pack.packVersionId), eq(analyzerPackVersions.packSlug, pack.slug)))
      .limit(1)
      .for("update")
    : await tx.select().from(analyzerPackVersions)
      .where(and(eq(analyzerPackVersions.packSlug, pack.slug), eq(analyzerPackVersions.version, pack.version)))
      .limit(1)
      .for("update");
  if (!version || version.version !== pack.version) return null;
  if (version.lifecycleState === "published") return version.id;
  const publishedAt = new Date();
  await tx.update(analyzerPackVersions)
    .set({ lifecycleState: "published", publishedAt })
    .where(eq(analyzerPackVersions.id, version.id));
  return version.id;
}
