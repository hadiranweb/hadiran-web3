import { hasDatabaseUrl, db } from "@/db";
import { topics } from "@/db/schema";
import { getPublicKnowledgeBySlug } from "@/lib/knowledge/public";
import { getMcpConfig } from "./config";
import { searchEcosystem, searchKnowledge, resolveTopicGraph } from "./tools";
import { DEFAULT_LLM_SYSTEM_PROMPT_FA } from "./llm-runner";

/**
 * بسته‌بندی استاندارد MCP (JSON-RPC 2.0 / Streamable HTTP) روی همان ابزارهای چت.
 * چرخهٔ 2025-11-25 (initialize + tools/resources/prompts) پیاده شده؛ بدون هندشیک هم پذیرفته می‌شود.
 * مخاطب بیرونی همیشه مهمان است: get_audience_context اینجا هرگز دادهٔ شخصی برنمی‌گرداند.
 */

export const MCP_PROTOCOL_VERSION = "2025-11-25";
const SUPPORTED_VERSIONS = ["2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05"];

export const MCP_WORLDS = [
  { key: "house", labelFa: "خانه", path: "/ecosystem" },
  { key: "knowledge", labelFa: "باغ دانش", path: "/knowledge" },
  { key: "lab", labelFa: "کارگاه", path: "/lab" },
  { key: "mirrors", labelFa: "آینه‌ها", path: "/analyzers" },
  { key: "courses", labelFa: "دوره‌ها", path: "/courses" },
  { key: "shop", labelFa: "فروشگاه", path: "/shop" },
  { key: "person", labelFa: "درباره من", path: "/hadiran" },
];

export const MCP_TOOLS = [
  {
    name: "search_knowledge",
    title: "Search public knowledge",
    description: "جست‌وجو در دانش عمومی تاییدشدهٔ هادیران همراه لایه‌های مقاله (line/root/firstStep/closing).",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "پرسش یا کلیدواژه" },
        topicSlug: { type: "string", description: "محدودکردن به یک موضوع (اختیاری)" },
        limit: { type: "number", description: "حداکثر نتیجه (۱ تا ۸)" },
      },
      required: ["query"],
    },
  },
  {
    name: "search_ecosystem",
    title: "Search ecosystem",
    description: "جست‌وجو در پروژه‌های منتشرشدهٔ کارگاه، دوره‌های منتشرشده و آینه‌های باز.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
        includeMirrors: { type: "boolean" },
      },
      required: ["query"],
    },
  },
  {
    name: "resolve_topic_graph",
    title: "Resolve topic graph",
    description: "تشخیص موضوع‌های منطبق با پرسش و قانون اختصاصی موتور گفتگو برای هر موضوع.",
    inputSchema: {
      type: "object",
      properties: { query: { type: "string" } },
      required: ["query"],
    },
  },
  {
    name: "get_audience_context",
    title: "Audience context",
    description: "در اندپوینت بیرونی همیشه مهمان برمی‌گردد؛ دادهٔ مخاطب فقط داخل چت خانه و از سشن سرور خوانده می‌شود.",
    inputSchema: { type: "object", properties: {} },
  },
] as const;

export const MCP_PROMPTS = [
  {
    name: "local_answer_template",
    description: "قالب پاسخ حالت لوکال با متغیرهای {{topicIntro}} {{knowledgeLine}} {{knowledgeRoot}} {{firstStep}} {{audienceBottleneckHint}} {{closingQuestion}}.",
    arguments: [],
  },
  {
    name: "llm_system_prompt",
    description: "پرامپت سیستم حالت LLM (لحن هادیران، تکیه فقط بر منابع بازیابی‌شده، یک سؤال شفاف‌ساز در پایان).",
    arguments: [],
  },
] as const;

interface JsonRpcRequest {
  jsonrpc?: unknown;
  id?: unknown;
  method?: unknown;
  params?: unknown;
}

export interface McpHttpResult {
  status: number;
  body: unknown | null;
}

function result(id: unknown, value: unknown): McpHttpResult {
  return { status: 200, body: { jsonrpc: "2.0", id: id ?? null, result: value } };
}

function rpcError(id: unknown, code: number, message: string): McpHttpResult {
  return { status: 200, body: { jsonrpc: "2.0", id: id ?? null, error: { code, message } } };
}

function textContent(value: unknown) {
  return { content: [{ type: "text", text: JSON.stringify(value, null, 2) }], structuredContent: value };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

async function callTool(name: string, args: Record<string, unknown>): Promise<McpHttpResult["body"]> {
  const config = await getMcpConfig();
  const query = typeof args.query === "string" ? args.query : "";
  switch (name) {
    case "search_knowledge": {
      if (!config.enableKnowledgeTool) return { ...textContent({ items: [] }), isError: true };
      if (!query) throw new Error("query_required");
      const items = await searchKnowledge(query, {
        topicSlug: typeof args.topicSlug === "string" ? args.topicSlug : null,
        limit: typeof args.limit === "number" ? args.limit : 4,
        weights: config.weights,
        includeLayers: config.enableArticleLayers,
      });
      return textContent({ items });
    }
    case "search_ecosystem": {
      if (!query) throw new Error("query_required");
      const out = await searchEcosystem(query, {
        includeProjects: config.enableProjectsTool,
        includeCourses: config.enableCoursesTool,
        includeAnalyzers: config.enableAnalyzersTool && args.includeMirrors !== false,
        weights: config.weights,
      });
      return textContent(out);
    }
    case "resolve_topic_graph": {
      if (!query) throw new Error("query_required");
      const graph = await resolveTopicGraph(query, config.weights);
      return textContent({ topics: graph.topics });
    }
    case "get_audience_context": {
      // بیرونی = مهمان. هیچ دادهٔ شخصی از این مسیر بیرون نمی‌رود.
      return textContent({
        level: config.audienceLevel,
        isGuest: true,
        displayName: null,
        history: [],
        mirror: null,
      });
    }
    default:
      throw new Error("unknown_tool");
  }
}

async function listResources() {
  const resources: { uri: string; name: string; mimeType: string }[] = [
    { uri: "hadiran://ontology/worlds", name: "نقشهٔ اتاق‌های هادیران", mimeType: "application/json" },
  ];
  if (hasDatabaseUrl()) {
    try {
      const rows = await db.select({ slug: topics.slug, labelFa: topics.labelFa }).from(topics).limit(50);
      for (const row of rows) {
        resources.push({ uri: `hadiran://topics/${row.slug}`, name: row.labelFa, mimeType: "application/json" });
      }
    } catch {
      // بدون جدول موضوع‌ها فقط نقشهٔ جهان‌ها می‌ماند.
    }
  }
  return { resources };
}

async function readResource(uri: string, id: unknown): Promise<McpHttpResult> {
  if (uri === "hadiran://ontology/worlds") {
    return result(id, {
      contents: [{ uri, mimeType: "application/json", text: JSON.stringify({ worlds: MCP_WORLDS }, null, 2) }],
    });
  }
  const knowledgeMatch = /^hadiran:\/\/knowledge\/(.+)$/.exec(uri);
  if (knowledgeMatch) {
    try {
      const item = await getPublicKnowledgeBySlug(decodeURIComponent(knowledgeMatch[1]));
      if (!item) return rpcError(id, -32002, "Resource not found");
      return result(id, {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: JSON.stringify(
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
            ),
          },
        ],
      });
    } catch {
      return rpcError(id, -32002, "Resource not found");
    }
  }
  const topicMatch = /^hadiran:\/\/topics\/(.+)$/.exec(uri);
  if (topicMatch) {
    const graph = await resolveTopicGraph(decodeURIComponent(topicMatch[1]), (await getMcpConfig()).weights);
    const topic = graph.topics.find((t) => t.slug === decodeURIComponent(topicMatch[1]));
    if (!topic) return rpcError(id, -32002, "Resource not found");
    return result(id, {
      contents: [{ uri, mimeType: "application/json", text: JSON.stringify({ topic }, null, 2) }],
    });
  }
  return rpcError(id, -32002, "Resource not found");
}

export async function handleMcpRequest(raw: unknown): Promise<McpHttpResult> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {
      status: 400,
      body: { jsonrpc: "2.0", id: null, error: { code: -32600, message: "Invalid Request" } },
    };
  }
  const req = raw as JsonRpcRequest;
  const method = typeof req.method === "string" ? req.method : "";
  const id = req.id;
  const params = asRecord(req.params);

  // Notificationها (بدون id) پاسخ ندارند.
  if (id === undefined || id === null) {
    return { status: 202, body: null };
  }

  switch (method) {
    case "initialize": {
      const requested = typeof params.protocolVersion === "string" ? params.protocolVersion : MCP_PROTOCOL_VERSION;
      const protocolVersion = SUPPORTED_VERSIONS.includes(requested) ? requested : MCP_PROTOCOL_VERSION;
      return result(id, {
        protocolVersion,
        capabilities: { tools: { listChanged: false }, resources: {}, prompts: {} },
        serverInfo: { name: "hadiran-mcp", version: "1.0.0" },
      });
    }
    case "ping":
      return result(id, {});
    case "tools/list":
      return result(id, { tools: MCP_TOOLS });
    case "tools/call": {
      const name = typeof params.name === "string" ? params.name : "";
      if (!MCP_TOOLS.some((t) => t.name === name)) return rpcError(id, -32602, `Unknown tool: ${name}`);
      try {
        const out = await callTool(name, asRecord(params.arguments));
        return result(id, out);
      } catch (error) {
        return rpcError(id, -32602, error instanceof Error ? error.message : "tool_error");
      }
    }
    case "resources/list":
      return result(id, await listResources());
    case "resources/read": {
      const uri = typeof params.uri === "string" ? params.uri : "";
      if (!uri) return rpcError(id, -32602, "uri_required");
      return readResource(uri, id);
    }
    case "prompts/list":
      return result(id, { prompts: MCP_PROMPTS });
    case "prompts/get": {
      const name = typeof params.name === "string" ? params.name : "";
      const config = await getMcpConfig();
      if (name === "local_answer_template") {
        return result(id, {
          description: MCP_PROMPTS[0].description,
          messages: [
            {
              role: "user",
              content: {
                type: "text",
                text:
                  config.defaultLocalTemplateFa ??
                  "{{topicIntro}} {{knowledgeLine}} {{knowledgeRoot}} {{firstStep}} {{audienceBottleneckHint}} {{closingQuestion}}",
              },
            },
          ],
        });
      }
      if (name === "llm_system_prompt") {
        return result(id, {
          description: MCP_PROMPTS[1].description,
          messages: [
            { role: "user", content: { type: "text", text: config.defaultSystemPromptFa ?? DEFAULT_LLM_SYSTEM_PROMPT_FA } },
          ],
        });
      }
      return rpcError(id, -32602, `Unknown prompt: ${name}`);
    }
    default:
      return rpcError(id, -32601, `Method not found: ${method}`);
  }
}
