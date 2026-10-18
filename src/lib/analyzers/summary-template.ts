/** قالب یک‌پاراگرافی برای عضو؛ تفسیر کامل فقط در میز آزمون‌ساز. بدون eval. */

import { buildCasioReport } from "@/lib/analyzers/casio-ss/report";
import { buildGenericReport } from "@/lib/analyzers/generic-report";
import { findItem, itemsOf, type AnalyzerPack } from "@/lib/analyzers/pack";
import type { PackScore } from "@/lib/analyzers/score";

const FA = "۰۱۲۳۴۵۶۷۸۹";
const HIDDEN_IDS = new Set(["gate-band"]);
const HIDDEN_VALUES = new Set(["green", "yellow", "red"]);

const ALIASES: Record<string, string> = {
  نام: "name",
  نمره_کل: "total",
  بلوغ: "maturity",
  گلوگاه: "bottleneck",
  کسب_وکار: "business",
};

const FALLBACK = "پاسخ‌های شما ثبت شد. تفسیر تفصیلی نزد آزمون‌ساز می‌ماند.";

export const DEFAULT_USER_SUMMARY =
  "ارزیابی «{name}» ثبت شد. در این نوبت بلوغ سیستم {maturity} است و گلوگاه {bottleneck} دیده می‌شود. تفسیر تفصیلی نزد آزمون‌ساز می‌ماند.";

function faNum(value: number | string) {
  return String(value).replace(/\d/g, (digit) => FA[Number(digit)] ?? digit);
}

function faScore(value: number) {
  const rounded = Math.round(value * 10) / 10;
  return faNum(Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1));
}

function hidden(id: string, value: number | string): boolean {
  if (HIDDEN_IDS.has(id) || id.endsWith(":gate-band")) return true;
  if (typeof value === "string" && HIDDEN_VALUES.has(value)) return true;
  return false;
}

function displayAnswer(pack: AnalyzerPack, id: string, raw: number | string): string {
  const item = findItem(pack, id);
  if (item?.kind === "choice" && typeof raw === "string") {
    return item.options.find((option) => option.value === raw)?.label ?? raw;
  }
  if (typeof raw === "number") return faScore(raw);
  return String(raw);
}

export function summaryVars(
  pack: AnalyzerPack,
  answers: Record<string, number | string>,
  results: PackScore | null,
): Record<string, string> {
  const vars: Record<string, string> = {
    name: pack.nameFa,
    closing: pack.report?.closingFa ?? "",
  };

  const nameId = pack.report?.businessNameItemId ?? "BIZ.1";
  const businessRaw = answers[nameId];
  if (typeof businessRaw === "string" && businessRaw.trim()) {
    vars.business = businessRaw.trim();
  }

  for (const item of itemsOf(pack)) {
    const raw = answers[item.id];
    if (raw == null || raw === "") continue;
    vars[item.id] = displayAnswer(pack, item.id, raw);
  }

  const scores = results?.scores ?? {};
  for (const [id, value] of Object.entries(scores)) {
    if (hidden(id, value)) continue;
    if (id === "bottleneck" && typeof value === "string") {
      const finding = pack.findings.find((row) => row.id === value);
      vars.bottleneck = finding?.titleFa ?? value;
      vars["bottleneck.id"] = value;
      continue;
    }
    if (id === "maturity" && typeof value === "string") {
      const formula = pack.formulas.find((row) => row.id === "maturity");
      vars.maturity = formula?.bands?.find((band) => band.id === value)?.labelFa ?? value;
      continue;
    }
    if (id === "diagnosis-total" && typeof value === "number") {
      vars.total = faScore(value);
      vars["diagnosis-total"] = vars.total;
      continue;
    }
    vars[id] = typeof value === "number" ? faScore(value) : String(value);
  }

  for (const finding of pack.findings) {
    vars[`${finding.id}.title`] = finding.titleFa;
    if (finding.asIsFa) vars[`${finding.id}.as_is`] = finding.asIsFa;
    if (finding.toBeFa) vars[`${finding.id}.to_be`] = finding.toBeFa;
    if (finding.actionsFa) vars[`${finding.id}.actions`] = finding.actionsFa;
    const score = scores[finding.id];
    if (typeof score === "number") {
      vars[finding.id] = faScore(score);
      vars[`${finding.id}.score`] = faScore(score);
    }
  }

  if (pack.slug === "casio-ss") {
    try {
      const report = buildCasioReport(pack, answers, results);
      vars.total = faScore(report.total);
      vars["diagnosis-total"] = vars.total;
      vars.maturity = report.maturity.labelFa;
      vars.bottleneck = report.bottleneck.titleFa;
      vars["bottleneck.title"] = report.bottleneck.titleFa;
      vars["bottleneck.score"] = faScore(report.bottleneck.score);
      vars["bottleneck.id"] = report.bottleneck.id;
      if (report.businessName) vars.business = report.businessName;
      vars.closing = report.closingFa;
      for (const layer of report.layers) {
        vars[layer.id] = faScore(layer.score);
        vars[`${layer.id}.score`] = faScore(layer.score);
        vars[`${layer.id}.title`] = layer.titleFa;
        vars[`${layer.id}.as_is`] = layer.asIsFa;
        vars[`${layer.id}.to_be`] = layer.toBeFa;
        vars[`${layer.id}.actions`] = layer.actionsFa;
        vars[`${layer.id}.band`] = layer.band.labelFa;
        if (layer.isBottleneck) {
          vars["bottleneck.as_is"] = layer.asIsFa;
          vars["bottleneck.to_be"] = layer.toBeFa;
          vars["bottleneck.actions"] = layer.actionsFa;
          vars["bottleneck.band"] = layer.band.labelFa;
        }
      }
    } catch {
      // keep score snapshot vars
    }
  } else {
    try {
      const report = buildGenericReport(pack, answers, results);
      if (report.bottleneck) {
        vars.bottleneck = report.bottleneck.titleFa;
        vars["bottleneck.id"] = report.bottleneck.id;
      }
      for (const row of report.scores) {
        vars[row.id] = typeof row.value === "number" ? faScore(row.value) : String(row.value);
      }
    } catch {
      // keep snapshot vars
    }
  }

  return vars;
}

export function interpolateSummary(template: string, vars: Record<string, string>): string {
  return template.replace(/\{([^{}\n]+)\}/g, (_, raw: string) => {
    const key = raw.trim();
    const resolved = ALIASES[key] ?? key;
    return Object.prototype.hasOwnProperty.call(vars, resolved) ? vars[resolved]! : "";
  });
}

export function renderUserSummary(
  pack: AnalyzerPack,
  answers: Record<string, number | string>,
  results: PackScore | null,
): string {
  const template =
    pack.report?.userSummaryTemplateFa?.trim() ||
    (pack.slug === "casio-ss" ? DEFAULT_USER_SUMMARY : "");
  if (!template) return FALLBACK;
  const text = interpolateSummary(template, summaryVars(pack, answers, results)).replace(/\n{3,}/g, "\n\n").trim();
  return text || FALLBACK;
}

export function summaryPlaceholders(pack: AnalyzerPack): { token: string; hintFa: string }[] {
  const rows: { token: string; hintFa: string }[] = [
    { token: "{name}", hintFa: "نام آزمون" },
    { token: "{total}", hintFa: "نمرهٔ کل" },
    { token: "{maturity}", hintFa: "برچسب بلوغ" },
    { token: "{bottleneck}", hintFa: "عنوان گلوگاه" },
    { token: "{bottleneck.score}", hintFa: "نمرهٔ گلوگاه" },
    { token: "{bottleneck.as_is}", hintFa: "وضع موجود گلوگاه" },
    { token: "{bottleneck.to_be}", hintFa: "وضع مطلوب گلوگاه" },
    { token: "{bottleneck.actions}", hintFa: "اقدام گلوگاه" },
    { token: "{business}", hintFa: "نام کسب‌وکار" },
    { token: "{closing}", hintFa: "جملهٔ پایانی" },
  ];
  for (const finding of pack.findings) {
    rows.push({ token: `{${finding.id}}`, hintFa: `نمرهٔ ${finding.titleFa}` });
    rows.push({ token: `{${finding.id}.as_is}`, hintFa: `وضع موجود ${finding.titleFa}` });
  }
  return rows;
}
