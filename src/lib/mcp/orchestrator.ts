import { hasDatabaseUrl } from "@/db";
import type { ChatReferences, RetrievedEntity } from "@/lib/ai";
import { normalizeQueryTokens } from "@/lib/ai";
import type { SessionAccount } from "@/lib/auth/session";
import { getMcpConfig, recordLlmStatus } from "./config";
import { getAudienceContext } from "./context";
import { buildLlmMessages, runLlmChat } from "./llm-runner";
import { composeLocalAnswer, GREETING_ANSWER } from "./local-composer";
import { resolveTopicGraph, searchEcosystem, searchKnowledge } from "./tools";
import type { McpMode } from "./types";

export interface McpChatResult {
  answer: string;
  references: ChatReferences;
  related: RetrievedEntity[];
  modeUsed: McpMode;
  topicSlugs: string[];
  suggestedAnalyzer: { slug: string; nameFa: string } | null;
  followUpQuestions: string[];
}

const EMPTY_REFERENCES: ChatReferences = { knowledge: [], projects: [], courses: [], topics: [] };

/**
 * نقطهٔ ورود واحد چت خانه: تنظیمات → موضوع و قانون → ابزارها → مخاطب → لوکال یا LLM.
 * قرارداد خروجی با /api/chat قبلی سازگار است؛ modeUsed و موارد تکمیلی اختیاری‌اند.
 * Fail-soft: هر خطای LLM در همان درخواست به پاسخ لوکال برمی‌گردد و فقط برای owner ثبت می‌شود.
 */
export async function runMcpChatTurn(input: {
  message: string;
  conversationId?: number | null;
  /** فقط از سشن سرور؛ هرگز از body کلاینت. */
  account: SessionAccount | null;
}): Promise<McpChatResult> {
  const config = await getMcpConfig();
  const databaseReady = hasDatabaseUrl();

  if (databaseReady && normalizeQueryTokens(input.message).length === 0) {
    return {
      answer: GREETING_ANSWER,
      references: EMPTY_REFERENCES,
      related: [],
      modeUsed: "local",
      topicSlugs: [],
      suggestedAnalyzer: null,
      followUpQuestions: [],
    };
  }

  const graph = await resolveTopicGraph(input.message, config.weights);
  const topTopic = graph.topics[0] ?? null;
  const rule = topTopic?.rule ?? null;

  const audience = await getAudienceContext({
    account: input.account,
    conversationId: input.conversationId ?? null,
    config,
  });

  // بازیابی دانش: مستقیم ← محدود به موضوع اصلی ← با حافظهٔ گفتگو (اگر سطح مجاز باشد).
  let knowledge = config.enableKnowledgeTool
    ? await searchKnowledge(input.message, { weights: config.weights, includeLayers: config.enableArticleLayers })
    : [];
  if (knowledge.length === 0 && topTopic && config.enableKnowledgeTool) {
    knowledge = await searchKnowledge(input.message, {
      topicSlug: topTopic.slug,
      weights: config.weights,
      includeLayers: config.enableArticleLayers,
    });
  }
  if (knowledge.length === 0 && config.enableKnowledgeTool) {
    const lastUser = [...audience.history].reverse().find((h) => h.role === "user");
    if (lastUser && lastUser.content !== input.message) {
      knowledge = await searchKnowledge(`${lastUser.content} ${input.message}`, {
        weights: config.weights,
        includeLayers: config.enableArticleLayers,
      });
    }
  }

  const ecosystem = await searchEcosystem(input.message, {
    topicIds: graph.topicIds,
    includeProjects: config.enableProjectsTool,
    includeCourses: config.enableCoursesTool,
    includeAnalyzers: config.enableAnalyzersTool,
    weights: config.weights,
  });

  const local = composeLocalAnswer({
    knowledge,
    ecosystem,
    topics: graph.topics,
    rule,
    audience,
    config,
    databaseReady,
  });

  const effectiveMode: McpMode =
    rule && rule.modeOverride !== "inherit" ? rule.modeOverride : config.mode;

  if (effectiveMode === "llm" && databaseReady) {
    try {
      const messages = buildLlmMessages({
        config,
        query: input.message,
        knowledge,
        ecosystem,
        topics: graph.topics,
        rule,
        audience,
      });
      const answer = await runLlmChat({ config, messages });
      void recordLlmStatus("ok");
      return { ...local, answer, modeUsed: "llm" };
    } catch (error) {
      void recordLlmStatus("error", error instanceof Error ? error.message : String(error));
      return { ...local, modeUsed: "local" };
    }
  }

  return { ...local, modeUsed: "local" };
}
