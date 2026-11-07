"use client";

import { useMemo, useState } from "react";
import type {
  AnalyzerPack,
  Item,
  ParameterValueKind,
  ResponseEffect,
  ResponseEffectOperation,
  ResponseRule,
  ResponseRuleMatchKind,
  ScoringParameter,
} from "@/lib/analyzers/pack";
import {
  responseParameterOptions,
  validateResponseScoring,
} from "@/lib/analyzers/response-scoring";
import { itemsOf } from "@/lib/analyzers/pack";

const fieldClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-400 disabled:bg-slate-100 disabled:text-slate-500";
const buttonClass = "rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-40";

const operationLabels: Record<ResponseEffectOperation, string> = {
  identity: "کپی پاسخ",
  reverse: "معکوس نمرهٔ ۰ تا ۱۰",
  set_value: "جای‌گذاری مقدار ثابت",
  add: "افزودن مقدار ثابت به جمع فعلی",
  multiply: "ضرب مقدار فعلی در ضریب",
  weighted_value: "افزودن نمرهٔ مؤثر × ضریب",
};

const kindLabels: Record<ParameterValueKind, string> = {
  numeric: "عددی",
  category: "دسته‌ای",
  reference: "ارجاعی",
  boolean: "دوحالته",
  text: "متنی",
};

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

function optionalNumber(raw: string): number | undefined {
  if (!raw.trim()) return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
}

function displayQuestion(item: Item) {
  return `${item.text.slice(0, 90)} (${item.id})`;
}

function stringParameter(kind: ParameterValueKind) {
  return kind === "category" || kind === "reference" || kind === "text";
}

function allowedOperations(item: Item, parameter: ScoringParameter & { valueKind: ParameterValueKind }): ResponseEffectOperation[] {
  const operations: ResponseEffectOperation[] = ["set_value"];
  if (parameter.valueKind === "numeric") {
    operations.push("add", "multiply");
    if (item.kind === "range") operations.unshift("identity", "reverse");
    if (item.kind === "range") operations.push("weighted_value");
  } else if (stringParameter(parameter.valueKind) && (item.kind === "choice" || item.kind === "text")) {
    operations.unshift("identity");
  }
  return operations;
}

function defaultEffect(
  question: Item,
  parameter: ScoringParameter & { valueKind: ParameterValueKind },
  ruleId?: string,
): ResponseEffect {
  const effect: ResponseEffect = {
    id: uid("effect"),
    questionId: question.id,
    ...(ruleId ? { ruleId } : {}),
    parameterId: parameter.id,
    operation: "set_value",
    value: parameter.valueKind === "boolean" ? false : parameter.valueKind === "numeric" ? 0 : "",
  };
  if (parameter.valueKind === "numeric") {
    if (question.kind === "range") {
      effect.operation = "weighted_value";
      effect.coefficient = 1;
      delete effect.value;
    } else {
      effect.operation = "add";
      effect.value = 1;
    }
  } else if (stringParameter(parameter.valueKind) && (question.kind === "choice" || question.kind === "text")) {
    effect.operation = "identity";
    delete effect.value;
  }
  return effect;
}

function reorderRules(rows: ResponseRule[], questionId: string, ruleId: string, delta: number): ResponseRule[] {
  const positions = rows.map((row, index) => row.questionId === questionId ? index : -1).filter((index) => index >= 0);
  const group = positions.map((index) => rows[index]!);
  const current = group.findIndex((row) => row.id === ruleId);
  const target = current + delta;
  if (current < 0 || target < 0 || target >= group.length) return rows;
  [group[current], group[target]] = [group[target]!, group[current]!];
  const next = [...rows];
  positions.forEach((position, index) => { next[position] = group[index]!; });
  return next;
}

function reorderEffects(
  rows: ResponseEffect[],
  questionId: string,
  ruleId: string | undefined,
  effectId: string,
  delta: number,
): ResponseEffect[] {
  const positions = rows
    .map((row, index) => row.questionId === questionId && (row.ruleId ?? undefined) === ruleId ? index : -1)
    .filter((index) => index >= 0);
  const group = positions.map((index) => rows[index]!);
  const current = group.findIndex((row) => row.id === effectId);
  const target = current + delta;
  if (current < 0 || target < 0 || target >= group.length) return rows;
  [group[current], group[target]] = [group[target]!, group[current]!];
  const next = [...rows];
  positions.forEach((position, index) => { next[position] = group[index]!; });
  return next;
}

export function ResponseScoringEditor({
  pack,
  onChange,
}: {
  pack: AnalyzerPack;
  onChange: (pack: AnalyzerPack) => void;
}) {
  const questions = useMemo(() => itemsOf(pack), [pack]);
  const [selectedQuestionId, setSelectedQuestionId] = useState(() => questions[0]?.id ?? "");
  const question = questions.find((item) => item.id === selectedQuestionId) ?? questions[0];
  const rules = pack.responseRules ?? [];
  const effects = pack.responseEffects ?? [];
  const parameters = responseParameterOptions(pack);
  const diagnostics = validateResponseScoring(pack, { requireCoverage: pack.status === "open" });
  const parametersById = new Map(parameters.map((parameter) => [parameter.id, parameter]));

  function addParameter() {
    const parameter: ScoringParameter = {
      id: uid("trait"),
      labelFa: "بُعد تازه",
      valueKind: question?.kind === "range" ? "numeric" : question?.kind === "choice" ? "category" : "text",
    };
    onChange({ ...pack, parameters: [...(pack.parameters ?? []), parameter] });
  }

  function updateParameter(index: number, parameter: ScoringParameter) {
    const next = [...(pack.parameters ?? [])];
    next[index] = parameter;
    onChange({ ...pack, parameters: next });
  }

  function removeParameter(index: number) {
    const next = [...(pack.parameters ?? [])];
    next.splice(index, 1);
    onChange({ ...pack, parameters: next });
  }

  function addRule(item: Item) {
    const id = uid("rule");
    let rule: ResponseRule;
    if (item.kind === "choice") {
      rule = { id, questionId: item.id, matchKind: "option", optionValue: item.options[0]?.value ?? "" };
    } else if (item.kind === "range") {
      rule = {
        id,
        questionId: item.id,
        matchKind: "numeric_range",
        rangeMin: 0,
        rangeMax: 10,
        minInclusive: true,
        maxInclusive: true,
      };
    } else {
      rule = { id, questionId: item.id, matchKind: "fallback" };
    }
    onChange({ ...pack, responseRules: [...rules, rule] });
  }

  function updateRule(updated: ResponseRule, previousId?: string) {
    const nextRules = rules.map((rule) => rule.questionId === updated.questionId && rule.id === (previousId ?? updated.id) ? updated : rule);
    const nextEffects = previousId && previousId !== updated.id
      ? effects.map((effect) => effect.questionId === updated.questionId && effect.ruleId === previousId ? { ...effect, ruleId: updated.id } : effect)
      : effects;
    onChange({ ...pack, responseRules: nextRules, responseEffects: nextEffects });
  }

  function changeRuleKind(rule: ResponseRule, matchKind: ResponseRuleMatchKind) {
    const next: ResponseRule = { id: rule.id, questionId: rule.questionId, matchKind };
    if (matchKind === "option" && question?.kind === "choice") next.optionValue = question.options[0]?.value ?? "";
    if (matchKind === "exact_value") next.exactValue = question?.kind === "choice" ? question.options[0]?.value ?? "" : "";
    if (matchKind === "numeric_range") {
      next.rangeMin = 0;
      next.rangeMax = 10;
      next.minInclusive = true;
      next.maxInclusive = true;
    }
    updateRule(next);
  }

  function deleteRule(rule: ResponseRule) {
    onChange({
      ...pack,
      responseRules: rules.filter((row) => row.questionId !== rule.questionId || row.id !== rule.id),
      responseEffects: effects.filter((effect) => effect.questionId !== rule.questionId || effect.ruleId !== rule.id),
    });
  }

  function addEffect(item: Item, ruleId?: string) {
    let parameter = parameters[0];
    let nextParameters = pack.parameters ?? [];
    if (!parameter) {
      const created: ScoringParameter = {
        id: uid("trait"),
        labelFa: "بُعد تازه",
        valueKind: item.kind === "range" ? "numeric" : item.kind === "choice" ? "category" : "text",
      };
      nextParameters = [...nextParameters, created];
      parameter = { ...created, valueKind: created.valueKind ?? "numeric" };
    }
    const effect = defaultEffect(item, parameter, ruleId);
    onChange({
      ...pack,
      parameters: nextParameters,
      responseEffects: [...effects, effect],
    });
  }

  function updateEffect(updated: ResponseEffect, previousId = updated.id) {
    onChange({ ...pack, responseEffects: effects.map((effect) => effect.id === previousId ? updated : effect) });
  }

  function removeEffect(effectId: string) {
    onChange({ ...pack, responseEffects: effects.filter((effect) => effect.id !== effectId) });
  }

  function canRemoveParameter(parameter: ScoringParameter): boolean {
    const referencedByEffects = effects.some((effect) => effect.parameterId === parameter.id);
    const referencedByFormula = pack.formulas.some((formula) =>
      formula.of?.includes(parameter.id) ||
      formula.watch?.includes(parameter.id) ||
      formula.weights?.some((weight) => weight.item === parameter.id || weight.dimension === parameter.id),
    );
    const referencedByGraph = pack.edges.some((edge) => edge.from === parameter.id || edge.to === parameter.id);
    return !referencedByEffects && !referencedByFormula && !referencedByGraph;
  }

  if (!question) {
    return <section className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">برای افزودن قواعد پاسخ، ابتدا سؤال بسازید.</section>;
  }

  const questionRules = rules.filter((rule) => rule.questionId === question.id);
  const defaultEffects = effects.filter((effect) => effect.questionId === question.id && effect.ruleId == null);
  const allowedRuleKinds: ResponseRuleMatchKind[] = question.kind === "range"
    ? ["numeric_range", "fallback"]
    : question.kind === "choice"
      ? ["option", "exact_value", "fallback"]
      : ["exact_value", "fallback"];

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="text-base font-bold text-slate-900">پارامترهای امتیاز</h2>
        <p className="mt-1 text-xs leading-6 text-slate-500">پارامتر صریح برای بُعدهای تازه است؛ خروجی فرمول‌ها و بخش‌ها نیز به‌عنوان مقصد قابل انتخاب‌اند.</p>
        <div className="mt-4 space-y-3">
          {(pack.parameters ?? []).map((parameter, index) => {
            const locked = !canRemoveParameter(parameter);
            return (
              <div key={`${parameter.id}-${index}`} className="grid gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3 sm:grid-cols-7">
                <label className="block text-xs text-slate-500 sm:col-span-1">
                  شناسه
                  <input
                    className={`${fieldClass} mt-1`}
                    dir="ltr"
                    value={parameter.id}
                    disabled={locked}
                    onChange={(event) => updateParameter(index, { ...parameter, id: event.target.value })}
                  />
                </label>
                <label className="block text-xs text-slate-500 sm:col-span-2">
                  نام فارسی
                  <input
                    className={`${fieldClass} mt-1`}
                    value={parameter.labelFa}
                    onChange={(event) => updateParameter(index, { ...parameter, labelFa: event.target.value })}
                  />
                </label>
                <label className="block text-xs text-slate-500 sm:col-span-1">
                  نوع
                  <select
                    className={`${fieldClass} mt-1`}
                    value={parameter.valueKind ?? "numeric"}
                    onChange={(event) => {
                      const valueKind = event.target.value as ParameterValueKind;
                      const next = { ...parameter, valueKind };
                      if (valueKind !== "numeric") {
                        delete next.minValue;
                        delete next.maxValue;
                      }
                      updateParameter(index, next);
                    }}
                  >
                    {Object.entries(kindLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </label>
                <label className="block text-xs text-slate-500 sm:col-span-1">
                  کمینه
                  <input
                    className={`${fieldClass} mt-1`}
                    type="number"
                    step="any"
                    disabled={parameter.valueKind != null && parameter.valueKind !== "numeric"}
                    value={parameter.minValue ?? ""}
                    onChange={(event) => updateParameter(index, { ...parameter, minValue: optionalNumber(event.target.value) })}
                  />
                </label>
                <label className="block text-xs text-slate-500 sm:col-span-1">
                  بیشینه
                  <input
                    className={`${fieldClass} mt-1`}
                    type="number"
                    step="any"
                    disabled={parameter.valueKind != null && parameter.valueKind !== "numeric"}
                    value={parameter.maxValue ?? ""}
                    onChange={(event) => updateParameter(index, { ...parameter, maxValue: optionalNumber(event.target.value) })}
                  />
                </label>
                <label className="block text-xs text-slate-500 sm:col-span-1">
                  واحد
                  <input className={`${fieldClass} mt-1`} value={parameter.unit ?? ""} onChange={(event) => updateParameter(index, { ...parameter, unit: event.target.value || undefined })} />
                </label>
                <button
                  type="button"
                  className={`${buttonClass} sm:col-span-7 sm:justify-self-end`}
                  disabled={locked}
                  title={locked ? "این پارامتر در اثر، فرمول یا یال استفاده شده است." : undefined}
                  onClick={() => removeParameter(index)}
                >
                  حذف پارامتر
                </button>
              </div>
            );
          })}
        </div>
        <button type="button" className="mt-3 text-sm font-medium text-indigo-700" onClick={addParameter}>+ پارامتر</button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">قواعد پاسخ و اثرها</h2>
            <p className="mt-1 max-w-3xl text-xs leading-6 text-slate-500">
              ابتدا اولین قاعدهٔ مطابق اجرا می‌شود؛ fallback فقط وقتی قاعدهٔ دقیق‌تری پیدا نشود. اثر عمومی همیشه پیش از اثرهای قاعده اجرا می‌شود. مقیاس‌ها پس از معکوس سؤال سنجیده می‌شوند.
            </p>
          </div>
          <select
            aria-label="انتخاب سؤال برای ویرایش قواعد پاسخ"
            className={`${fieldClass} w-auto min-w-64`}
            value={question.id}
            onChange={(event) => setSelectedQuestionId(event.target.value)}
          >
            {questions.map((item) => <option key={item.id} value={item.id}>{displayQuestion(item)}</option>)}
          </select>
        </div>

        <div className="mt-4 rounded-xl bg-slate-50 p-3">
          <p className="text-sm font-medium text-slate-800">{question.text}</p>
          <p className="mt-1 text-xs text-slate-500" dir="ltr">{question.id} · {question.kind}</p>
          {question.kind === "range" ? <p className="mt-1 text-xs text-slate-500">مرزهای قاعده با عدد خام پاسخ ۰ تا ۱۰ تطبیق می‌شوند؛ identity/reverse/weighted_value از نمرهٔ مؤثر استفاده می‌کنند.</p> : null}
        </div>

        <div className="mt-5 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">اثرهای عمومی این سؤال</h3>
              <p className="mt-1 text-xs text-slate-500">برای هر پاسخ معتبر اجرا می‌شوند، حتی اگر قاعده‌ای مطابق نباشد.</p>
            </div>
            <button type="button" className={buttonClass} onClick={() => addEffect(question)}>+ اثر عمومی</button>
          </div>
          {defaultEffects.length ? (
            <EffectList
              question={question}
              effects={defaultEffects}
              parameters={parametersById}
              onChange={updateEffect}
              onRemove={removeEffect}
              onMove={(effectId, delta) => onChange({ ...pack, responseEffects: reorderEffects(effects, question.id, undefined, effectId, delta) })}
            />
          ) : <p className="mt-3 text-xs text-slate-400">اثری تعریف نشده است.</p>}
        </div>

        <div className="mt-5 space-y-4">
          {questionRules.map((rule, index) => {
            const ruleEffects = effects.filter((effect) => effect.questionId === question.id && effect.ruleId === rule.id);
            return (
              <div key={`${rule.questionId}:${rule.id}`} className="rounded-xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-slate-800">قاعده {index + 1}</h3>
                  <div className="flex gap-2">
                    <button type="button" className={buttonClass} disabled={index === 0} onClick={() => onChange({ ...pack, responseRules: reorderRules(rules, question.id, rule.id, -1) })}>بالا</button>
                    <button type="button" className={buttonClass} disabled={index === questionRules.length - 1} onClick={() => onChange({ ...pack, responseRules: reorderRules(rules, question.id, rule.id, 1) })}>پایین</button>
                    <button type="button" className={buttonClass} onClick={() => deleteRule(rule)}>حذف قاعده</button>
                  </div>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  <label className="block text-xs text-slate-500">
                    شناسهٔ قاعده
                    <input
                      className={`${fieldClass} mt-1`}
                      dir="ltr"
                      value={rule.id}
                      onChange={(event) => updateRule({ ...rule, id: event.target.value }, rule.id)}
                    />
                  </label>
                  <label className="block text-xs text-slate-500">
                    نوع تطبیق
                    <select className={`${fieldClass} mt-1`} value={rule.matchKind} onChange={(event) => changeRuleKind(rule, event.target.value as ResponseRuleMatchKind)}>
                      {allowedRuleKinds.map((kind) => <option key={kind} value={kind}>{ruleKindLabel(kind)}</option>)}
                    </select>
                  </label>
                  <label className="block text-xs text-slate-500">
                    برچسب اختیاری
                    <input className={`${fieldClass} mt-1`} value={rule.labelFa ?? ""} onChange={(event) => updateRule({ ...rule, labelFa: event.target.value })} />
                  </label>
                </div>
                {rule.matchKind === "option" && question.kind === "choice" ? (
                  <label className="mt-3 block text-xs text-slate-500">
                    گزینه
                    <select className={`${fieldClass} mt-1`} value={rule.optionValue ?? ""} onChange={(event) => updateRule({ ...rule, optionValue: event.target.value })}>
                      {question.options.map((option) => <option key={option.value} value={option.value}>{option.label} ({option.value})</option>)}
                    </select>
                  </label>
                ) : null}
                {rule.matchKind === "exact_value" ? (
                  question.kind === "choice" ? (
                    <label className="mt-3 block text-xs text-slate-500">
                      گزینهٔ دقیق
                      <select className={`${fieldClass} mt-1`} value={rule.exactValue ?? ""} onChange={(event) => updateRule({ ...rule, exactValue: event.target.value })}>
                        {question.options.map((option) => <option key={option.value} value={option.value}>{option.label} ({option.value})</option>)}
                      </select>
                    </label>
                  ) : (
                    <label className="mt-3 block text-xs text-slate-500">
                      متن دقیق
                      <input className={`${fieldClass} mt-1`} value={rule.exactValue ?? ""} onChange={(event) => updateRule({ ...rule, exactValue: event.target.value })} />
                    </label>
                  )
                ) : null}
                {rule.matchKind === "numeric_range" ? (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <label className="block text-xs text-slate-500">
                      از
                      <input className={`${fieldClass} mt-1`} type="number" min="0" max="10" step="1" value={rule.rangeMin ?? ""} onChange={(event) => updateRule({ ...rule, rangeMin: optionalNumber(event.target.value) })} />
                      <span className="mt-1 flex items-center gap-2 text-xs"><input type="checkbox" checked={rule.minInclusive !== false} onChange={(event) => updateRule({ ...rule, minInclusive: event.target.checked })} /> شامل مرز پایین</span>
                    </label>
                    <label className="block text-xs text-slate-500">
                      تا
                      <input className={`${fieldClass} mt-1`} type="number" min="0" max="10" step="1" value={rule.rangeMax ?? ""} onChange={(event) => updateRule({ ...rule, rangeMax: optionalNumber(event.target.value) })} />
                      <span className="mt-1 flex items-center gap-2 text-xs"><input type="checkbox" checked={rule.maxInclusive !== false} onChange={(event) => updateRule({ ...rule, maxInclusive: event.target.checked })} /> شامل مرز بالا</span>
                    </label>
                  </div>
                ) : null}

                <div className="mt-4 border-t border-slate-100 pt-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-xs font-semibold text-slate-700">اثرهای این قاعده</h4>
                    <button type="button" className={buttonClass} onClick={() => addEffect(question, rule.id)}>+ اثر به این قاعده</button>
                  </div>
                  {ruleEffects.length ? (
                    <EffectList
                      question={question}
                      effects={ruleEffects}
                      parameters={parametersById}
                      onChange={updateEffect}
                      onRemove={removeEffect}
                      onMove={(effectId, delta) => onChange({ ...pack, responseEffects: reorderEffects(effects, question.id, rule.id, effectId, delta) })}
                    />
                  ) : <p className="mt-2 text-xs text-slate-400">تا پیش از انتشار، برای این قاعده اثر اضافه کنید.</p>}
                </div>
              </div>
            );
          })}
        </div>

        <button type="button" className="mt-4 text-sm font-medium text-indigo-700" onClick={() => addRule(question)}>+ قاعدهٔ پاسخ</button>
      </div>

      {diagnostics.length ? (
        <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-900">تعریف امتیاز نیاز به اصلاح دارد</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-xs leading-6 text-amber-900">
            {diagnostics.map((message, index) => <li key={`${index}:${message}`}>{message}</li>)}
          </ul>
        </div>
      ) : (
        <p className="rounded-xl border border-teal-200 bg-teal-50 p-3 text-xs text-teal-900">ارجاع‌ها، نوع پارامترها و پوشش قواعد پاسخ معتبر است.</p>
      )}
    </section>
  );
}

function ruleKindLabel(kind: ResponseRuleMatchKind) {
  if (kind === "option") return "گزینه";
  if (kind === "numeric_range") return "بازهٔ عددی";
  if (kind === "exact_value") return "مقدار دقیق";
  return "fallback";
}

function EffectList({
  question,
  effects,
  parameters,
  onChange,
  onRemove,
  onMove,
}: {
  question: Item;
  effects: ResponseEffect[];
  parameters: Map<string, ReturnType<typeof responseParameterOptions>[number]>;
  onChange: (effect: ResponseEffect, previousId?: string) => void;
  onRemove: (effectId: string) => void;
  onMove: (effectId: string, delta: number) => void;
}) {
  return (
    <ul className="mt-3 space-y-3">
      {effects.map((effect, index) => {
        const parameter = parameters.get(effect.parameterId);
        const allowed = parameter ? allowedOperations(question, parameter) : ["set_value" as const];
        return (
          <li key={effect.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
            <div className="grid gap-2 sm:grid-cols-3">
              <label className="block text-xs text-slate-500">
                شناسهٔ اثر
                <input className={`${fieldClass} mt-1`} dir="ltr" value={effect.id} onChange={(event) => onChange({ ...effect, id: event.target.value }, effect.id)} />
              </label>
              <label className="block text-xs text-slate-500">
                پارامتر مقصد
                <select
                  className={`${fieldClass} mt-1`}
                  value={effect.parameterId}
                  onChange={(event) => {
                    const nextParameter = parameters.get(event.target.value);
                    if (!nextParameter) return;
                    onChange({ ...defaultEffect(question, nextParameter, effect.ruleId), id: effect.id }, effect.id);
                  }}
                >
                  {[...parameters.values()].map((option) => <option key={option.id} value={option.id}>{option.labelFa} · {option.id} ({kindLabels[option.valueKind]})</option>)}
                </select>
              </label>
              <label className="block text-xs text-slate-500">
                operation
                <select
                  className={`${fieldClass} mt-1`}
                  value={effect.operation}
                  onChange={(event) => {
                    const operation = event.target.value as ResponseEffectOperation;
                    const next: ResponseEffect = { ...effect, operation };
                    delete next.value;
                    delete next.coefficient;
                    if (operation === "set_value") next.value = parameter?.valueKind === "numeric" ? 0 : parameter?.valueKind === "boolean" ? false : "";
                    if (operation === "add") next.value = 0;
                    if (operation === "multiply" || operation === "weighted_value") next.coefficient = 1;
                    onChange(next);
                  }}
                >
                  {allowed.map((operation) => <option key={operation} value={operation}>{operationLabels[operation]}</option>)}
                </select>
              </label>
            </div>
            {effect.operation === "set_value" ? (
              <label className="mt-2 block text-xs text-slate-500">
                مقدار ثابت
                {parameter?.valueKind === "boolean" ? (
                  <select className={`${fieldClass} mt-1`} value={effect.value === true ? "true" : "false"} onChange={(event) => onChange({ ...effect, value: event.target.value === "true" })}>
                    <option value="true">بله</option><option value="false">خیر</option>
                  </select>
                ) : parameter?.valueKind === "numeric" ? (
                  <input className={`${fieldClass} mt-1`} type="number" step="any" value={typeof effect.value === "number" ? effect.value : ""} onChange={(event) => onChange({ ...effect, value: optionalNumber(event.target.value) ?? 0 })} />
                ) : (
                  <input className={`${fieldClass} mt-1`} value={typeof effect.value === "string" ? effect.value : ""} onChange={(event) => onChange({ ...effect, value: event.target.value })} />
                )}
              </label>
            ) : null}
            {effect.operation === "add" ? (
              <label className="mt-2 block text-xs text-slate-500">
                مقدار افزوده‌شونده
                <input className={`${fieldClass} mt-1`} type="number" step="any" value={typeof effect.value === "number" ? effect.value : 0} onChange={(event) => onChange({ ...effect, value: optionalNumber(event.target.value) ?? 0 })} />
              </label>
            ) : null}
            {effect.operation === "multiply" || effect.operation === "weighted_value" ? (
              <label className="mt-2 block text-xs text-slate-500">
                ضریب
                <input className={`${fieldClass} mt-1`} type="number" step="any" value={effect.coefficient ?? 1} onChange={(event) => onChange({ ...effect, coefficient: optionalNumber(event.target.value) ?? 0 })} />
              </label>
            ) : null}
            {effect.operation === "multiply" ? <p className="mt-2 text-xs text-slate-500">نیازمند اثر قبلی در همین پاسخ است که مقدار عددی مقصد را بسازد.</p> : null}
            <div className="mt-2 flex justify-end gap-2">
              <button type="button" className={buttonClass} disabled={index === 0} onClick={() => onMove(effect.id, -1)}>بالا</button>
              <button type="button" className={buttonClass} disabled={index === effects.length - 1} onClick={() => onMove(effect.id, 1)}>پایین</button>
              <button type="button" className={buttonClass} onClick={() => onRemove(effect.id)}>حذف اثر</button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
