export const KNOWLEDGE_GROWTH = ["seedling", "sprout", "tree"] as const;
export type KnowledgeGrowth = (typeof KNOWLEDGE_GROWTH)[number];

export const GROWTH_FA: Record<KnowledgeGrowth, { mark: string; label: string; hint: string }> = {
  seedling: { mark: "🌱", label: "نهال", hint: "تازه‌کاشته" },
  sprout: { mark: "🌿", label: "جوانه", hint: "در حال رشد" },
  tree: { mark: "🌳", label: "درخت", hint: "آزموده و ماندگار" },
};

export type ArticleDepth = "line" | "paragraph" | "full";

export type ArticleSimulator = {
  kind: "clarity_speed";
  titleFa?: string | null;
  introFa?: string | null;
};

export type ClosingOption = {
  labelFa: string;
  href?: string;
};

export function isKnowledgeGrowth(value: unknown): value is KnowledgeGrowth {
  return value === "seedling" || value === "sprout" || value === "tree";
}

export function growthLabel(growth: KnowledgeGrowth | null | undefined) {
  if (!growth) return null;
  const item = GROWTH_FA[growth];
  return `${item.mark}${item.label} — ${item.hint}`;
}

export function parseSimulator(value: unknown): ArticleSimulator | null {
  if (!value || typeof value !== "object") return null;
  const kind = (value as { kind?: unknown }).kind;
  if (kind !== "clarity_speed") return null;
  const titleFa = (value as { titleFa?: unknown }).titleFa;
  const introFa = (value as { introFa?: unknown }).introFa;
  return {
    kind,
    titleFa: typeof titleFa === "string" ? titleFa : null,
    introFa: typeof introFa === "string" ? introFa : null,
  };
}

export function parseClosingOptions(value: unknown): ClosingOption[] {
  if (!Array.isArray(value)) return [];
  const options: ClosingOption[] = [];
  for (const row of value) {
    if (!row || typeof row !== "object") continue;
    const labelFa = (row as { labelFa?: unknown }).labelFa;
    if (typeof labelFa !== "string" || !labelFa.trim()) continue;
    const href = (row as { href?: unknown }).href;
    options.push({
      labelFa: labelFa.trim(),
      href: typeof href === "string" && href.trim() ? href.trim() : undefined,
    });
  }
  return options;
}

export function gardenDateFa(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    month: "long",
    year: "numeric",
    timeZone: "Asia/Tehran",
  }).format(date);
}

export function minutesFa(value: number | null | undefined): string | null {
  if (value == null || !Number.isFinite(value) || value <= 0) return null;
  return `${value.toLocaleString("fa-IR")} دقیقه`;
}

export function defaultArticleDepth(input: {
  lineFa?: string | null;
  summaryFa?: string | null;
  bodyFa?: string | null;
}): ArticleDepth {
  if (input.summaryFa?.trim()) return "paragraph";
  if (input.bodyFa?.trim()) return "full";
  return "line";
}
