import { getMcpConfig } from "./config";
import { BUILTIN_WORLDS, dispatchBuiltinTool, readBuiltinResource } from "./builtin";
import { DEFAULT_LLM_SYSTEM_PROMPT_FA } from "./llm-runner";
import {
  effectiveTools,
  listPrompts,
  listResources,
  listServers,
  logCall,
} from "./registry";
import { remoteCallTool } from "./remote";
import { applyValuePolicy, publicToolName, type EffectiveTool } from "./service-types";
import { getAudienceContext } from "./context";

/**
 * بسته‌بندی استاندارد MCP (JSON-RPC 2.0 / Streamable HTTP) برای اندپوینت بیرونی.
 * منبع حقیقت نمایش و اجرا «رجیستری سرویس» است: فقط ابزار مؤثرِ بستن external_api
 * (سرور فعال + دیده‌شدن بیرونی + ابزار فعال و بازبینی‌شده) دیده و اجرا می‌شود.
 * اگر رجیستری هنوز بذر ندارد، رفتار قبلی (چهار ابزار داخلی) حفظ می‌شود.
 * مخاطب بیرونی همیشه مهمان است؛ دادهٔ شخصی از این مسیر بیرون نمی‌رود.
 */

export const MCP_PROTOCOL_VERSION = "2025-11-25";
const SUPPORTED_VERSIONS = ["2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05"];

export const MCP_WORLDS = BUILTIN_WORLDS;

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
  const structured = value && typeof value === "object" ? (value as Record<string, unknown>) : undefined;
  return {
    content: [{ type: "text", text: typeof value === "string" ? value : JSON.stringify(value, null, 2) }],
    ...(structured ? { structuredContent: structured } : {}),
  };
}

function toolErrorResult(message: string) {
  return { content: [{ type: "text", text: message }], isError: true };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

interface CatalogEntry {
  publicName: string;
  effective: EffectiveTool;
}

async function buildCatalog(): Promise<{ ready: boolean; entries: CatalogEntry[] }> {
  const eff = await effectiveTools("external_api");
  if (!eff.ready) return { ready: false, entries: [] };
  const counts = new Map<string, number>();
  for (const item of eff.tools) counts.set(item.tool.name, (counts.get(item.tool.name) ?? 0) + 1);
  const entries = eff.tools.map((item) => ({
    publicName: publicToolName(item.server.slug, item.tool.name, counts),
    effective: item,
  }));
  return { ready: true, entries };
}

async function callLegacyTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  const config = await getMcpConfig();
  switch (name) {
    case "get_audience_context": {
      const audience = await getAudienceContext({ account: null, conversationId: null, config });
      return {
        level: audience.level,
        isGuest: true,
        displayName: null,
        history: [],
        mirror: null,
      };
    }
    case "search_knowledge":
    case "search_ecosystem":
    case "resolve_topic_graph": {
      const serverSlug = name === "search_knowledge" ? "knowledge" : "ecosystem";
      return dispatchBuiltinTool(serverSlug, name, args, { account: null, config });
    }
    default:
      throw new Error("unknown_tool");
  }
}

async function callCatalogTool(entry: CatalogEntry, args: Record<string, unknown>): Promise<unknown> {
  const { server, tool, paramOverrides } = entry.effective;
  if (tool.requiresConfirmation) {
    // انسان باید در حلقه باشد؛ کلاینت بیرونی از این مسیر تأیید نمی‌گیرد.
    throw new Error("confirmation_required");
  }
  const config = await getMcpConfig();
  const finalArgs = applyValuePolicy(tool, paramOverrides, args);
  if (server.kind === "remote") {
    return remoteCallTool(server, tool.name, finalArgs, tool.timeoutMs);
  }
  return dispatchBuiltinTool(server.slug, tool.name, finalArgs, { account: null, config });
}

async function listResourcesResult() {
  const servers = await listServers();
  const externalActive = new Set(
    servers.filter((s) => s.visibility === "external" && s.status === "active").map((s) => s.slug),
  );
  const rows = (await listResources()).filter((r) => r.enabled && externalActive.has(r.serverSlug));
  if (rows.length === 0) {
    return {
      resources: [
        { uri: "hadiran://ontology/worlds", name: "نقشهٔ اتاق‌های هادیران", mimeType: "application/json" },
      ],
    };
  }
  return {
    resources: rows.map((r) => ({
      uri: r.uriTemplate,
      name: r.nameFa ?? r.uriTemplate,
      ...(r.descriptionFa ? { description: r.descriptionFa } : {}),
      mimeType: r.mimeType,
    })),
  };
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

  if (id === undefined || id === null) {
    return { status: 202, body: null };
  }

  switch (method) {
    case "initialize": {
      const requested = typeof params.protocolVersion === "string" ? params.protocolVersion : MCP_PROTOCOL_VERSION;
      const protocolVersion = SUPPORTED_VERSIONS.includes(requested) ? requested : MCP_PROTOCOL_VERSION;
      const servers = await listServers();
      const instructions = servers
        .filter((s) => s.visibility === "external" && s.status === "active" && s.instructionsFa)
        .map((s) => s.instructionsFa)
        .join("\n");
      return result(id, {
        protocolVersion,
        capabilities: { tools: { listChanged: false }, resources: {}, prompts: {} },
        serverInfo: { name: "hadiran-mcp", version: "1.0.0" },
        ...(instructions ? { instructions } : {}),
      });
    }
    case "ping":
      return result(id, {});
    case "tools/list": {
      const catalog = await buildCatalog();
      if (!catalog.ready) return result(id, { tools: MCP_TOOLS });
      return result(id, {
        tools: catalog.entries.map(({ publicName, effective }) => ({
          name: publicName,
          ...(effective.tool.titleFa ? { title: effective.tool.titleFa } : {}),
          description: effective.tool.descriptionFa ?? "",
          inputSchema: effective.tool.inputSchema,
          ...(effective.tool.outputSchema ? { outputSchema: effective.tool.outputSchema } : {}),
          ...(Object.keys(effective.tool.annotations).length
            ? { annotations: effective.tool.annotations }
            : {}),
        })),
      });
    }
    case "tools/call": {
      const name = typeof params.name === "string" ? params.name : "";
      const args = asRecord(params.arguments);
      const catalog = await buildCatalog();
      const started = Date.now();
      if (!catalog.ready) {
        if (!MCP_TOOLS.some((t) => t.name === name)) return rpcError(id, -32602, `Unknown tool: ${name}`);
        try {
          const out = await callLegacyTool(name, args);
          void logCall({ serverSlug: null, toolName: name, consumer: "external_api", ok: true, durationMs: Date.now() - started });
          return result(id, textContent(out));
        } catch (error) {
          const message = error instanceof Error ? error.message : "tool_error";
          void logCall({ serverSlug: null, toolName: name, consumer: "external_api", ok: false, error: message, durationMs: Date.now() - started });
          return result(id, toolErrorResult(message));
        }
      }
      const entry = catalog.entries.find((e) => e.publicName === name);
      if (!entry) return result(id, toolErrorResult("tool_not_available"));
      try {
        const out = await callCatalogTool(entry, args);
        void logCall({
          serverSlug: entry.effective.server.slug,
          toolName: entry.effective.tool.name,
          consumer: "external_api",
          ok: true,
          durationMs: Date.now() - started,
        });
        // پاسخ سرور راه‌دور خودش CallToolResult است؛ داخلی‌ها را بسته‌بندی می‌کنیم.
        if (out && typeof out === "object" && "content" in (out as Record<string, unknown>)) {
          return result(id, out);
        }
        return result(id, textContent(out));
      } catch (error) {
        const message = error instanceof Error ? error.message : "tool_error";
        void logCall({
          serverSlug: entry.effective.server.slug,
          toolName: entry.effective.tool.name,
          consumer: "external_api",
          ok: false,
          error: message,
          durationMs: Date.now() - started,
        });
        return result(id, toolErrorResult(message));
      }
    }
    case "resources/list":
      return result(id, await listResourcesResult());
    case "resources/read": {
      const uri = typeof params.uri === "string" ? params.uri : "";
      if (!uri) return rpcError(id, -32602, "uri_required");
      const config = await getMcpConfig();
      const text = await readBuiltinResource(uri, config);
      if (text === null) return rpcError(id, -32002, "Resource not found");
      return result(id, { contents: [{ uri, mimeType: "application/json", text }] });
    }
    case "prompts/list": {
      const servers = await listServers();
      const externalActive = new Set(
        servers.filter((s) => s.visibility === "external" && s.status === "active").map((s) => s.slug),
      );
      const rows = (await listPrompts()).filter((p) => p.enabled && externalActive.has(p.serverSlug));
      if (rows.length === 0) return result(id, { prompts: MCP_PROMPTS });
      return result(id, {
        prompts: rows.map((p) => ({
          name: p.name,
          ...(p.titleFa ? { title: p.titleFa } : {}),
          description: p.descriptionFa ?? "",
          arguments: p.arguments,
        })),
      });
    }
    case "prompts/get": {
      const name = typeof params.name === "string" ? params.name : "";
      const servers = await listServers();
      const externalActive = new Set(
        servers.filter((s) => s.visibility === "external" && s.status === "active").map((s) => s.slug),
      );
      const rows = (await listPrompts()).filter((p) => p.enabled && externalActive.has(p.serverSlug));
      const row = rows.find((p) => p.name === name);
      const config = await getMcpConfig();
      if (row) {
        const text =
          row.templateFa ??
          (name === "llm_system_prompt"
            ? (config.defaultSystemPromptFa ?? DEFAULT_LLM_SYSTEM_PROMPT_FA)
            : "{{topicIntro}} {{knowledgeLine}} {{knowledgeRoot}} {{firstStep}} {{audienceBottleneckHint}} {{closingQuestion}}");
        return result(id, {
          description: row.descriptionFa ?? "",
          messages: [{ role: "user", content: { type: "text", text } }],
        });
      }
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
