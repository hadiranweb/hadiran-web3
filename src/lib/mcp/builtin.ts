import type { SessionAccount } from "@/lib/auth/session";
import { getPublicKnowledgeBySlug } from "@/lib/knowledge/public";
import { getAudienceContext } from "./context";
import { resolveTopicGraph, searchEcosystem, searchKnowledge } from "./tools";
import type { McpConfig } from "./types";

/**
 * اجرای ابزارهای داخلی هادیران (سرورهای builtin).
 * مصرف‌کننده هرچه باشد (چت، اندپوینت بیرونی، تست میز) از همین در رد می‌شود
 * تا حکمرانی رجیستری در همهٔ متأثرها یکسان اعمال شود.
 */

export const BUILTIN_WORLDS = [
  { key: "house", labelFa: "خانه", path: "/ecosystem" },
  { key: "knowledge", labelFa: "باغ دانش", path: "/knowledge" },
  { key: "lab", labelFa: "کارگاه", path: "/lab" },
  { key: "mirrors", labelFa: "آینه‌ها", path: "/analyzers" },
  { key: "courses", labelFa: "دوره‌ها", path: "/courses" },
  { key: "shop", labelFa: "فروشگاه", path: "/shop" },
  { key: "person", labelFa: "درباره من", path: "/hadiran" },
];

export interface BuiltinContext {
  account: SessionAccount | null;
  config: McpConfig;
}

export async function dispatchBuiltinTool(
  serverSlug: string,
  name: string,
  args: Record<string, unknown>,
  ctx: BuiltinContext,
): Promise<unknown> {
  const query = typeof args.query === "string" ? args.query : "";
  switch (`${serverSlug}/${name}`) {
    case "knowledge/search_knowledge": {
      if (!query) throw new Error("query_required");
      const items = await searchKnowledge(query, {
        topicSlug: typeof args.topicSlug === "string" ? args.topicSlug : null,
        limit: typeof args.limit === "number" ? args.limit : 4,
        weights: ctx.config.weights,
        includeLayers: ctx.config.enableArticleLayers,
      });
      return { items };
    }
    case "ecosystem/search_ecosystem": {
      if (!query) throw new Error("query_required");
      return searchEcosystem(query, {
        includeProjects: true,
        includeCourses: true,
        includeAnalyzers: args.includeMirrors !== false,
        weights: ctx.config.weights,
      });
    }
    case "ecosystem/resolve_topic_graph": {
      if (!query) throw new Error("query_required");
      const graph = await resolveTopicGraph(query, ctx.config.weights);
      return { topics: graph.topics };
    }
    case "audience/get_audience_context": {
      // حساب فقط از سشن سرورِ مصرف‌کننده می‌آید؛ آرگومان کلاینت هرگز خوانده نمی‌شود.
      const audience = await getAudienceContext({
        account: ctx.account,
        conversationId: null,
        config: ctx.config,
      });
      return {
        level: audience.level,
        isGuest: audience.isGuest,
        displayName: audience.displayName,
        history: audience.history,
        mirror: audience.mirror,
      };
    }
    default:
      throw new Error("unknown_tool");
  }
}

/** خواندن منابع داخلی از روی URI؛ null یعنی پیدا نشد. */
export async function readBuiltinResource(uri: string, config: McpConfig): Promise<string | null> {
  if (uri === "hadiran://ontology/worlds") {
    return JSON.stringify({ worlds: BUILTIN_WORLDS }, null, 2);
  }
  const knowledgeMatch = /^hadiran:\/\/knowledge\/(.+)$/.exec(uri);
  if (knowledgeMatch) {
    try {
      const item = await getPublicKnowledgeBySlug(decodeURIComponent(knowledgeMatch[1]));
      if (!item) return null;
      return JSON.stringify(
        {
          slug: item.slug,
          titleFa: item.titleFa,
          summaryFa: item.summaryFa,
          lineFa: item.lineFa,
          questionFa: item.questionFa,
          rootFa: item.rootFa,
          firstStepFa: item.firstStepFa,
          closingQuestionFa: item.closingQuestionFa,
          closingOptions: item.closingOptions,
        },
        null,
        2,
      );
    } catch {
      return null;
    }
  }
  const topicMatch = /^hadiran:\/\/topics\/(.+)$/.exec(uri);
  if (topicMatch) {
    const slug = decodeURIComponent(topicMatch[1]);
    const graph = await resolveTopicGraph(slug, config.weights);
    const topic = graph.topics.find((t) => t.slug === slug);
    if (!topic) return null;
    return JSON.stringify({ topic }, null, 2);
  }
  return null;
}
