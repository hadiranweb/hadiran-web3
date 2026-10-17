import { allItems, type Item } from "./instrument";

export type AnswerMap = Record<string, number | string>;

export type AttemptView = {
  instrumentVersion: string;
  status: "in_progress" | "submitted";
  consentAt: string | null;
  answers: AnswerMap;
  submittedAt: string | null;
  results: {
    version: string;
    effective: Record<string, number>;
    scores: Record<string, number | string>;
  } | null;
};

export function findItem(id: string): Item | undefined {
  return allItems.find((item) => item.id === id);
}

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

export function isAnswered(item: Item, answers: AnswerMap): boolean {
  return normalizeAnswer(item, answers[item.id]) != null;
}

export function answeredCount(answers: AnswerMap): number {
  return allItems.filter((item) => isAnswered(item, answers)).length;
}

export function isComplete(answers: AnswerMap): boolean {
  return allItems.every((item) => isAnswered(item, answers));
}

export function firstUnansweredIndex(answers: AnswerMap): number {
  const index = allItems.findIndex((item) => !isAnswered(item, answers));
  return index < 0 ? allItems.length - 1 : index;
}
