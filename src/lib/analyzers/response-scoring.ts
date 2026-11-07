import {
  itemsOf,
  type AnalyzerPack,
  type Item,
  type ParameterValueKind,
  type ResponseEffect,
  type ResponseRule,
  type ScoringParameter,
} from "@/lib/analyzers/pack";
import { normalizeAnswer, type AnswerMap } from "@/lib/analyzers/runtime";

export type ResponseScoreValue = number | string | boolean;
export type ResponseScoringParameter = ScoringParameter & { valueKind: ParameterValueKind };

type ValidationOptions = { requireCoverage?: boolean };

const REPLACE_OR_SEED_OPERATIONS = new Set(["identity", "reverse", "set_value", "add", "weighted_value"]);

function formulaKind(pack: AnalyzerPack, id: string): ParameterValueKind {
  const formula = pack.formulas.find((row) => row.id === id);
  if (!formula) return "numeric";
  if (formula.op === "argmin") return "reference";
  if (formula.op === "band" || formula.op === "cap_if") return "category";
  return "numeric";
}

/** Explicit authoring parameters plus the compatible section/formula outputs the engine already exposes. */
export function scoringParametersOf(pack: AnalyzerPack): ResponseScoringParameter[] {
  const byId = new Map<string, ResponseScoringParameter>();
  const add = (parameter: ScoringParameter) => {
    if (!byId.has(parameter.id)) {
      byId.set(parameter.id, { ...parameter, valueKind: parameter.valueKind ?? "numeric" });
    }
  };

  for (const parameter of pack.parameters ?? []) add(parameter);
  for (const section of pack.sections) {
    if (section.id !== "business") add({ id: section.id, labelFa: section.titleFa, valueKind: "numeric" });
  }
  for (const formula of pack.formulas) {
    add({ id: formula.id, labelFa: formula.id, valueKind: formulaKind(pack, formula.id) });
    for (const weight of formula.weights ?? []) {
      if (weight.dimension) add({ id: weight.dimension, labelFa: weight.dimension, valueKind: "numeric" });
    }
  }
  return [...byId.values()];
}

function parameterMap(pack: AnalyzerPack): Map<string, ResponseScoringParameter> {
  return new Map(scoringParametersOf(pack).map((parameter) => [parameter.id, parameter]));
}

function isStringKind(kind: ParameterValueKind): boolean {
  return kind === "category" || kind === "reference" || kind === "text";
}

function isValueForKind(value: unknown, kind: ParameterValueKind): boolean {
  if (kind === "numeric") return typeof value === "number" && Number.isFinite(value);
  if (kind === "boolean") return typeof value === "boolean";
  return isStringKind(kind) && typeof value === "string";
}

function answerMatches(rule: ResponseRule, item: Item, answer: number | string): boolean {
  if (rule.matchKind === "fallback") return true;
  if (rule.matchKind === "option") return item.kind === "choice" && answer === rule.optionValue;
  if (rule.matchKind === "exact_value") return typeof answer === "string" && answer === rule.exactValue;
  if (rule.matchKind !== "numeric_range" || item.kind !== "range" || typeof answer !== "number") return false;
  if (rule.rangeMin != null && (rule.minInclusive === false ? answer <= rule.rangeMin : answer < rule.rangeMin)) return false;
  if (rule.rangeMax != null && (rule.maxInclusive === false ? answer >= rule.rangeMax : answer > rule.rangeMax)) return false;
  return true;
}

function firstMatchingRule(rules: ResponseRule[], item: Item, answer: number | string): ResponseRule | undefined {
  const specific = rules.find((rule) => rule.matchKind !== "fallback" && answerMatches(rule, item, answer));
  return specific ?? rules.find((rule) => rule.matchKind === "fallback");
}

function numericSource(item: Item, answer: number | string, effectId: string): number {
  if (item.kind !== "range" || typeof answer !== "number") {
    throw new Error(`response effect ${effectId} requires a numeric range answer`);
  }
  return item.reverse ? 10 - answer : answer;
}

function validateEffectGroupOrder(
  effects: ResponseEffect[],
  seededBefore: Set<string>,
  errors: string[],
) {
  const seeded = new Set(seededBefore);
  for (const effect of effects) {
    if (effect.operation === "multiply" && !seeded.has(effect.parameterId)) {
      errors.push(`اثر ${effect.id}: برای multiply باید پیش‌تر در همین پاسخ مقداری برای پارامتر ساخته شود.`);
    }
    if (REPLACE_OR_SEED_OPERATIONS.has(effect.operation)) seeded.add(effect.parameterId);
  }
}

/** Validate references, response/question compatibility, value kinds and publish-time response coverage. */
export function validateResponseScoring(pack: AnalyzerPack, options: ValidationOptions = {}): string[] {
  const errors: string[] = [];
  const requireCoverage = options.requireCoverage === true;
  const items = itemsOf(pack);
  const itemById = new Map(items.map((item) => [item.id, item]));
  const parameters = parameterMap(pack);
  for (const parameter of pack.parameters ?? []) {
    if (parameter.valueKind && parameter.valueKind !== "numeric" && (parameter.minValue != null || parameter.maxValue != null)) {
      errors.push(`پارامتر ${parameter.id}: کران کمینه/بیشینه فقط برای نوع عددی مجاز است.`);
    }
  }
  const rulesByQuestion = new Map<string, ResponseRule[]>();
  const ruleKeys = new Set<string>();
  const fallbackByQuestion = new Set<string>();

  for (const rule of pack.responseRules ?? []) {
    const key = `${rule.questionId}:${rule.id}`;
    if (!rule.id || !rule.questionId || ruleKeys.has(key)) {
      errors.push(`قاعدهٔ پاسخ ${rule.id || "بدون شناسه"} شناسهٔ تکراری یا نامعتبر دارد.`);
      continue;
    }
    ruleKeys.add(key);
    const item = itemById.get(rule.questionId);
    if (!item) {
      errors.push(`سؤال قاعدهٔ پاسخ ${rule.id} پیدا نشد.`);
      continue;
    }
    const list = rulesByQuestion.get(rule.questionId) ?? [];
    list.push(rule);
    rulesByQuestion.set(rule.questionId, list);

    if (rule.matchKind === "option") {
      if (item.kind !== "choice" || !item.options.some((option) => option.value === rule.optionValue)) {
        errors.push(`قاعدهٔ ${rule.id}: گزینه با سؤال سازگار نیست.`);
      }
    } else if (rule.matchKind === "numeric_range") {
      if (item.kind !== "range") {
        errors.push(`قاعدهٔ ${rule.id}: بازه فقط برای سؤال مقیاسی مجاز است.`);
      }
      if (rule.rangeMin == null && rule.rangeMax == null) {
        errors.push(`قاعدهٔ ${rule.id}: حداقل یکی از دو مرز بازه لازم است.`);
      }
      if (
        (rule.rangeMin != null && (!Number.isFinite(rule.rangeMin) || rule.rangeMin < 0 || rule.rangeMin > 10)) ||
        (rule.rangeMax != null && (!Number.isFinite(rule.rangeMax) || rule.rangeMax < 0 || rule.rangeMax > 10)) ||
        (rule.rangeMin != null && rule.rangeMax != null && rule.rangeMin >= rule.rangeMax)
      ) {
        errors.push(`قاعدهٔ ${rule.id}: مرزهای بازه باید در مقیاس ۰ تا ۱۰ و به ترتیب صعودی باشند.`);
      }
    } else if (rule.matchKind === "exact_value") {
      if (item.kind === "range") errors.push(`قاعدهٔ ${rule.id}: مقدار دقیق فقط برای سؤال متنی یا گزینه‌ای مجاز است.`);
      if (typeof rule.exactValue !== "string" || rule.exactValue.length > 500) {
        errors.push(`قاعدهٔ ${rule.id}: مقدار دقیق معتبر نیست.`);
      } else if (item.kind === "choice" && !item.options.some((option) => option.value === rule.exactValue)) {
        errors.push(`قاعدهٔ ${rule.id}: مقدار دقیق در گزینه‌های سؤال نیست.`);
      }
    } else if (rule.matchKind === "fallback") {
      if (fallbackByQuestion.has(rule.questionId)) errors.push(`برای سؤال ${rule.questionId} بیش از یک fallback تعریف شده است.`);
      fallbackByQuestion.add(rule.questionId);
    } else {
      errors.push(`قاعدهٔ پاسخ ${rule.id}: نوع تطبیق ناشناخته است.`);
    }
  }

  const effectsByQuestion = new Map<string, ResponseEffect[]>();
  const effectsByRule = new Map<string, ResponseEffect[]>();
  const effectIds = new Set<string>();
  for (const effect of pack.responseEffects ?? []) {
    if (!effect.id || effectIds.has(effect.id)) {
      errors.push(`اثر پاسخ ${effect.id || "بدون شناسه"} شناسهٔ تکراری یا نامعتبر دارد.`);
      continue;
    }
    effectIds.add(effect.id);
    const item = itemById.get(effect.questionId);
    if (!item) {
      errors.push(`سؤال اثر پاسخ ${effect.id} پیدا نشد.`);
      continue;
    }
    const parameter = parameters.get(effect.parameterId);
    if (!parameter) {
      errors.push(`پارامتر مقصد اثر پاسخ ${effect.id} پیدا نشد.`);
      continue;
    }
    const questionEffects = effectsByQuestion.get(effect.questionId) ?? [];
    questionEffects.push(effect);
    effectsByQuestion.set(effect.questionId, questionEffects);
    if (effect.ruleId) {
      const ruleKey = `${effect.questionId}:${effect.ruleId}`;
      if (!ruleKeys.has(ruleKey)) {
        errors.push(`قاعدهٔ اثر پاسخ ${effect.id} برای همین سؤال پیدا نشد.`);
      } else {
        const matchingEffects = effectsByRule.get(ruleKey) ?? [];
        matchingEffects.push(effect);
        effectsByRule.set(ruleKey, matchingEffects);
      }
    }

    if (effect.operation === "identity") {
      const compatible = parameter.valueKind === "numeric"
        ? item.kind === "range"
        : isStringKind(parameter.valueKind) && (item.kind === "choice" || item.kind === "text");
      if (!compatible || effect.value !== undefined || effect.coefficient !== undefined) {
        errors.push(`اثر ${effect.id}: identity با نوع سؤال یا پارامتر مقصد سازگار نیست.`);
      }
    } else if (effect.operation === "reverse") {
      if (item.kind !== "range" || parameter.valueKind !== "numeric" || effect.value !== undefined || effect.coefficient !== undefined) {
        errors.push(`اثر ${effect.id}: reverse فقط برای پاسخ مقیاسی و پارامتر عددی مجاز است.`);
      }
    } else if (effect.operation === "set_value") {
      if (!isValueForKind(effect.value, parameter.valueKind) || effect.coefficient !== undefined) {
        errors.push(`اثر ${effect.id}: مقدار ثابت با نوع پارامتر مقصد سازگار نیست.`);
      }
    } else if (effect.operation === "add") {
      if (parameter.valueKind !== "numeric" || typeof effect.value !== "number" || !Number.isFinite(effect.value) || effect.coefficient !== undefined) {
        errors.push(`اثر ${effect.id}: add به پارامتر عددی و مقدار ثابت عددی نیاز دارد.`);
      }
    } else if (effect.operation === "multiply") {
      if (parameter.valueKind !== "numeric" || effect.value !== undefined || typeof effect.coefficient !== "number" || !Number.isFinite(effect.coefficient)) {
        errors.push(`اثر ${effect.id}: multiply به پارامتر عددی و ضریب معتبر نیاز دارد.`);
      }
    } else if (effect.operation === "weighted_value") {
      if (item.kind !== "range" || parameter.valueKind !== "numeric" || effect.value !== undefined || typeof effect.coefficient !== "number" || !Number.isFinite(effect.coefficient)) {
        errors.push(`اثر ${effect.id}: weighted_value به سؤال مقیاسی، پارامتر عددی و ضریب معتبر نیاز دارد.`);
      }
    } else {
      errors.push(`اثر پاسخ ${effect.id}: operation مجاز نیست.`);
    }
  }

  // multiply transforms an accumulator. Require a guaranteed seed in the same question/rule path.
  for (const [questionId, questionEffects] of effectsByQuestion) {
    const defaults = questionEffects.filter((effect) => effect.ruleId == null);
    validateEffectGroupOrder(defaults, new Set(), errors);
    for (const rule of rulesByQuestion.get(questionId) ?? []) {
      const specific = effectsByRule.get(`${questionId}:${rule.id}`) ?? [];
      validateEffectGroupOrder(specific, new Set(defaults.filter((effect) => REPLACE_OR_SEED_OPERATIONS.has(effect.operation)).map((effect) => effect.parameterId)), errors);
    }
  }

  for (const [questionId, rules] of rulesByQuestion) {
    const item = itemById.get(questionId);
    if (!item) continue;
    const candidates: (number | string)[] = item.kind === "range"
      ? Array.from({ length: 11 }, (_, value) => value)
      : item.kind === "choice"
        ? item.options.map((option) => option.value)
        : [...new Set(rules.filter((rule) => rule.matchKind === "exact_value").map((rule) => rule.exactValue).filter((value): value is string => Boolean(value)))];
    const overlaps = candidates.some((answer) => rules.filter((rule) => rule.matchKind !== "fallback" && answerMatches(rule, item, answer)).length > 1);
    if (overlaps) errors.push(`قواعد سؤال ${questionId} هم‌پوشانی دارند؛ برای هر پاسخ فقط یک قاعدهٔ دقیق نگه دارید و چند اثر را به همان قاعده وصل کنید.`);
  }

  if (requireCoverage) {
    for (const [questionId, rules] of rulesByQuestion) {
      const questionEffects = effectsByQuestion.get(questionId) ?? [];
      const hasUnconditionalEffect = questionEffects.some((effect) => effect.ruleId == null);
      if (!hasUnconditionalEffect) {
        for (const rule of rules) {
          if (!(effectsByRule.get(`${questionId}:${rule.id}`)?.length)) {
            errors.push(`قاعدهٔ ${rule.id} باید دست‌کم یک اثر داشته باشد یا سؤال یک اثر عمومی تعریف کند.`);
          }
        }
        const item = itemById.get(questionId);
        if (item) {
          const hasRuleForAnswer = (answer: number | string) => Boolean(firstMatchingRule(rules, item, answer));
          if (item.kind === "range") {
            for (let value = 0; value <= 10; value += 1) {
              if (!hasRuleForAnswer(value)) {
                errors.push(`قواعد پاسخ سؤال ${item.id} همهٔ مقدارهای ۰ تا ۱۰ را پوشش نمی‌دهند؛ fallback یا بازهٔ کامل اضافه کنید.`);
                break;
              }
            }
          } else if (item.kind === "choice") {
            const uncovered = item.options.find((option) => !hasRuleForAnswer(option.value));
            if (uncovered) errors.push(`گزینهٔ «${uncovered.label}» در قواعد پاسخ سؤال ${item.id} پوشش ندارد.`);
          } else if (!rules.some((rule) => rule.matchKind === "fallback")) {
            errors.push(`برای پوشش پاسخ‌های متنی سؤال ${item.id} یک fallback لازم است.`);
          }
        }
      }
    }
  }

  return [...new Set(errors)];
}

function valueForParameter(
  value: ResponseScoreValue,
  parameter: ResponseScoringParameter,
  effectId: string,
): ResponseScoreValue {
  if (parameter.valueKind === "numeric" && typeof value === "number" && !Number.isFinite(value)) {
    throw new Error(`response parameter ${parameter.id} is not finite`);
  }
  if (!isValueForKind(value, parameter.valueKind)) {
    throw new Error(`response effect ${effectId} produced a value incompatible with ${parameter.id}`);
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error(`response parameter ${parameter.id} is not finite`);
    if (parameter.minValue != null && value < parameter.minValue) throw new Error(`response parameter ${parameter.id} is below its minimum`);
    if (parameter.maxValue != null && value > parameter.maxValue) throw new Error(`response parameter ${parameter.id} exceeds its maximum`);
  }
  return value;
}

function applyEffect(
  item: Item,
  answer: number | string,
  effect: ResponseEffect,
  parameter: ResponseScoringParameter,
  values: Record<string, ResponseScoreValue>,
) {
  const source = item.kind === "range" ? numericSource(item, answer, effect.id) : answer;
  let next: ResponseScoreValue;

  if (effect.operation === "identity") {
    next = source;
  } else if (effect.operation === "reverse") {
    if (typeof source !== "number") throw new Error(`response effect ${effect.id} requires a numeric value`);
    next = 10 - source;
  } else if (effect.operation === "set_value") {
    if (effect.value === undefined) throw new Error(`response effect ${effect.id} has no set value`);
    next = effect.value;
  } else if (effect.operation === "add") {
    if (typeof effect.value !== "number" || !Number.isFinite(effect.value)) throw new Error(`response effect ${effect.id} has an invalid addend`);
    const current = values[effect.parameterId] ?? 0;
    if (typeof current !== "number") throw new Error(`response effect ${effect.id} cannot add to a non-numeric value`);
    next = current + effect.value;
  } else if (effect.operation === "multiply") {
    const current = values[effect.parameterId];
    if (typeof current !== "number" || typeof effect.coefficient !== "number") {
      throw new Error(`response effect ${effect.id} requires a preceding numeric effect before multiply`);
    }
    next = current * effect.coefficient;
  } else if (effect.operation === "weighted_value") {
    if (typeof source !== "number" || typeof effect.coefficient !== "number") {
      throw new Error(`response effect ${effect.id} requires a numeric answer and coefficient`);
    }
    const current = values[effect.parameterId] ?? 0;
    if (typeof current !== "number") throw new Error(`response effect ${effect.id} cannot weight a non-numeric value`);
    next = current + source * effect.coefficient;
  } else {
    throw new Error(`unknown response effect operation for ${effect.id}`);
  }

  values[effect.parameterId] = valueForParameter(next, parameter, effect.id);
}

/** Apply matched answer effects before formulas. Question-level effects run first, then the first matching rule's effects. */
export function applyResponseScoring(
  pack: AnalyzerPack,
  answers: AnswerMap,
): Record<string, ResponseScoreValue> {
  const errors = validateResponseScoring(pack, { requireCoverage: pack.status === "open" });
  if (errors.length) throw new Error(errors[0]);

  const values: Record<string, ResponseScoreValue> = {};
  const parameters = parameterMap(pack);
  const rules = pack.responseRules ?? [];
  const effects = pack.responseEffects ?? [];

  for (const item of itemsOf(pack)) {
    if (!Object.prototype.hasOwnProperty.call(answers, item.id)) continue;
    const answer = normalizeAnswer(item, answers[item.id]);
    if (answer == null) throw new Error(`invalid answer for response scoring question ${item.id}`);
    const matchedRule = firstMatchingRule(rules.filter((rule) => rule.questionId === item.id), item, answer);
    const selectedEffects = [
      ...effects.filter((effect) => effect.questionId === item.id && effect.ruleId == null),
      ...effects.filter((effect) => effect.questionId === item.id && matchedRule != null && effect.ruleId === matchedRule.id),
    ];
    for (const effect of selectedEffects) {
      const parameter = parameters.get(effect.parameterId);
      if (!parameter) throw new Error(`unknown response parameter ${effect.parameterId}`);
      applyEffect(item, answer, effect, parameter, values);
    }
  }

  return values;
}

/** Options for the rule/effect editor, including inferred formula and section outputs. */
export function responseParameterOptions(pack: AnalyzerPack): ResponseScoringParameter[] {
  return scoringParametersOf(pack);
}
