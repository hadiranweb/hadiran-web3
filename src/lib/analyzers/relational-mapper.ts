import { assertPack, type AnalyzerPack, type AnalyzerScale, type Band, type ChoiceItem, type Consent, type Edge, type Finding, type Formula, type Keyword, type PackBotDisplay, type PackReport, type ParameterValueKind, type ResponseEffect, type ResponseEffectOperation, type ResponseRule, type ResponseRuleMatchKind, type ScoringParameter, type Section, type SectionRole } from "@/lib/analyzers/pack";

export type RelationalAuthoringIssue = {
  component: string;
  entityId: string;
  issueCode: string;
  detail: Record<string, unknown>;
};

export type RelationalPackVersionData = {
  id: number;
  packSlug: string;
  version: string;
  lifecycleState: "draft" | "published";
  nameFa: string;
  summaryFa: string;
  scaleConfig: AnalyzerScale;
  consentConfig: Consent;
  botDisplayConfig: PackBotDisplay | null;
};

export type RelationalPackContentRows = {
  sections: { sectionId: string; titleFa: string; introFa: string | null; role: SectionRole | null; sortOrder: number }[];
  questions: {
    questionId: string;
    sectionId: string;
    kind: "range" | "text" | "choice";
    promptFa: string;
    sortOrder: number;
    required: boolean;
    reverse: boolean;
    minValue: number | null;
    maxValue: number | null;
    maxLength: number | null;
    anchors: Record<string, string>;
    config: Record<string, unknown>;
  }[];
  choiceOptions: { questionId: string; value: string; label: string; sortOrder: number; config: Record<string, unknown> }[];
  parameters: {
    parameterId: string;
    labelFa: string;
    valueKind: ParameterValueKind;
    minValue: number | null;
    maxValue: number | null;
    unit: string | null;
    sortOrder: number;
    config: Record<string, unknown>;
  }[];
  responseRules: {
    questionId: string;
    ruleId: string;
    matchKind: ResponseRuleMatchKind;
    optionValue: string | null;
    exactValue: string | null;
    rangeMin: number | null;
    rangeMax: number | null;
    minInclusive: boolean;
    maxInclusive: boolean;
    labelFa: string | null;
    sortOrder: number;
    config: Record<string, unknown>;
  }[];
  responseEffects: {
    effectId: string;
    questionId: string;
    ruleId: string | null;
    parameterId: string;
    operation: ResponseEffectOperation;
    value: number | string | boolean | null;
    coefficient: number | null;
    sortOrder: number;
    config: Record<string, unknown>;
  }[];
  formulas: { formulaId: string; outputParameterId: string; operation: Formula["op"]; divisor: number | null; sortOrder: number; config: Record<string, unknown> }[];
  formulaInputs: {
    formulaId: string;
    inputKind: "of" | "weighted" | "watch";
    sortOrder: number;
    sourceKind: "question" | "parameter";
    questionRef: string | null;
    parameterRef: string | null;
    dimensionParameterId: string | null;
    weight: number | null;
  }[];
  formulaBands: {
    formulaId: string;
    bandId: string;
    labelFa: string;
    gteValue: number | null;
    ltValue: number | null;
    lteValue: number | null;
    sortOrder: number;
  }[];
  formulaRules: {
    formulaId: string;
    ruleKind: "cap" | "demote";
    sortOrder: number;
    thresholdLte: number;
    setValue: string | null;
    fromValue: string | null;
    toValue: string | null;
  }[];
  findings: {
    findingId: string;
    titleFa: string;
    kind: Finding["kind"];
    parentFindingId: string | null;
    constructFa: string | null;
    asIsFa: string | null;
    toBeFa: string | null;
    actionsFa: string | null;
    sortOrder: number;
  }[];
  keywords: { keywordId: string; labelFa: string; sortOrder: number }[];
  keywordChildren: { keywordId: string; sortOrder: number; labelFa: string }[];
  edges: {
    sourceKind: "question" | "parameter" | "keyword" | "finding";
    sourceQuestionId: string | null;
    sourceParameterId: string | null;
    sourceKeywordId: string | null;
    sourceFindingId: string | null;
    targetKind: "parameter" | "keyword" | "finding";
    targetParameterId: string | null;
    targetKeywordId: string | null;
    targetFindingId: string | null;
    weight: number;
    transform: "identity" | "reverse";
    sortOrder: number;
  }[];
  reportConfig: {
    hideGateScores: boolean | null;
    interpretationVersion: string | null;
    closingFa: string | null;
    userSummaryTemplateFa: string | null;
    documentTemplateId: string | null;
    businessNameQuestionId: string | null;
  } | null;
  reportContextFields: { fieldId: string; questionId: string; labelFa: string; sortOrder: number }[];
  reportLayerBands: {
    bandId: string;
    parameterId: string | null;
    labelFa: string;
    meaningFa: string;
    minValue: number;
    maxValue: number;
    maxInclusive: boolean;
    sortOrder: number;
  }[];
  reportCrossPatterns: {
    patternId: string;
    meaningFa: string;
    actionFa: string;
    strongParameterId: string | null;
    weakParameterId: string | null;
    alsoWeakParameterId: string | null;
    sortOrder: number;
  }[];
  reportPatternParameters: { patternId: string; parameterId: string; sortOrder: number }[];
  issues: RelationalAuthoringIssue[];
};

export type RelationalPackRows = { version: Omit<RelationalPackVersionData, "id" | "lifecycleState">; content: RelationalPackContentRows };

const DEFAULT_ANCHORS: Record<string, string> = {
  "0": "اصلاً / هرگز",
  "5": "گاهی / تا حدی",
  "10": "کاملاً / همیشه",
};

function recordOf(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function configOf(value: unknown): Record<string, unknown> {
  return recordOf(value);
}

function addIssue(issues: RelationalAuthoringIssue[], component: string, entityId: string, issueCode: string, detail: Record<string, unknown> = {}) {
  issues.push({ component, entityId, issueCode, detail });
}

function uniqueParameters(pack: AnalyzerPack, issues: RelationalAuthoringIssue[]) {
  const explicit = new Map<string, ScoringParameter>();
  for (const parameter of pack.parameters ?? []) {
    if (explicit.has(parameter.id)) {
      addIssue(issues, "parameter", parameter.id, "duplicate_parameter_id");
      continue;
    }
    explicit.set(parameter.id, parameter);
  }

  const questionIds = new Set(pack.sections.flatMap((section) => section.items.map((item) => item.id)));
  const findingById = new Map(pack.findings.map((finding) => [finding.id, finding]));
  const sectionById = new Map(pack.sections.map((section) => [section.id, section]));
  const formulaById = new Map(pack.formulas.map((formula) => [formula.id, formula]));
  const keywordIds = new Set(pack.keywords.map((keyword) => keyword.id));
  const values = new Map<string, ScoringParameter>(explicit);

  const add = (id: string | null | undefined, suggestedKind: ParameterValueKind = "numeric") => {
    if (!id || questionIds.has(id)) return;
    if (values.has(id)) return;
    const finding = findingById.get(id);
    const section = sectionById.get(id);
    const formula = formulaById.get(id);
    const labelFa = finding?.titleFa ?? section?.titleFa ?? formula?.id ?? id;
    const valueKind: ParameterValueKind = formula?.op === "argmin"
      ? "reference"
      : formula && ["band", "cap_if"].includes(formula.op)
        ? "category"
        : suggestedKind;
    values.set(id, { id, labelFa, valueKind });
  };

  // Formula outputs, matrix dimensions and scored section targets are parameters even in legacy packs.
  for (const formula of pack.formulas) {
    add(formula.id, ["argmin", "band", "cap_if"].includes(formula.op) ? "category" : "numeric");
    for (const weight of formula.weights ?? []) add(weight.dimension);
  }
  for (const edge of pack.edges) {
    if (!findingById.has(edge.to) && !keywordIds.has(edge.to)) add(edge.to);
  }
  for (const effect of pack.responseEffects ?? []) add(effect.parameterId);
  for (const pattern of pack.report?.crossPatterns ?? []) {
    add(pattern.when.strong);
    add(pattern.when.weak);
    add(pattern.when.alsoWeak);
    for (const id of pattern.when.weakAny) add(id);
  }
  const ordered = [...values.values()];
  const rows = ordered.map((parameter, sortOrder) => ({
    parameterId: parameter.id,
    labelFa: parameter.labelFa,
    valueKind: parameter.valueKind ?? "numeric" as ParameterValueKind,
    minValue: parameter.minValue ?? null,
    maxValue: parameter.maxValue ?? null,
    unit: parameter.unit ?? null,
    sortOrder,
    config: configOf(parameter.config),
  }));
  return { rows, ids: new Set(ordered.map((parameter) => parameter.id)) };
}

function sourceForRef(
  ref: string,
  questionIds: Set<string>,
  parameterIds: Set<string>,
  issues: RelationalAuthoringIssue[],
  formulaId: string,
  inputKind: string,
): { sourceKind: "question" | "parameter"; questionRef: string | null; parameterRef: string | null } | null {
  const isQuestion = questionIds.has(ref);
  const isParameter = parameterIds.has(ref);
  if (isQuestion && isParameter) {
    addIssue(issues, "formula", formulaId, "ambiguous_input_reference", { inputKind, ref });
    return null;
  }
  if (isQuestion) return { sourceKind: "question", questionRef: ref, parameterRef: null };
  if (isParameter) return { sourceKind: "parameter", questionRef: null, parameterRef: ref };
  addIssue(issues, "formula", formulaId, "unresolved_input_reference", { inputKind, ref });
  return null;
}

export function packToRelationalRows(pack: AnalyzerPack): RelationalPackRows {
  const issues: RelationalAuthoringIssue[] = [];
  const questions = pack.sections.flatMap((section) => section.items.map((item) => item.id));
  const questionIds = new Set(questions);
  const { rows: parameterRows, ids: parameterIds } = uniqueParameters(pack, issues);
  const findingIds = new Set(pack.findings.map((finding) => finding.id));
  const keywordIds = new Set(pack.keywords.map((keyword) => keyword.id));
  const ruleKeys = new Set((pack.responseRules ?? []).map((rule) => `${rule.questionId}:${rule.id}`));

  const content: RelationalPackContentRows = {
    sections: [], questions: [], choiceOptions: [], parameters: parameterRows,
    responseRules: [], responseEffects: [], formulas: [], formulaInputs: [], formulaBands: [], formulaRules: [],
    findings: [], keywords: [], keywordChildren: [], edges: [], reportConfig: null, reportContextFields: [],
    reportLayerBands: [], reportCrossPatterns: [], reportPatternParameters: [], issues,
  };

  pack.sections.forEach((section, sectionOrder) => {
    content.sections.push({
      sectionId: section.id,
      titleFa: section.titleFa,
      introFa: section.introFa ?? null,
      role: section.role ?? null,
      sortOrder: sectionOrder,
    });
    section.items.forEach((item, questionOrder) => {
      content.questions.push({
        questionId: item.id,
        sectionId: section.id,
        kind: item.kind,
        promptFa: item.text,
        sortOrder: questionOrder,
        required: true,
        reverse: item.kind === "range" && item.reverse,
        minValue: item.kind === "range" ? pack.scale.min : null,
        maxValue: item.kind === "range" ? pack.scale.max : null,
        maxLength: item.kind === "text" ? item.maxLength : null,
        anchors: item.kind === "range" ? { ...item.anchors } : {},
        config: {},
      });
      if (item.kind === "choice") {
        item.options.forEach((option, sortOrder) => {
          content.choiceOptions.push({ questionId: item.id, value: option.value, label: option.label, sortOrder, config: {} });
        });
      }
    });
  });

  pack.responseRules?.forEach((rule) => {
    const question = pack.sections.flatMap((section) => section.items).find((item) => item.id === rule.questionId);
    if (!question) {
      addIssue(issues, "response_rule", rule.id, "unresolved_question", { questionId: rule.questionId });
      return;
    }
    if (rule.matchKind === "option" && (question.kind !== "choice" || !question.options.some((option) => option.value === rule.optionValue))) {
      addIssue(issues, "response_rule", rule.id, "unresolved_option", { questionId: rule.questionId, optionValue: rule.optionValue });
      return;
    }
    if (rule.matchKind === "numeric_range" && question.kind !== "range") {
      addIssue(issues, "response_rule", rule.id, "range_rule_on_non_numeric_question", { questionId: rule.questionId });
      return;
    }
    const sortOrder = content.responseRules.filter((row) => row.questionId === rule.questionId).length;
    content.responseRules.push({
      questionId: rule.questionId,
      ruleId: rule.id,
      matchKind: rule.matchKind,
      optionValue: rule.matchKind === "option" ? rule.optionValue ?? null : null,
      exactValue: rule.matchKind === "exact_value" ? rule.exactValue ?? null : null,
      rangeMin: rule.matchKind === "numeric_range" ? rule.rangeMin ?? null : null,
      rangeMax: rule.matchKind === "numeric_range" ? rule.rangeMax ?? null : null,
      minInclusive: rule.matchKind === "numeric_range" ? rule.minInclusive !== false : true,
      maxInclusive: rule.matchKind === "numeric_range" ? rule.maxInclusive !== false : true,
      labelFa: rule.labelFa ?? null,
      sortOrder,
      config: configOf(rule.config),
    });
  });

  pack.responseEffects?.forEach((effect, sortOrder) => {
    if (!questionIds.has(effect.questionId)) {
      addIssue(issues, "response_effect", effect.id, "unresolved_question", { questionId: effect.questionId });
      return;
    }
    if (effect.ruleId && !ruleKeys.has(`${effect.questionId}:${effect.ruleId}`)) {
      addIssue(issues, "response_effect", effect.id, "unresolved_rule", { questionId: effect.questionId, ruleId: effect.ruleId });
      return;
    }
    if (!parameterIds.has(effect.parameterId)) {
      addIssue(issues, "response_effect", effect.id, "unresolved_parameter", { parameterId: effect.parameterId });
      return;
    }
    content.responseEffects.push({
      effectId: effect.id,
      questionId: effect.questionId,
      ruleId: effect.ruleId ?? null,
      parameterId: effect.parameterId,
      operation: effect.operation,
      value: effect.value ?? null,
      coefficient: effect.coefficient ?? null,
      sortOrder,
      config: configOf(effect.config),
    });
  });

  const formulasById = new Map(pack.formulas.map((formula) => [formula.id, formula]));
  pack.formulas.forEach((formula, formulaOrder) => {
    if (!parameterIds.has(formula.id)) {
      addIssue(issues, "formula", formula.id, "missing_output_parameter", { outputParameterId: formula.id });
      return;
    }
    if (formula.op === "sum_div" && (formula.divisor == null || !Number.isFinite(formula.divisor) || formula.divisor === 0)) {
      addIssue(issues, "formula", formula.id, "invalid_divisor", { divisor: formula.divisor ?? null });
      return;
    }
    content.formulas.push({
      formulaId: formula.id,
      outputParameterId: formula.id,
      operation: formula.op,
      divisor: formula.op === "sum_div" ? formula.divisor ?? null : null,
      sortOrder: formulaOrder,
      config: {},
    });
    (formula.of ?? []).forEach((ref, sortOrder) => {
      const source = sourceForRef(ref, questionIds, parameterIds, issues, formula.id, "of");
      if (!source) return;
      content.formulaInputs.push({
        formulaId: formula.id, inputKind: "of", sortOrder, ...source, dimensionParameterId: null, weight: null,
      });
    });
    (formula.weights ?? []).forEach((weight, sortOrder) => {
      const source = sourceForRef(weight.item, questionIds, parameterIds, issues, formula.id, "weighted");
      if (!source) return;
      if (weight.dimension && !parameterIds.has(weight.dimension)) {
        addIssue(issues, "formula", formula.id, "unresolved_dimension_parameter", { dimension: weight.dimension });
        return;
      }
      content.formulaInputs.push({
        formulaId: formula.id,
        inputKind: "weighted",
        sortOrder,
        ...source,
        dimensionParameterId: weight.dimension ?? null,
        weight: weight.weight,
      });
    });
    (formula.watch ?? []).forEach((ref, sortOrder) => {
      if (!questionIds.has(ref)) {
        addIssue(issues, "formula", formula.id, "unresolved_watch_question", { ref });
        return;
      }
      content.formulaInputs.push({
        formulaId: formula.id,
        inputKind: "watch",
        sortOrder,
        sourceKind: "question",
        questionRef: ref,
        parameterRef: null,
        dimensionParameterId: null,
        weight: null,
      });
    });
    (formula.bands ?? []).forEach((band, sortOrder) => {
      content.formulaBands.push({
        formulaId: formula.id,
        bandId: band.id,
        labelFa: band.labelFa,
        gteValue: band.gte ?? null,
        ltValue: band.lt ?? null,
        lteValue: band.lte ?? null,
        sortOrder,
      });
    });
    (formula.capAt ?? []).forEach((rule, sortOrder) => {
      content.formulaRules.push({
        formulaId: formula.id, ruleKind: "cap", sortOrder, thresholdLte: rule.lte,
        setValue: rule.set, fromValue: null, toValue: null,
      });
    });
    (formula.demote ?? []).forEach((rule, sortOrder) => {
      content.formulaRules.push({
        formulaId: formula.id, ruleKind: "demote", sortOrder, thresholdLte: rule.lte,
        setValue: null, fromValue: rule.from, toValue: rule.to,
      });
    });
  });
  // Catch formula references to formulas that were skipped above; the issue keeps the JSON projection authoritative.
  for (const input of content.formulaInputs) {
    if (input.sourceKind === "parameter" && input.parameterRef && formulasById.has(input.parameterRef) && !content.formulas.some((formula) => formula.formulaId === input.parameterRef)) {
      addIssue(issues, "formula", input.formulaId, "unresolved_formula_output", { ref: input.parameterRef });
    }
  }

  const findingRows = pack.findings.map((finding, sortOrder) => ({
    findingId: finding.id,
    titleFa: finding.titleFa,
    kind: finding.kind,
    parentFindingId: finding.parentId ?? null,
    constructFa: finding.constructFa ?? null,
    asIsFa: finding.asIsFa ?? null,
    toBeFa: finding.toBeFa ?? null,
    actionsFa: finding.actionsFa ?? null,
    sortOrder,
  }));
  content.findings = findingRows;
  pack.keywords.forEach((keyword, sortOrder) => {
    content.keywords.push({ keywordId: keyword.id, labelFa: keyword.labelFa, sortOrder });
    (keyword.children ?? []).forEach((labelFa, childOrder) => content.keywordChildren.push({ keywordId: keyword.id, sortOrder: childOrder, labelFa }));
  });

  pack.edges.forEach((edge, sortOrder) => {
    const sourceQuestion = questionIds.has(edge.from);
    const sourceKeyword = keywordIds.has(edge.from);
    const sourceFinding = findingIds.has(edge.from);
    const sourceParameter = parameterIds.has(edge.from);
    if (!sourceQuestion && !sourceKeyword && !sourceFinding && !sourceParameter) {
      addIssue(issues, "edge", `${edge.from}>${edge.to}`, "unresolved_source", { from: edge.from });
      return;
    }
    const sourceKind = sourceQuestion ? "question" : sourceKeyword ? "keyword" : sourceFinding ? "finding" : "parameter";
    const sourceQuestionId = sourceKind === "question" ? edge.from : null;
    const sourceKeywordId = sourceKind === "keyword" ? edge.from : null;
    const sourceFindingId = sourceKind === "finding" ? edge.from : null;
    const sourceParameterId = sourceKind === "parameter" ? edge.from : null;
    if (keywordIds.has(edge.to)) {
      content.edges.push({
        sourceKind, sourceQuestionId, sourceParameterId, sourceKeywordId, sourceFindingId,
        targetKind: "keyword", targetParameterId: null, targetKeywordId: edge.to, targetFindingId: null,
        weight: edge.weight, transform: edge.transform, sortOrder,
      });
      return;
    }
    if (findingIds.has(edge.to)) {
      content.edges.push({
        sourceKind, sourceQuestionId, sourceParameterId, sourceKeywordId, sourceFindingId,
        targetKind: "finding", targetParameterId: null, targetKeywordId: null, targetFindingId: edge.to,
        weight: edge.weight, transform: edge.transform, sortOrder,
      });
      return;
    }
    if (!parameterIds.has(edge.to)) {
      addIssue(issues, "edge", `${edge.from}>${edge.to}`, "unresolved_target", { to: edge.to });
      return;
    }
    content.edges.push({
      sourceKind, sourceQuestionId, sourceParameterId, sourceKeywordId, sourceFindingId,
      targetKind: "parameter", targetParameterId: edge.to, targetKeywordId: null, targetFindingId: null,
      weight: edge.weight, transform: edge.transform, sortOrder,
    });
  });

  const report = pack.report;
  if (report) {
    content.reportConfig = {
      hideGateScores: report.hideGateScores ?? null,
      interpretationVersion: report.interpretationVersion ?? null,
      closingFa: report.closingFa ?? null,
      userSummaryTemplateFa: report.userSummaryTemplateFa ?? null,
      documentTemplateId: report.documentTemplateId ?? null,
      businessNameQuestionId: report.businessNameItemId ?? null,
    };
    if (report.businessNameItemId && !questionIds.has(report.businessNameItemId)) {
      addIssue(issues, "report_config", "businessNameItemId", "unresolved_question", { questionId: report.businessNameItemId });
      content.reportConfig.businessNameQuestionId = null;
    }
    (report.contextFields ?? []).forEach((field, sortOrder) => {
      if (!questionIds.has(field.id)) {
        addIssue(issues, "report_context_field", field.id, "unresolved_question", { questionId: field.id });
        return;
      }
      content.reportContextFields.push({ fieldId: field.id, questionId: field.id, labelFa: field.labelFa, sortOrder });
    });
    (report.layerBands ?? []).forEach((band, sortOrder) => {
      content.reportLayerBands.push({
        bandId: band.id, parameterId: null, labelFa: band.labelFa, meaningFa: band.meaningFa,
        minValue: band.min, maxValue: band.max, maxInclusive: band.maxInclusive, sortOrder,
      });
    });
    (report.crossPatterns ?? []).forEach((pattern, sortOrder) => {
      const refs = [pattern.when.strong, pattern.when.weak, pattern.when.alsoWeak, ...pattern.when.weakAny].filter((ref): ref is string => Boolean(ref));
      for (const ref of refs) {
        if (!parameterIds.has(ref)) addIssue(issues, "report_cross_pattern", pattern.id, "unresolved_parameter", { ref });
      }
      content.reportCrossPatterns.push({
        patternId: pattern.id,
        meaningFa: pattern.meaningFa,
        actionFa: pattern.actionFa,
        strongParameterId: pattern.when.strong,
        weakParameterId: pattern.when.weak,
        alsoWeakParameterId: pattern.when.alsoWeak,
        sortOrder,
      });
      pattern.when.weakAny.forEach((parameterId, weakOrder) => {
        if (parameterIds.has(parameterId)) content.reportPatternParameters.push({ patternId: pattern.id, parameterId, sortOrder: weakOrder });
      });
    });
  }

  const version = {
    packSlug: pack.slug,
    version: pack.version,
    nameFa: pack.nameFa,
    summaryFa: pack.summaryFa,
    scaleConfig: pack.scale,
    consentConfig: pack.consent,
    botDisplayConfig: pack.botDisplay ?? null,
  };
  return { version, content };
}

function sorted<T>(rows: T[], order: (row: T) => number): T[] {
  return [...rows].sort((a, b) => order(a) - order(b));
}

function responseRuleMatch(value: string): value is ResponseRuleMatchKind {
  return value === "option" || value === "numeric_range" || value === "exact_value" || value === "fallback";
}

function effectOperation(value: string): value is ResponseEffectOperation {
  return value === "identity" || value === "reverse" || value === "set_value" || value === "add" || value === "multiply" || value === "weighted_value";
}

export function relationalRowsToPack(
  version: RelationalPackVersionData,
  status: AnalyzerPack["status"],
  rows: RelationalPackContentRows,
): AnalyzerPack {
  const optionsByQuestion = new Map<string, typeof rows.choiceOptions>();
  for (const option of sorted(rows.choiceOptions, (row) => row.sortOrder)) {
    const list = optionsByQuestion.get(option.questionId) ?? [];
    list.push(option);
    optionsByQuestion.set(option.questionId, list);
  }
  const questionsBySection = new Map<string, typeof rows.questions>();
  for (const question of sorted(rows.questions, (row) => row.sortOrder)) {
    const list = questionsBySection.get(question.sectionId) ?? [];
    list.push(question);
    questionsBySection.set(question.sectionId, list);
  }
  const sections: Section[] = sorted(rows.sections, (row) => row.sortOrder).map((section) => ({
    id: section.sectionId,
    titleFa: section.titleFa,
    ...(section.introFa ? { introFa: section.introFa } : {}),
    ...(section.role ? { role: section.role } : {}),
    items: (questionsBySection.get(section.sectionId) ?? []).map((question) => {
      if (question.kind === "range") {
        if (question.minValue !== version.scaleConfig.min || question.maxValue !== version.scaleConfig.max) {
          throw new Error(`unsupported question scale for ${question.questionId}`);
        }
        const anchors = { ...DEFAULT_ANCHORS, ...question.anchors };
        return {
          kind: "range" as const,
          id: question.questionId,
          text: question.promptFa,
          reverse: question.reverse,
          anchors: { 0: anchors["0"] ?? DEFAULT_ANCHORS["0"]!, 5: anchors["5"] ?? DEFAULT_ANCHORS["5"]!, 10: anchors["10"] ?? DEFAULT_ANCHORS["10"]! },
        };
      }
      if (question.kind === "text") {
        return { kind: "text" as const, id: question.questionId, text: question.promptFa, maxLength: question.maxLength ?? 128 };
      }
      if (question.kind === "choice") {
        const choice: ChoiceItem = {
          kind: "choice",
          id: question.questionId,
          text: question.promptFa,
          options: sorted(optionsByQuestion.get(question.questionId) ?? [], (row) => row.sortOrder).map((option) => ({ value: option.value, label: option.label })),
        };
        return choice;
      }
      throw new Error(`unknown question kind for ${question.questionId}`);
    }),
  }));

  const parameters: ScoringParameter[] = sorted(rows.parameters, (row) => row.sortOrder).map((row) => ({
    id: row.parameterId,
    labelFa: row.labelFa,
    valueKind: row.valueKind,
    ...(row.minValue != null ? { minValue: row.minValue } : {}),
    ...(row.maxValue != null ? { maxValue: row.maxValue } : {}),
    ...(row.unit ? { unit: row.unit } : {}),
    ...(Object.keys(configOf(row.config)).length ? { config: configOf(row.config) } : {}),
  }));

  const questionOrder = new Map(rows.questions.map((row, index) => [row.questionId, index]));
  const responseRules: ResponseRule[] = sorted(rows.responseRules, (row) => (questionOrder.get(row.questionId) ?? 0) * 1000 + row.sortOrder).map((row) => {
    if (!responseRuleMatch(row.matchKind)) throw new Error(`unknown response match kind for ${row.ruleId}`);
    return {
      id: row.ruleId,
      questionId: row.questionId,
      matchKind: row.matchKind,
      ...(row.optionValue != null ? { optionValue: row.optionValue } : {}),
      ...(row.exactValue != null ? { exactValue: row.exactValue } : {}),
      ...(row.rangeMin != null ? { rangeMin: row.rangeMin } : {}),
      ...(row.rangeMax != null ? { rangeMax: row.rangeMax } : {}),
      ...(row.matchKind === "numeric_range" ? { minInclusive: row.minInclusive, maxInclusive: row.maxInclusive } : {}),
      ...(row.labelFa ? { labelFa: row.labelFa } : {}),
      ...(Object.keys(configOf(row.config)).length ? { config: configOf(row.config) } : {}),
    };
  });

  const responseEffects: ResponseEffect[] = sorted(rows.responseEffects, (row) => row.sortOrder).map((row) => {
    if (!effectOperation(row.operation)) throw new Error(`unknown response effect operation for ${row.effectId}`);
    return {
      id: row.effectId,
      questionId: row.questionId,
      ...(row.ruleId ? { ruleId: row.ruleId } : {}),
      parameterId: row.parameterId,
      operation: row.operation,
      ...(row.value != null ? { value: row.value } : {}),
      ...(row.coefficient != null ? { coefficient: row.coefficient } : {}),
      ...(Object.keys(configOf(row.config)).length ? { config: configOf(row.config) } : {}),
    };
  });

  const formulas: Formula[] = sorted(rows.formulas, (row) => row.sortOrder).map((row) => {
    const inputs = rows.formulaInputs.filter((input) => input.formulaId === row.formulaId);
    const toRef = (input: RelationalPackContentRows["formulaInputs"][number]) => input.sourceKind === "question" ? input.questionRef : input.parameterRef;
    const of = sorted(inputs.filter((input) => input.inputKind === "of"), (input) => input.sortOrder).map(toRef).filter((ref): ref is string => Boolean(ref));
    const weights = sorted(inputs.filter((input) => input.inputKind === "weighted"), (input) => input.sortOrder).flatMap((input) => {
      const item = toRef(input);
      if (!item || input.weight == null) return [];
      return [{ item, weight: input.weight, ...(input.dimensionParameterId ? { dimension: input.dimensionParameterId } : {}) }];
    });
    const watch = sorted(inputs.filter((input) => input.inputKind === "watch"), (input) => input.sortOrder).map((input) => input.questionRef).filter((ref): ref is string => Boolean(ref));
    const bands: Band[] = sorted(rows.formulaBands.filter((band) => band.formulaId === row.formulaId), (band) => band.sortOrder).map((band) => ({
      id: band.bandId,
      labelFa: band.labelFa,
      ...(band.gteValue != null ? { gte: band.gteValue } : {}),
      ...(band.ltValue != null ? { lt: band.ltValue } : {}),
      ...(band.lteValue != null ? { lte: band.lteValue } : {}),
    }));
    const capAt = sorted(rows.formulaRules.filter((rule) => rule.formulaId === row.formulaId && rule.ruleKind === "cap"), (rule) => rule.sortOrder).flatMap((rule) =>
      rule.setValue == null ? [] : [{ lte: rule.thresholdLte, set: rule.setValue }],
    );
    const demote = sorted(rows.formulaRules.filter((rule) => rule.formulaId === row.formulaId && rule.ruleKind === "demote"), (rule) => rule.sortOrder).flatMap((rule) =>
      rule.fromValue == null || rule.toValue == null ? [] : [{ lte: rule.thresholdLte, from: rule.fromValue, to: rule.toValue }],
    );
    return {
      id: row.formulaId,
      op: row.operation,
      ...(of.length ? { of } : {}),
      ...(row.divisor != null ? { divisor: row.divisor } : {}),
      ...(weights.length ? { weights } : {}),
      ...(bands.length ? { bands } : {}),
      ...(watch.length ? { watch } : {}),
      ...(capAt.length ? { capAt } : {}),
      ...(demote.length ? { demote } : {}),
    };
  });

  const findings: Finding[] = sorted(rows.findings, (row) => row.sortOrder).map((row) => ({
    id: row.findingId,
    titleFa: row.titleFa,
    kind: row.kind,
    ...(row.parentFindingId ? { parentId: row.parentFindingId } : {}),
    ...(row.constructFa ? { constructFa: row.constructFa } : {}),
    ...(row.asIsFa ? { asIsFa: row.asIsFa } : {}),
    ...(row.toBeFa ? { toBeFa: row.toBeFa } : {}),
    ...(row.actionsFa ? { actionsFa: row.actionsFa } : {}),
  }));
  const childrenByKeyword = new Map<string, typeof rows.keywordChildren>();
  for (const child of sorted(rows.keywordChildren, (row) => row.sortOrder)) {
    const list = childrenByKeyword.get(child.keywordId) ?? [];
    list.push(child);
    childrenByKeyword.set(child.keywordId, list);
  }
  const keywords: Keyword[] = sorted(rows.keywords, (row) => row.sortOrder).map((row) => {
    const children = sorted(childrenByKeyword.get(row.keywordId) ?? [], (child) => child.sortOrder).map((child) => child.labelFa);
    return children.length ? { id: row.keywordId, labelFa: row.labelFa, children } : { id: row.keywordId, labelFa: row.labelFa };
  });
  const edges: Edge[] = sorted(rows.edges, (row) => row.sortOrder).map((row) => {
    const from = row.sourceKind === "question" ? row.sourceQuestionId
      : row.sourceKind === "parameter" ? row.sourceParameterId
        : row.sourceKind === "keyword" ? row.sourceKeywordId
          : row.sourceFindingId;
    const to = row.targetKind === "parameter" ? row.targetParameterId : row.targetKind === "keyword" ? row.targetKeywordId : row.targetFindingId;
    if (!from || !to) throw new Error("relational edge source or target is missing");
    return { from, to, weight: row.weight, transform: row.transform };
  });

  let report: PackReport | undefined;
  if (rows.reportConfig) {
    report = {
      ...(rows.reportConfig.hideGateScores != null ? { hideGateScores: rows.reportConfig.hideGateScores } : {}),
      ...(rows.reportConfig.interpretationVersion ? { interpretationVersion: rows.reportConfig.interpretationVersion } : {}),
      ...(rows.reportConfig.closingFa ? { closingFa: rows.reportConfig.closingFa } : {}),
      ...(rows.reportConfig.userSummaryTemplateFa ? { userSummaryTemplateFa: rows.reportConfig.userSummaryTemplateFa } : {}),
      ...(rows.reportConfig.documentTemplateId ? { documentTemplateId: rows.reportConfig.documentTemplateId } : {}),
      ...(rows.reportConfig.businessNameQuestionId ? { businessNameItemId: rows.reportConfig.businessNameQuestionId } : {}),
    };
    const contextFields = sorted(rows.reportContextFields, (row) => row.sortOrder).map((row) => ({ id: row.fieldId, labelFa: row.labelFa }));
    const layerBands = sorted(rows.reportLayerBands, (row) => row.sortOrder).map((row) => ({
      id: row.bandId, labelFa: row.labelFa, meaningFa: row.meaningFa,
      min: row.minValue, max: row.maxValue, maxInclusive: row.maxInclusive,
    }));
    const patternParams = new Map<string, typeof rows.reportPatternParameters>();
    for (const row of sorted(rows.reportPatternParameters, (entry) => entry.sortOrder)) {
      const list = patternParams.get(row.patternId) ?? [];
      list.push(row);
      patternParams.set(row.patternId, list);
    }
    const crossPatterns = sorted(rows.reportCrossPatterns, (row) => row.sortOrder).map((row) => ({
      id: row.patternId,
      meaningFa: row.meaningFa,
      actionFa: row.actionFa,
      when: {
        strong: row.strongParameterId,
        weak: row.weakParameterId,
        alsoWeak: row.alsoWeakParameterId,
        weakAny: sorted(patternParams.get(row.patternId) ?? [], (parameter) => parameter.sortOrder).map((parameter) => parameter.parameterId),
      },
    }));
    if (contextFields.length) report.contextFields = contextFields;
    if (layerBands.length) report.layerBands = layerBands;
    if (crossPatterns.length) report.crossPatterns = crossPatterns;
  }

  const pack: AnalyzerPack = {
    slug: version.packSlug,
    packVersionId: version.id,
    version: version.version,
    status,
    nameFa: version.nameFa,
    summaryFa: version.summaryFa,
    scale: version.scaleConfig,
    consent: version.consentConfig,
    sections,
    findings,
    keywords,
    edges,
    parameters,
    ...(responseRules.length ? { responseRules } : {}),
    ...(responseEffects.length ? { responseEffects } : {}),
    formulas,
    ...(report && Object.keys(report).length ? { report } : {}),
    ...(version.botDisplayConfig ? { botDisplay: version.botDisplayConfig } : {}),
  };
  assertPack(pack);
  return pack;
}
