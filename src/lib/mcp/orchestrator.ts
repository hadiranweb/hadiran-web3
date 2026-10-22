import { hasDatabaseUrl } from "@/db";
import type { ChatReferences, RetrievedEntity } from "@/lib/ai";
import { normalizeQueryTokens } from "@/lib/ai";
import type { SessionAccount } from "@/lib/auth/session";
import { getMcpConfig, recordLlmStatus } from "./config";
import { getAudienceContext } from "./context";
import { buildLlmMessages, runLlmChat } from "./llm-runner";
import { composeLocalAnswer, GREETING_ANSWER, type LocalComposition } from "./local-composer";
import { effectiveTools } from "./registry";
import { applyValuePolicy } from "./service-types";
import { resolveTopicGraph, searchEcosystem, searchKnowledge } from "./tools";
import type { AudienceContext, EcosystemHits, KnowledgeHit, McpConfig, McpMode, McpTopicRule, TopicHit } from "./types";

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

interface GatheredTurn {
  config: McpConfig;
  topics: TopicHit[];
  rule: McpTopicRule | null;
  audience: AudienceContext;
  knowledge: KnowledgeHit[];
  ecosystem: EcosystemHits;
  local: LocalComposition;
  effectiveMode: McpMode;
}

/** اجرای مشترک ابزارها و ساخت پاسخ لوکال؛ هم چت واقعی و هم سندباکس مدیریت از همین می‌گذرند. */
async function gatherTurn(input: {
  message: string;
  conversationId?: number | null;
  account: SessionAccount | null;
}): Promise<GatheredTurn> {
  const config = await getMcpConfig();
  const databaseReady = hasDatabaseUrl();

  // حکمرانی سرویس MCP: اگر رجیستری بذر دارد، خاموشی سرور/ابزار و سقف مقادیر اینجا واقعاً اعمال می‌شود.
  // اگر رجیستری هنوز نیست (ready=false) رفتار پیش‌فرض کد حفظ می‌شود تا سایت نشکند.
  const eff = await effectiveTools("home_chat");
  const effTool = (slug: string, name: string) =>
    eff.tools.find((t) => t.server.slug === slug && t.tool.name === name);
  const gateOn = (slug: string, name: string) => !eff.ready || Boolean(effTool(slug, name));
  const knowledgeTool = effTool("knowledge", "search_knowledge");
  const knowledgeArgs = knowledgeTool
    ? applyValuePolicy(knowledgeTool.tool, knowledgeTool.paramOverrides, { query: input.message })
    : null;
  const knowledgeLimit = typeof knowledgeArgs?.limit === "number" ? (knowledgeArgs.limit as number) : undefined;

  const graph = gateOn("ecosystem", "resolve_topic_graph")
    ? await resolveTopicGraph(input.message, config.weights)
    : { topics: [] as TopicHit[], topicIds: [] as number[] };
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

  const ecosystem = gateOn("ecosystem", "search_ecosystem")
    ? await searchEcosystem(input.message, {
        topicIds: graph.topicIds,
        includeProjects: config.enableProjectsTool,
        includeCourses: config.enableCoursesTool,
        includeAnalyzers: config.enableAnalyzersTool,
        weights: config.weights,
      })
    : { projects: [], courses: [], analyzers: [] };

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

  return { config, topics: graph.topics, rule, audience, knowledge, ecosystem, local, effectiveMode };
}

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

  const turn = await gatherTurn(input);
  const { config, local } = turn;

  if (turn.effectiveMode === "llm" && databaseReady) {
    try {
      const messages = buildLlmMessages({
        config,
        query: input.message,
        knowledge: turn.knowledge,
        ecosystem: turn.ecosystem,
        topics: turn.topics,
        rule: turn.rule,
        audience: turn.audience,
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

export interface McpPreviewResult {
  effectiveMode: McpMode;
  audienceLevel: AudienceContext["level"];
  topics: { slug: string; name: string }[];
  tools: {
    knowledge: string[];
    projects: string[];
    courses: string[];
    analyzers: string[];
  };
  local: { answer: string; references: ChatReferences };
  llm: { answer: string | null; error: string | null; ms: number | null };
}

/**
 * سندباکس میز مدیریت: خروجی لوکال و LLM کنار هم.
 * فقط با زمینهٔ خودِ owner اجرا می‌شود؛ حساب دیگری جعل نمی‌شود.
 */
export async function previewMcpTurn(input: {
  message: string;
  account: SessionAccount | null;
}): Promise<McpPreviewResult> {
  const turn = await gatherTurn({ message: input.message, conversationId: null, account: input.account });
  const { config } = turn;

  let llm: McpPreviewResult["llm"] = { answer: null, error: null, ms: null };
  if (config.llmApiKey) {
    const started = Date.now();
    try {
      const answer = await runLlmChat({
        config,
        messages: buildLlmMessages({
          config,
          query: input.message,
          knowledge: turn.knowledge,
          ecosystem: turn.ecosystem,
          topics: turn.topics,
          rule: turn.rule,
          audience: turn.audience,
        }),
      });
      llm = { answer, error: null, ms: Date.now() - started };
      void recordLlmStatus("ok");
    } catch (error) {
      llm = {
        answer: null,
        error: error instanceof Error ? error.message : String(error),
        ms: Date.now() - started,
      };
      void recordLlmStatus("error", llm.error ?? undefined);
    }
  } else {
    llm = { answer: null, error: "llm_not_configured", ms: null };
  }

  return {
    effectiveMode: turn.effectiveMode,
    audienceLevel: turn.audience.level,
    topics: turn.topics.map((t) => ({ slug: t.slug, name: t.name })),
    tools: {
      knowledge: turn.knowledge.map((k) => k.slug),
      projects: turn.ecosystem.projects.map((p) => p.slug),
      courses: turn.ecosystem.courses.map((c) => c.slug),
      analyzers: turn.ecosystem.analyzers.map((a) => a.slug),
    },
    local: { answer: turn.local.answer, references: turn.local.references },
    llm,
  };
}
