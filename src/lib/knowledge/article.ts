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

export type ArticleLayerRow = {
  growth: string | null;
  readingMinutes: number | null;
  lineFa: string | null;
  questionFa: string | null;
  rootFa: string | null;
  firstStepFa: string | null;
  marginNoteFa: string | null;
  prunedAt: Date | null;
  audioUrl: string | null;
  simulator: ArticleSimulator | null;
  closingQuestionFa: string | null;
  closingOptions: ClosingOption[];
  closingPromptFa: string | null;
  relatedSlugs: string[];
};

const emptyLayers: ArticleLayerRow = {
  growth: null,
  readingMinutes: null,
  lineFa: null,
  questionFa: null,
  rootFa: null,
  firstStepFa: null,
  marginNoteFa: null,
  prunedAt: null,
  audioUrl: null,
  simulator: null,
  closingQuestionFa: null,
  closingOptions: [],
  closingPromptFa: null,
  relatedSlugs: [],
};

function nullableText(value: unknown, fallback: string | null) {
  if (value === null) return null;
  if (typeof value === "string") return value.trim() || null;
  return fallback;
}

function nullableDate(value: unknown, fallback: Date | null) {
  if (value === null || value === "") return null;
  if (typeof value !== "string") return fallback;
  const date = new Date(value.length === 10 ? `${value}T12:00:00+03:30` : value);
  return Number.isNaN(date.getTime()) ? fallback : date;
}

export function parseRelatedSlugs(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((row) => (typeof row === "string" ? row.trim() : "")).filter(Boolean))];
}

export function parseArticleLayers(
  body: Record<string, unknown>,
  existing?: Partial<ArticleLayerRow> | null,
): ArticleLayerRow {
  const base: ArticleLayerRow = {
    ...emptyLayers,
    ...existing,
    closingOptions: existing?.closingOptions ?? [],
    relatedSlugs: existing?.relatedSlugs ?? [],
  };
  const has = (key: string) => Object.prototype.hasOwnProperty.call(body, key);
  let readingMinutes = base.readingMinutes;
  if (has("readingMinutes")) {
    const raw = body.readingMinutes;
    if (raw === null || raw === "") readingMinutes = null;
    else if (typeof raw === "number" && Number.isFinite(raw)) readingMinutes = Math.max(0, Math.round(raw));
    else if (typeof raw === "string" && raw.trim()) {
      const parsed = Number(raw);
      readingMinutes = Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : null;
    }
  }
  return {
    growth: has("growth")
      ? isKnowledgeGrowth(body.growth)
        ? body.growth
        : body.growth === null || body.growth === ""
          ? null
          : base.growth
      : base.growth,
    readingMinutes,
    lineFa: has("lineFa") ? nullableText(body.lineFa, base.lineFa) : base.lineFa,
    questionFa: has("questionFa") ? nullableText(body.questionFa, base.questionFa) : base.questionFa,
    rootFa: has("rootFa") ? nullableText(body.rootFa, base.rootFa) : base.rootFa,
    firstStepFa: has("firstStepFa") ? nullableText(body.firstStepFa, base.firstStepFa) : base.firstStepFa,
    marginNoteFa: has("marginNoteFa") ? nullableText(body.marginNoteFa, base.marginNoteFa) : base.marginNoteFa,
    prunedAt: has("prunedAt") ? nullableDate(body.prunedAt, base.prunedAt) : base.prunedAt,
    audioUrl: has("audioUrl") ? nullableText(body.audioUrl, base.audioUrl) : base.audioUrl,
    simulator: has("simulator") ? parseSimulator(body.simulator) : base.simulator,
    closingQuestionFa: has("closingQuestionFa")
      ? nullableText(body.closingQuestionFa, base.closingQuestionFa)
      : base.closingQuestionFa,
    closingOptions: has("closingOptions") ? parseClosingOptions(body.closingOptions) : base.closingOptions,
    closingPromptFa: has("closingPromptFa") ? nullableText(body.closingPromptFa, base.closingPromptFa) : base.closingPromptFa,
    relatedSlugs: has("relatedSlugs") ? parseRelatedSlugs(body.relatedSlugs) : base.relatedSlugs,
  };
}
