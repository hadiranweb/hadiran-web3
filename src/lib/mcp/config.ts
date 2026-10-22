import { eq } from "drizzle-orm";
import { db, hasDatabaseUrl } from "@/db";
import { mcpConfigs, mcpTopicRules, topics } from "@/db/schema";
import { canSealBotSecrets, openSecret, sealSecret, tokenHintOf } from "@/lib/bots/secret";
import {
  DEFAULT_MCP_CONFIG,
  cleanText,
  parseAudienceLevel,
  parseMaxHistoryTurns,
  parseMaxTokens,
  parseMode,
  parseModeOverride,
  parseResponseStyle,
  parseTemperature,
  parseTimeoutMs,
  parseWeights,
  type McpConfig,
  type McpTopicRule,
} from "./types";

type McpConfigRow = typeof mcpConfigs.$inferSelect;
type McpTopicRuleRow = typeof mcpTopicRules.$inferSelect;

function rowToConfig(row: McpConfigRow): McpConfig {
  let llmApiKey: string | null = null;
  if (row.llmApiKeyCipher) {
    try {
      llmApiKey = openSecret(row.llmApiKeyCipher);
    } catch {
      llmApiKey = null;
    }
  }
  return {
    mode: parseMode(row.mode),
    llmProvider: row.llmProvider || "openai_compatible",
    llmBaseUrl: row.llmBaseUrl || DEFAULT_MCP_CONFIG.llmBaseUrl,
    llmModel: row.llmModel || DEFAULT_MCP_CONFIG.llmModel,
    llmApiKey,
    llmApiKeyHint: row.llmApiKeyHint,
    llmTemperature: parseTemperature(row.llmTemperature),
    llmMaxTokens: parseMaxTokens(row.llmMaxTokens),
    llmTimeoutMs: parseTimeoutMs(row.llmTimeoutMs),
    audienceLevel: parseAudienceLevel(row.audienceContextLevel),
    maxHistoryTurns: parseMaxHistoryTurns(row.maxHistoryTurns),
    enableKnowledgeTool: row.enableKnowledgeTool,
    enableArticleLayers: row.enableArticleLayers,
    enableProjectsTool: row.enableProjectsTool,
    enableCoursesTool: row.enableCoursesTool,
    enableAnalyzersTool: row.enableAnalyzersTool,
    enableExternalEndpoint: row.enableExternalMcpEndpoint,
    externalTokenHint: row.externalMcpTokenHint,
    weights: parseWeights(row.weights),
    defaultSystemPromptFa: row.defaultSystemPromptFa,
    defaultLocalTemplateFa: row.defaultLocalTemplateFa,
    lastLlmStatus: row.lastLlmStatus,
    lastLlmError: row.lastLlmError,
    lastLlmAt: row.lastLlmAt ? row.lastLlmAt.toISOString() : null,
    fromDb: true,
  };
}

/**
 * خواندن تنظیمات فعال موتور. Fail-soft کامل:
 * بدون DATABASE_URL، بدون جدول (مایگریشن 0032 اجرا نشده) یا بدون ردیف → پیش‌فرض ایمن (حالت لوکال).
 */
export async function getMcpConfig(): Promise<McpConfig> {
  if (!hasDatabaseUrl()) return { ...DEFAULT_MCP_CONFIG, weights: { ...DEFAULT_MCP_CONFIG.weights } };
  try {
    const [row] = await db.select().from(mcpConfigs).where(eq(mcpConfigs.id, "default")).limit(1);
    // جدول هست ولی هنوز ردیفی ذخیره نشده (مایگریشن فقط جدول می‌سازد):
    // پیش‌فرض ایمن برمی‌گردد اما fromDb درست است تا میز هشدار «جدول ساخته نشده» ندهد
    // و ذخیرهٔ اول همان ردیف را بسازد.
    if (!row) return { ...DEFAULT_MCP_CONFIG, weights: { ...DEFAULT_MCP_CONFIG.weights }, fromDb: true };
    return rowToConfig(row);
  } catch {
    return { ...DEFAULT_MCP_CONFIG, weights: { ...DEFAULT_MCP_CONFIG.weights } };
  }
}

/** نمای امن برای API مدیریت: کلید خام و cipher هرگز بیرون نمی‌روند. */
export function toAdminConfig(config: McpConfig) {
  const { llmApiKey, ...rest } = config;
  return { ...rest, hasApiKey: Boolean(llmApiKey), llmApiKey: undefined };
}

function rowToRule(row: McpTopicRuleRow): McpTopicRule {
  return {
    topicSlug: row.topicSlug,
    enabled: row.enabled,
    modeOverride: parseModeOverride(row.modeOverride),
    responseStyle: parseResponseStyle(row.responseStyle),
    customPromptFa: row.customPromptFa,
    customLocalLeadFa: row.customLocalLeadFa,
    closingQuestionOverrideFa: row.closingQuestionOverrideFa,
    preferredAnalyzerSlug: row.preferredAnalyzerSlug,
    priorityBoost: row.priorityBoost ?? 0,
  };
}

export async function getTopicRule(topicSlug: string): Promise<McpTopicRule | null> {
  if (!hasDatabaseUrl() || !topicSlug) return null;
  try {
    const [row] = await db
      .select()
      .from(mcpTopicRules)
      .where(eq(mcpTopicRules.topicSlug, topicSlug))
      .limit(1);
    if (!row || !row.enabled) return null;
    return rowToRule(row);
  } catch {
    return null;
  }
}

export async function listTopicRules(): Promise<McpTopicRule[]> {
  if (!hasDatabaseUrl()) return [];
  try {
    const rows = await db.select().from(mcpTopicRules);
    return rows.map(rowToRule);
  } catch {
    return [];
  }
}

export async function listTopicsForRules(): Promise<{ slug: string; labelFa: string }[]> {
  if (!hasDatabaseUrl()) return [];
  try {
    return await db.select({ slug: topics.slug, labelFa: topics.labelFa }).from(topics);
  } catch {
    return [];
  }
}

export interface SaveMcpConfigInput {
  mode?: unknown;
  llmProvider?: unknown;
  llmBaseUrl?: unknown;
  llmModel?: unknown;
  llmApiKey?: unknown;
  clearLlmApiKey?: unknown;
  llmTemperature?: unknown;
  llmMaxTokens?: unknown;
  llmTimeoutMs?: unknown;
  audienceLevel?: unknown;
  maxHistoryTurns?: unknown;
  enableKnowledgeTool?: unknown;
  enableArticleLayers?: unknown;
  enableProjectsTool?: unknown;
  enableCoursesTool?: unknown;
  enableAnalyzersTool?: unknown;
  enableExternalEndpoint?: unknown;
  externalToken?: unknown;
  clearExternalToken?: unknown;
  weights?: unknown;
  defaultSystemPromptFa?: unknown;
  defaultLocalTemplateFa?: unknown;
}

export async function saveMcpConfig(
  accountId: number,
  input: SaveMcpConfigInput,
): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  if (!hasDatabaseUrl()) {
    return { ok: false, error: "اتصال دیتابیس برقرار نیست؛ تنظیمات ذخیره نشد.", status: 503 };
  }

  const values: Partial<typeof mcpConfigs.$inferInsert> = {
    id: "default",
    updatedBy: accountId,
    updatedAt: new Date(),
  };

  if (input.mode !== undefined) values.mode = parseMode(input.mode);
  if (input.llmProvider !== undefined) values.llmProvider = cleanText(input.llmProvider, 32) ?? "openai_compatible";
  if (input.llmBaseUrl !== undefined) values.llmBaseUrl = cleanText(input.llmBaseUrl, 512) ?? DEFAULT_MCP_CONFIG.llmBaseUrl;
  if (input.llmModel !== undefined) values.llmModel = cleanText(input.llmModel, 128) ?? DEFAULT_MCP_CONFIG.llmModel;
  if (input.llmTemperature !== undefined) values.llmTemperature = parseTemperature(input.llmTemperature);
  if (input.llmMaxTokens !== undefined) values.llmMaxTokens = parseMaxTokens(input.llmMaxTokens);
  if (input.llmTimeoutMs !== undefined) values.llmTimeoutMs = parseTimeoutMs(input.llmTimeoutMs);
  if (input.audienceLevel !== undefined) values.audienceContextLevel = parseAudienceLevel(input.audienceLevel);
  if (input.maxHistoryTurns !== undefined) values.maxHistoryTurns = parseMaxHistoryTurns(input.maxHistoryTurns);
  if (input.enableKnowledgeTool !== undefined) values.enableKnowledgeTool = Boolean(input.enableKnowledgeTool);
  if (input.enableArticleLayers !== undefined) values.enableArticleLayers = Boolean(input.enableArticleLayers);
  if (input.enableProjectsTool !== undefined) values.enableProjectsTool = Boolean(input.enableProjectsTool);
  if (input.enableCoursesTool !== undefined) values.enableCoursesTool = Boolean(input.enableCoursesTool);
  if (input.enableAnalyzersTool !== undefined) values.enableAnalyzersTool = Boolean(input.enableAnalyzersTool);
  if (input.enableExternalEndpoint !== undefined) values.enableExternalMcpEndpoint = Boolean(input.enableExternalEndpoint);
  if (input.weights !== undefined) values.weights = parseWeights(input.weights);
  if (input.defaultSystemPromptFa !== undefined) values.defaultSystemPromptFa = cleanText(input.defaultSystemPromptFa);
  if (input.defaultLocalTemplateFa !== undefined) values.defaultLocalTemplateFa = cleanText(input.defaultLocalTemplateFa);

  const newKey = typeof input.llmApiKey === "string" ? input.llmApiKey.trim() : "";
  if (newKey) {
    if (!canSealBotSecrets()) {
      return { ok: false, error: "کلید رمزنگاری سرور تنظیم نشده است؛ کلید ذخیره نشد.", status: 503 };
    }
    values.llmApiKeyCipher = sealSecret(newKey);
    values.llmApiKeyHint = `••••${tokenHintOf(newKey)}`;
  } else if (input.clearLlmApiKey === true) {
    values.llmApiKeyCipher = null;
    values.llmApiKeyHint = null;
  }

  const newToken = typeof input.externalToken === "string" ? input.externalToken.trim() : "";
  if (newToken) {
    if (!canSealBotSecrets()) {
      return { ok: false, error: "کلید رمزنگاری سرور تنظیم نشده است؛ توکن ذخیره نشد.", status: 503 };
    }
    values.externalMcpTokenCipher = sealSecret(newToken);
    values.externalMcpTokenHint = `••••${tokenHintOf(newToken)}`;
  } else if (input.clearExternalToken === true) {
    values.externalMcpTokenCipher = null;
    values.externalMcpTokenHint = null;
  }

  try {
    await db
      .insert(mcpConfigs)
      .values(values as typeof mcpConfigs.$inferInsert)
      .onConflictDoUpdate({ target: mcpConfigs.id, set: values });
    return { ok: true };
  } catch {
    return { ok: false, error: "ذخیره ناموفق بود؛ شاید مایگریشن 0032 هنوز اجرا نشده است.", status: 500 };
  }
}

export interface SaveTopicRuleInput {
  topicSlug?: unknown;
  enabled?: unknown;
  modeOverride?: unknown;
  responseStyle?: unknown;
  customPromptFa?: unknown;
  customLocalLeadFa?: unknown;
  closingQuestionOverrideFa?: unknown;
  preferredAnalyzerSlug?: unknown;
  priorityBoost?: unknown;
}

export async function saveTopicRule(
  input: SaveTopicRuleInput,
): Promise<{ ok: true; rule: McpTopicRule } | { ok: false; error: string; status: number }> {
  if (!hasDatabaseUrl()) {
    return { ok: false, error: "اتصال دیتابیس برقرار نیست؛ قانون ذخیره نشد.", status: 503 };
  }
  const topicSlug = cleanText(input.topicSlug, 64);
  if (!topicSlug) return { ok: false, error: "موضوع انتخاب نشده است.", status: 400 };

  const boostRaw = typeof input.priorityBoost === "number" ? input.priorityBoost : Number(input.priorityBoost);
  const values: typeof mcpTopicRules.$inferInsert = {
    topicSlug,
    enabled: input.enabled === undefined ? true : Boolean(input.enabled),
    modeOverride: parseModeOverride(input.modeOverride),
    responseStyle: parseResponseStyle(input.responseStyle),
    customPromptFa: cleanText(input.customPromptFa),
    customLocalLeadFa: cleanText(input.customLocalLeadFa, 2000),
    closingQuestionOverrideFa: cleanText(input.closingQuestionOverrideFa, 2000),
    preferredAnalyzerSlug: cleanText(input.preferredAnalyzerSlug, 64),
    priorityBoost: Number.isFinite(boostRaw) ? Math.round(Math.min(50, Math.max(-50, boostRaw))) : 0,
    updatedAt: new Date(),
  };

  try {
    const [row] = await db
      .insert(mcpTopicRules)
      .values(values)
      .onConflictDoUpdate({ target: mcpTopicRules.topicSlug, set: values })
      .returning();
    return { ok: true, rule: rowToRule(row) };
  } catch {
    return { ok: false, error: "ذخیرهٔ قانون ناموفق بود؛ موضوع باید در جدول موضوع‌ها وجود داشته باشد.", status: 500 };
  }
}

export async function deleteTopicRule(topicSlug: string): Promise<boolean> {
  if (!hasDatabaseUrl() || !topicSlug) return false;
  try {
    await db.delete(mcpTopicRules).where(eq(mcpTopicRules.topicSlug, topicSlug));
    return true;
  } catch {
    return false;
  }
}

/** ثبت وضعیت آخرین فراخوانی LLM برای پنل مدیریت. بهترین تلاش؛ هرگز چت را نمی‌شکند. */
export async function recordLlmStatus(status: "ok" | "error", error?: string): Promise<void> {
  if (!hasDatabaseUrl()) return;
  try {
    await db
      .insert(mcpConfigs)
      .values({
        id: "default",
        lastLlmStatus: status,
        lastLlmError: status === "error" ? (error ?? "unknown").slice(0, 1000) : null,
        lastLlmAt: new Date(),
      })
      .onConflictDoUpdate({
        target: mcpConfigs.id,
        set: {
          lastLlmStatus: status,
          lastLlmError: status === "error" ? (error ?? "unknown").slice(0, 1000) : null,
          lastLlmAt: new Date(),
        },
      });
  } catch {
    // جدول هنوز ساخته نشده یا DB قطع است؛ وضعیت ثبت نمی‌شود و مهم نیست.
  }
}

/** خواندن cipher توکن اندپوینت بیرونی برای مقایسهٔ امن در /api/mcp. */
export async function openExternalToken(): Promise<string | null> {
  if (!hasDatabaseUrl()) return null;
  try {
    const [row] = await db
      .select({ cipher: mcpConfigs.externalMcpTokenCipher })
      .from(mcpConfigs)
      .where(eq(mcpConfigs.id, "default"))
      .limit(1);
    if (!row?.cipher) return null;
    return openSecret(row.cipher);
  } catch {
    return null;
  }
}
