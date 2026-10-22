import { saveTool, updateServerHealth } from "./registry";
import { openServerToken } from "./registry";
import type { McpServerRecord } from "./service-types";

/**
 * کلاینت سرورهای راه‌دور MCP (Streamable HTTP، چرخهٔ 2025-11-25).
 * از اول در معماری هست: کشف ابزار، همگام‌سازی به رجیستری و فراخوانی واسطه‌ای.
 * ابزار کشف‌شده همیشه «بازبینی‌نشده» وارد می‌شود تا انسان تأییدش نکرده جایی اجرا نشود.
 */

interface RemoteToolDef {
  name: string;
  title?: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
  annotations?: Record<string, unknown>;
}

const sessionCache = new Map<string, { sessionId: string; at: number }>();
const SESSION_TTL_MS = 10 * 60 * 1000;

async function rpcRequest(
  server: McpServerRecord,
  body: Record<string, unknown>,
  timeoutMs: number,
  sessionId?: string,
): Promise<{ data: Record<string, unknown>; sessionId: string | null }> {
  if (!server.baseUrl) throw new Error("remote_base_url_missing");
  const token = server.authType === "bearer" ? await openServerToken(server.slug) : null;
  const res = await fetch(server.baseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(sessionId ? { "Mcp-Session-Id": sessionId } : {}),
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`remote_http_${res.status}`);
  const newSession = res.headers.get("mcp-session-id");
  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("text/event-stream")) {
    // پاسخ جریانی: آخرین data: را به‌عنوان پیام JSON-RPC می‌خوانیم.
    const text = await res.text();
    const lines = text.split("\n").filter((l) => l.startsWith("data:"));
    const last = lines[lines.length - 1]?.slice(5).trim();
    if (!last) throw new Error("remote_empty_stream");
    return { data: JSON.parse(last) as Record<string, unknown>, sessionId: newSession };
  }
  const data = (await res.json()) as Record<string, unknown>;
  return { data, sessionId: newSession };
}

async function ensureSession(server: McpServerRecord, timeoutMs: number): Promise<string | undefined> {
  const cached = sessionCache.get(server.slug);
  if (cached && Date.now() - cached.at < SESSION_TTL_MS) return cached.sessionId;
  try {
    const init = await rpcRequest(
      server,
      {
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: server.protocolVersion || "2025-11-25",
          capabilities: {},
          clientInfo: { name: "hadiran-mcp-service", version: "1.0.0" },
        },
      },
      timeoutMs,
    );
    if (init.sessionId) {
      sessionCache.set(server.slug, { sessionId: init.sessionId, at: Date.now() });
      await rpcRequest(
        server,
        { jsonrpc: "2.0", method: "notifications/initialized" },
        timeoutMs,
        init.sessionId,
      ).catch(() => undefined);
      return init.sessionId;
    }
  } catch {
    // سرور stateless است یا هندشیک نمی‌خواهد؛ بدون نشست ادامه می‌دهیم.
  }
  return undefined;
}

async function rpc(
  server: McpServerRecord,
  method: string,
  params: Record<string, unknown>,
  timeoutMs: number,
): Promise<unknown> {
  const sessionId = await ensureSession(server, timeoutMs);
  const { data } = await rpcRequest(
    server,
    { jsonrpc: "2.0", id: Date.now(), method, params },
    timeoutMs,
    sessionId,
  );
  const error = data.error as { message?: string } | undefined;
  if (error) throw new Error(error.message ?? "remote_rpc_error");
  return data.result;
}

export async function remoteListTools(
  server: McpServerRecord,
  timeoutMs = 10000,
): Promise<RemoteToolDef[]> {
  const result = (await rpc(server, "tools/list", {}, timeoutMs)) as { tools?: RemoteToolDef[] };
  return Array.isArray(result?.tools) ? result.tools : [];
}

export async function remoteCallTool(
  server: McpServerRecord,
  name: string,
  args: Record<string, unknown>,
  timeoutMs: number,
): Promise<unknown> {
  return rpc(server, "tools/call", { name, arguments: args }, timeoutMs);
}

/** کشف ابزارهای سرور راه‌دور و همگام‌سازی در رجیستری؛ تازه‌ها بازبینی‌نشده می‌مانند. */
export async function syncRemoteServer(
  server: McpServerRecord,
): Promise<{ ok: true; count: number } | { ok: false; error: string }> {
  try {
    const tools = await remoteListTools(server);
    for (const tool of tools) {
      await saveTool({
        serverSlug: server.slug,
        name: tool.name,
        titleFa: tool.title ?? null,
        descriptionFa: tool.description ?? null,
        origin: "discovered",
        inputSchema: tool.inputSchema ?? { type: "object", additionalProperties: false },
        outputSchema: tool.outputSchema ?? null,
        annotations: tool.annotations ?? {},
        // reviewStatus و enabled موجود دست نمی‌خورد؛ ردیف تازه پیش‌فرض unreviewed است.
      });
    }
    await updateServerHealth(server.slug, true);
    return { ok: true, count: tools.length };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await updateServerHealth(server.slug, false, message);
    return { ok: false, error: message };
  }
}

export async function checkServerHealth(
  server: McpServerRecord,
): Promise<{ ok: boolean; error?: string }> {
  if (server.kind === "builtin") {
    await updateServerHealth(server.slug, true);
    return { ok: true };
  }
  try {
    await remoteListTools(server);
    await updateServerHealth(server.slug, true);
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await updateServerHealth(server.slug, false, message);
    return { ok: false, error: message };
  }
}
