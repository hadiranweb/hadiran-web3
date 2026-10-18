import { findItem, itemsOf, type AnalyzerPack, type Item } from "@/lib/analyzers/pack";

export type AnswerMap = Record<string, number | string>;

export type AttemptView = {
  instrumentVersion: string;
  status: "in_progress" | "submitted";
  consentAt: string | null;
  answers: AnswerMap;
  submittedAt: string | null;
  referrerPublicCode: string | null;
  discountCode: string | null;
  results: {
    version: string;
    effective: Record<string, number>;
    scores: Record<string, number | string>;
  } | null;
};

export function normalizeAnswer(item: Item, value: unknown): number | string | null {
  if (item.kind === "range") {
    if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > 10) {
      return null;
    }
    return value;
  }
  if (item.kind === "text") {
    if (typeof value !== "string") return null;
    const trimmed = value.replace(/\s+/g, " ").trim();
    if (!trimmed || trimmed.length > item.maxLength) return null;
    return trimmed;
  }
  if (typeof value !== "string") return null;
  return item.options.some((option) => option.value === value) ? value : null;
}

export function filterAnswers(pack: AnalyzerPack, value: unknown): AnswerMap {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: AnswerMap = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    const item = findItem(pack, key);
    if (!item) continue;
    const normalized = normalizeAnswer(item, raw);
    if (normalized != null) out[key] = normalized;
  }
  return out;
}

export function isAnswered(item: Item, answers: AnswerMap): boolean {
  return normalizeAnswer(item, answers[item.id]) != null;
}

export function answeredCount(pack: AnalyzerPack, answers: AnswerMap): number {
  return itemsOf(pack).filter((item) => isAnswered(item, answers)).length;
}

export function isComplete(pack: AnalyzerPack, answers: AnswerMap): boolean {
  const items = itemsOf(pack);
  return items.length > 0 && items.every((item) => isAnswered(item, answers));
}

export function firstUnansweredIndex(pack: AnalyzerPack, answers: AnswerMap): number {
  const items = itemsOf(pack);
  const index = items.findIndex((item) => !isAnswered(item, answers));
  return index < 0 ? Math.max(items.length - 1, 0) : index;
}
