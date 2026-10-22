/**
 * تایپ‌های مشترک موتور گفتگوی MCP و مقادیر پیش‌فرض ایمن.
 * این فایل خالص است (بدون DB) تا هم در تست و هم در حالت بدون دیتابیس استفاده شود.
 */

export type McpMode = "local" | "llm";
export type AudienceLevel = "none" | "conversation" | "profile" | "mirror_insights";
export type ResponseStyle = "clarify_first" | "action_first" | "deep_reference";
export type ModeOverride = "inherit" | McpMode;

export interface McpWeights {
  title: number;
  summary: number;
  body: number;
  topic: number;
  hopBonus: number;
}

/** تنظیمات حل‌شدهٔ موتور. کلید خام هرگز در این شیء نیست. */
export interface McpConfig {
  mode: McpMode;
  llmProvider: string;
  llmBaseUrl: string;
  llmModel: string;
  /** فقط روی سرور، از رمزگشایی لحظه‌ای؛ در پاسخ API ادمین هرگز برنمی‌گردد. */
  llmApiKey: string | null;
  llmApiKeyHint: string | null;
  llmTemperature: number;
  llmMaxTokens: number;
  llmTimeoutMs: number;
  audienceLevel: AudienceLevel;
  maxHistoryTurns: number;
  enableKnowledgeTool: boolean;
  enableArticleLayers: boolean;
  enableProjectsTool: boolean;
  enableCoursesTool: boolean;
  enableAnalyzersTool: boolean;
  enableExternalEndpoint: boolean;
  externalTokenHint: string | null;
  weights: McpWeights;
  defaultSystemPromptFa: string | null;
  defaultLocalTemplateFa: string | null;
  lastLlmStatus: string | null;
  lastLlmError: string | null;
  lastLlmAt: string | null;
  /** آیا ردیف واقعی از DB خوانده شد یا پیش‌فرض ایمن برگشته است. */
  fromDb: boolean;
}

export const DEFAULT_MCP_WEIGHTS: McpWeights = { title: 3, summary: 2, body: 1, topic: 4, hopBonus: 8 };

export const DEFAULT_MCP_CONFIG: McpConfig = {
  mode: "local",
  llmProvider: "openai_compatible",
  llmBaseUrl: "https://api.openai.com/v1",
  llmModel: "gpt-4o-mini",
  llmApiKey: null,
  llmApiKeyHint: null,
  llmTemperature: 0.3,
  llmMaxTokens: 700,
  llmTimeoutMs: 8000,
  audienceLevel: "conversation",
  maxHistoryTurns: 4,
  enableKnowledgeTool: true,
  enableArticleLayers: true,
  enableProjectsTool: true,
  enableCoursesTool: true,
  enableAnalyzersTool: true,
  enableExternalEndpoint: false,
  externalTokenHint: null,
  weights: { ...DEFAULT_MCP_WEIGHTS },
  defaultSystemPromptFa: null,
  defaultLocalTemplateFa: null,
  lastLlmStatus: null,
  lastLlmError: null,
  lastLlmAt: null,
  fromDb: false,
};

export interface McpTopicRule {
  topicSlug: string;
  enabled: boolean;
  modeOverride: ModeOverride;
  responseStyle: ResponseStyle;
  customPromptFa: string | null;
  customLocalLeadFa: string | null;
  closingQuestionOverrideFa: string | null;
  preferredAnalyzerSlug: string | null;
  priorityBoost: number;
}

export interface KnowledgeHit {
  slug: string;
  title: string;
  summary: string | null;
  lineFa: string | null;
  questionFa: string | null;
  rootFa: string | null;
  firstStepFa: string | null;
  closingQuestionFa: string | null;
  closingOptions: string[] | null;
  relevance: number;
}

export interface EcosystemHits {
  projects: { slug: string; name: string; summary: string | null; relevance: number }[];
  courses: { slug: string; title: string; summary: string | null; relevance: number }[];
  analyzers: { slug: string; nameFa: string; summaryFa: string; relevance: number }[];
}

export interface TopicHit {
  slug: string;
  name: string;
  summary: string | null;
  relevance: number;
  rule: McpTopicRule | null;
}

export interface AudienceContext {
  level: AudienceLevel;
  isGuest: boolean;
  displayName: string | null;
  history: { role: "user" | "assistant"; content: string }[];
  mirror: {
    coverTitle: string;
    maturityLabel: string | null;
    bottleneckName: string | null;
    bottleneckScore: number | null;
    layerAsIs: string | null;
    layerToBe: string | null;
  } | null;
}

const AUDIENCE_LEVELS: AudienceLevel[] = ["none", "conversation", "profile", "mirror_insights"];
const RESPONSE_STYLES: ResponseStyle[] = ["clarify_first", "action_first", "deep_reference"];

export function parseAudienceLevel(value: unknown): AudienceLevel {
  return typeof value === "string" && (AUDIENCE_LEVELS as string[]).includes(value)
    ? (value as AudienceLevel)
    : "conversation";
}

export function parseResponseStyle(value: unknown): ResponseStyle {
  return typeof value === "string" && (RESPONSE_STYLES as string[]).includes(value)
    ? (value as ResponseStyle)
    : "clarify_first";
}

export function parseMode(value: unknown): McpMode {
  return value === "llm" ? "llm" : "local";
}

export function parseModeOverride(value: unknown): ModeOverride {
  return value === "local" || value === "llm" ? value : "inherit";
}

function clampNumber(value: unknown, fallback: number, min: number, max: number): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export function parseWeights(value: unknown): McpWeights {
  const raw = (value && typeof value === "object" ? value : {}) as Partial<Record<keyof McpWeights, unknown>>;
  return {
    title: clampNumber(raw.title, DEFAULT_MCP_WEIGHTS.title, 0, 50),
    summary: clampNumber(raw.summary, DEFAULT_MCP_WEIGHTS.summary, 0, 50),
    body: clampNumber(raw.body, DEFAULT_MCP_WEIGHTS.body, 0, 50),
    topic: clampNumber(raw.topic, DEFAULT_MCP_WEIGHTS.topic, 0, 50),
    hopBonus: clampNumber(raw.hopBonus, DEFAULT_MCP_WEIGHTS.hopBonus, 0, 100),
  };
}

export function parseMaxHistoryTurns(value: unknown): number {
  return Math.round(clampNumber(value, 4, 0, 12));
}

export function parseTimeoutMs(value: unknown): number {
  return Math.round(clampNumber(value, 8000, 1000, 60000));
}

export function parseTemperature(value: unknown): number {
  return clampNumber(value, 0.3, 0, 2);
}

export function parseMaxTokens(value: unknown): number {
  return Math.round(clampNumber(value, 700, 64, 8000));
}

export function cleanText(value: unknown, max = 20000): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}
