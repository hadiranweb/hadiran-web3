/** قالب نمایش سؤال و راهنما در تلگرام. بدون eval؛ فقط جایگزینی {token}. */

import { itemsOf, sectionOf, type AnalyzerPack, type Item } from "@/lib/analyzers/pack";

const FA = "۰۱۲۳۴۵۶۷۸۹";

function faNum(value: number | string) {
  return String(value).replace(/\d/g, (digit) => FA[Number(digit)] ?? digit);
}

export const DEFAULT_BOT_QUESTION_TEMPLATE = `**{question}**
---`;

export const DEFAULT_BOT_GUIDE_TEMPLATE = "";

export const BOT_QUESTION_TOKENS: { token: string; hintFa: string }[] = [
  { token: "{question}", hintFa: "متن سؤال از تب سؤال‌ها" },
  { token: "{section}", hintFa: "عنوان بخش" },
  { token: "{intro}", hintFa: "مقدمهٔ بخش" },
  { token: "{n}", hintFa: "شمارهٔ همین سؤال" },
  { token: "{total}", hintFa: "تعداد سؤال‌ها" },
  { token: "{exam}", hintFa: "نام آزمون" },
  { token: "{id}", hintFa: "شناسهٔ سؤال" },
  { token: "{kind}", hintFa: "مقیاس / گزینه / متن" },
  { token: "{anchor0}", hintFa: "لنگر ۰" },
  { token: "{anchor5}", hintFa: "لنگر ۵" },
  { token: "{anchor10}", hintFa: "لنگر ۱۰" },
  { token: "{options}", hintFa: "برچسب گزینه‌ها (سؤال گزینه‌ای)" },
  { token: "{max}", hintFa: "سقف نویسه در سؤال متنی" },
];

export function botQuestionTemplateOf(pack: AnalyzerPack) {
  const raw = pack.botDisplay?.questionTemplateFa?.trim();
  return raw || DEFAULT_BOT_QUESTION_TEMPLATE;
}

export function botGuideTemplateOf(pack: AnalyzerPack) {
  const display = pack.botDisplay;
  if (display && typeof display.guideTemplateFa === "string") return display.guideTemplateFa;
  return DEFAULT_BOT_GUIDE_TEMPLATE;
}

function kindFa(item: Item) {
  if (item.kind === "range") return "مقیاس ۰–۱۰";
  if (item.kind === "choice") return "گزینه";
  return "متن باز";
}

export function botQuestionVars(pack: AnalyzerPack, item: Item, index: number): Record<string, string> {
  const section = sectionOf(pack, item.id);
  const total = itemsOf(pack).length;
  return {
    question: item.text,
    section: section?.titleFa ?? "",
    intro: section?.introFa ?? "",
    n: faNum(index + 1),
    total: faNum(total),
    exam: pack.nameFa,
    id: item.id,
    kind: kindFa(item),
    anchor0: item.kind === "range" ? item.anchors[0] : "",
    anchor5: item.kind === "range" ? item.anchors[5] : "",
    anchor10: item.kind === "range" ? item.anchors[10] : "",
    options: item.kind === "choice" ? item.options.map((option) => `• ${option.label}`).join("\n") : "",
    max: item.kind === "text" ? faNum(item.maxLength) : "",
  };
}

export function interpolateBotQuestion(template: string, vars: Record<string, string>) {
  const filled = template.replace(/\{([A-Za-z0-9_.]+)\}/g, (match, key: string) => {
    if (Object.prototype.hasOwnProperty.call(vars, key)) return vars[key] ?? "";
    return match;
  });
  return filled
    .split("\n")
    .filter((line) => !/^[۰-۹0-9]+\s*—\s*$/.test(line.trim()))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function renderBotQuestionMarkdown(pack: AnalyzerPack, item: Item, index: number) {
  return interpolateBotQuestion(botQuestionTemplateOf(pack), botQuestionVars(pack, item, index));
}

export function renderBotGuideMarkdown(pack: AnalyzerPack, item: Item, index: number) {
  return interpolateBotQuestion(botGuideTemplateOf(pack), botQuestionVars(pack, item, index));
}
