import { and, desc, eq } from "drizzle-orm";
import { db, hasDatabaseUrl } from "@/db";
import {
  mcpBindings,
  mcpBindingTools,
  mcpCallLogs,
  mcpPrompts,
  mcpResources,
  mcpServers,
  mcpTools,
} from "@/db/schema";
import { canSealBotSecrets, openSecret, sealSecret, tokenHintOf } from "@/lib/bots/secret";
import { cleanText } from "./types";
import {
  asRecord,
  isToolEffective,
  parseRiskLevel,
  parseReviewStatus,
  parseServerStatus,
  parseVisibility,
  type EffectiveTool,
  type McpBindingRecord,
  type McpPromptRecord,
  type McpResourceRecord,
  type McpServerRecord,
  type McpToolRecord,
} from "./service-types";

/**
 * رجیستری سرویس MCP — سطح کنترل. خواندن‌ها Fail-soft (بدون جدول = خالی)،
 * نوشتن‌ها خطای روشن می‌دهند. سکرت‌ها فقط cipher+hint نگه داشته می‌شوند.
 */

type ServerRow = typeof mcpServers.$inferSelect;
type ToolRow = typeof mcpTools.$inferSelect;

function toServer(row: ServerRow): McpServerRecord {
  return {
    slug: row.slug,
    name: row.name,
    titleFa: row.titleFa,
    descriptionFa: row.descriptionFa,
    kind: row.kind === "remote" ? "remote" : "builtin",
    transport: row.transport,
    baseUrl: row.baseUrl,
    protocolVersion: row.protocolVersion,
    instructionsFa: row.instructionsFa,
    visibility: parseVisibility(row.visibility),
    status: parseServerStatus(row.status),
    capabilities: asRecord(row.capabilities) as McpServerRecord["capabilities"],
    authType: row.authType,
    hasAuthToken: Boolean(row.authTokenCipher),
    authTokenHint: row.authTokenHint,
    healthStatus: row.healthStatus,
    healthError: row.healthError,
    healthAt: row.healthAt ? row.healthAt.toISOString() : null,
  };
}

function toTool(row: ToolRow): McpToolRecord {
  return {
    id: row.id,
    serverSlug: row.serverSlug,
    name: row.name,
    titleFa: row.titleFa,
    descriptionFa: row.descriptionFa,
    enabled: row.enabled,
    origin: row.origin,
    inputSchema: asRecord(row.inputSchema),
    outputSchema: row.outputSchema ? asRecord(row.outputSchema) : null,
    defaults: asRecord(row.defaults),
    caps: asRecord(row.caps),
    annotations: asRecord(row.annotations),
    riskLevel: parseRiskLevel(row.riskLevel),
    reviewStatus: parseReviewStatus(row.reviewStatus),
    requiresConfirmation: row.requiresConfirmation,
    timeoutMs: row.timeoutMs ?? 8000,
    sortOrder: row.sortOrder ?? 0,
  };
}

export async function listServers(): Promise<McpServerRecord[]> {
  if (!hasDatabaseUrl()) return [];
  try {
    const rows = await db.select().from(mcpServers);
    return rows.map(toServer);
  } catch {
    return [];
  }
}

export async function getServer(slug: string): Promise<McpServerRecord | null> {
  if (!hasDatabaseUrl() || !slug) return null;
  try {
    const [row] = await db.select().from(mcpServers).where(eq(mcpServers.slug, slug)).limit(1);
    return row ? toServer(row) : null;
  } catch {
    return null;
  }
}

export interface SaveServerInput {
  slug?: unknown;
  name?: unknown;
  titleFa?: unknown;
  descriptionFa?: unknown;
  kind?: unknown;
  transport?: unknown;
  baseUrl?: unknown;
  protocolVersion?: unknown;
  instructionsFa?: unknown;
  visibility?: unknown;
  status?: unknown;
  capabilities?: unknown;
  authType?: unknown;
  authToken?: unknown;
  clearAuthToken?: unknown;
}

export async function saveServer(
  accountId: number,
  input: SaveServerInput,
): Promise<{ ok: true; server: McpServerRecord } | { ok: false; error: string; status: number }> {
  if (!hasDatabaseUrl()) return { ok: false, error: "اتصال دیتابیس برقرار نیست.", status: 503 };
  const slug = cleanText(input.slug, 64);
  if (!slug) return { ok: false, error: "اسلاگ سرور لازم است.", status: 400 };

  const values: Partial<typeof mcpServers.$inferInsert> = {
    slug,
    updatedBy: accountId,
    updatedAt: new Date(),
  };
  if (input.name !== undefined) values.name = cleanText(input.name, 128) ?? slug;
  if (input.titleFa !== undefined) values.titleFa = cleanText(input.titleFa, 256);
  if (input.descriptionFa !== undefined) values.descriptionFa = cleanText(input.descriptionFa, 4000);
  if (input.kind !== undefined) values.kind = input.kind === "remote" ? "remote" : "builtin";
  if (input.transport !== undefined) values.transport = cleanText(input.transport, 24) ?? "inprocess";
  if (input.baseUrl !== undefined) values.baseUrl = cleanText(input.baseUrl, 1024);
  if (input.protocolVersion !== undefined) values.protocolVersion = cleanText(input.protocolVersion, 16) ?? "2025-11-25";
  if (input.instructionsFa !== undefined) values.instructionsFa = cleanText(input.instructionsFa, 8000);
  if (input.visibility !== undefined) values.visibility = parseVisibility(input.visibility);
  if (input.status !== undefined) values.status = parseServerStatus(input.status);
  if (input.capabilities !== undefined) values.capabilities = asRecord(input.capabilities) as McpServerRecord["capabilities"];
  if (input.authType !== undefined) values.authType = cleanText(input.authType, 16) ?? "none";

  const token = typeof input.authToken === "string" ? input.authToken.trim() : "";
  if (token) {
    if (!canSealBotSecrets()) return { ok: false, error: "کلید رمزنگاری سرور تنظیم نشده است.", status: 503 };
    values.authTokenCipher = sealSecret(token);
    values.authTokenHint = `••••${tokenHintOf(token)}`;
  } else if (input.clearAuthToken === true) {
    values.authTokenCipher = null;
    values.authTokenHint = null;
  }

  try {
    const [row] = await db
      .insert(mcpServers)
      .values({ ...(values as typeof mcpServers.$inferInsert), name: values.name ?? slug, createdBy: accountId })
      .onConflictDoUpdate({ target: mcpServers.slug, set: values })
      .returning();
    return { ok: true, server: toServer(row) };
  } catch {
    return { ok: false, error: "ذخیرهٔ سرور ناموفق بود؛ شاید مایگریشن 0033 هنوز اجرا نشده است.", status: 500 };
  }
}

export async function deleteServer(slug: string): Promise<boolean> {
  if (!hasDatabaseUrl() || !slug) return false;
  try {
    await db.delete(mcpServers).where(eq(mcpServers.slug, slug));
    return true;
  } catch {
    return false;
  }
}

export async function updateServerHealth(slug: string, ok: boolean, error?: string): Promise<void> {
  if (!hasDatabaseUrl()) return;
  try {
    await db
      .update(mcpServers)
      .set({
        healthStatus: ok ? "ok" : "error",
        healthError: ok ? null : (error ?? "unknown").slice(0, 1000),
        healthAt: new Date(),
      })
      .where(eq(mcpServers.slug, slug));
  } catch {
    // سلامت ثبت نشد؛ مهم نیست.
  }
}

export async function openServerToken(slug: string): Promise<string | null> {
  if (!hasDatabaseUrl()) return null;
  try {
    const [row] = await db
      .select({ cipher: mcpServers.authTokenCipher })
      .from(mcpServers)
      .where(eq(mcpServers.slug, slug))
      .limit(1);
    if (!row?.cipher) return null;
    return openSecret(row.cipher);
  } catch {
    return null;
  }
}

export async function listTools(serverSlug?: string): Promise<McpToolRecord[]> {
  if (!hasDatabaseUrl()) return [];
  try {
    const rows = serverSlug
      ? await db.select().from(mcpTools).where(eq(mcpTools.serverSlug, serverSlug))
      : await db.select().from(mcpTools);
    return rows.map(toTool).sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
  } catch {
    return [];
  }
}

export interface SaveToolInput {
  id?: unknown;
  serverSlug?: unknown;
  name?: unknown;
  titleFa?: unknown;
  descriptionFa?: unknown;
  enabled?: unknown;
  origin?: unknown;
  inputSchema?: unknown;
  outputSchema?: unknown;
  defaults?: unknown;
  caps?: unknown;
  annotations?: unknown;
  riskLevel?: unknown;
  reviewStatus?: unknown;
  requiresConfirmation?: unknown;
  timeoutMs?: unknown;
  sortOrder?: unknown;
}

export async function saveTool(
  input: SaveToolInput,
): Promise<{ ok: true; tool: McpToolRecord } | { ok: false; error: string; status: number }> {
  if (!hasDatabaseUrl()) return { ok: false, error: "اتصال دیتابیس برقرار نیست.", status: 503 };
  const serverSlug = cleanText(input.serverSlug, 64);
  const name = cleanText(input.name, 128);
  if (!serverSlug || !name) return { ok: false, error: "سرور و نام ابزار لازم است.", status: 400 };

  const values: Partial<typeof mcpTools.$inferInsert> = { serverSlug, name, updatedAt: new Date() };
  if (input.titleFa !== undefined) values.titleFa = cleanText(input.titleFa, 256);
  if (input.descriptionFa !== undefined) values.descriptionFa = cleanText(input.descriptionFa, 4000);
  if (input.enabled !== undefined) values.enabled = Boolean(input.enabled);
  if (input.inputSchema !== undefined) values.inputSchema = asRecord(input.inputSchema);
  if (input.outputSchema !== undefined) values.outputSchema = input.outputSchema ? asRecord(input.outputSchema) : null;
  if (input.defaults !== undefined) values.defaults = asRecord(input.defaults);
  if (input.caps !== undefined) values.caps = asRecord(input.caps);
  if (input.annotations !== undefined) values.annotations = asRecord(input.annotations);
  if (input.riskLevel !== undefined) values.riskLevel = parseRiskLevel(input.riskLevel);
  if (input.reviewStatus !== undefined) values.reviewStatus = parseReviewStatus(input.reviewStatus);
  if (input.requiresConfirmation !== undefined) values.requiresConfirmation = Boolean(input.requiresConfirmation);
  if (input.timeoutMs !== undefined) {
    const n = Number(input.timeoutMs);
    values.timeoutMs = Number.isFinite(n) ? Math.round(Math.min(60000, Math.max(200, n))) : 8000;
  }
  if (input.sortOrder !== undefined) {
    const n = Number(input.sortOrder);
    values.sortOrder = Number.isFinite(n) ? Math.round(n) : 0;
  }

  try {
    const id = typeof input.id === "number" ? input.id : null;
    if (id) {
      const [row] = await db.update(mcpTools).set(values).where(eq(mcpTools.id, id)).returning();
      if (!row) return { ok: false, error: "ابزار پیدا نشد.", status: 404 };
      return { ok: true, tool: toTool(row) };
    }
    const [row] = await db
      .insert(mcpTools)
      .values(values as typeof mcpTools.$inferInsert)
      .onConflictDoUpdate({
        target: [mcpTools.serverSlug, mcpTools.name],
        set: values,
      })
      .returning();
    return { ok: true, tool: toTool(row) };
  } catch {
    return { ok: false, error: "ذخیرهٔ ابزار ناموفق بود؛ سرور باید وجود داشته باشد.", status: 500 };
  }
}

export async function deleteTool(id: number): Promise<boolean> {
  if (!hasDatabaseUrl() || !Number.isFinite(id)) return false;
  try {
    await db.delete(mcpTools).where(eq(mcpTools.id, id));
    return true;
  } catch {
    return false;
  }
}

export async function listResources(serverSlug?: string): Promise<McpResourceRecord[]> {
  if (!hasDatabaseUrl()) return [];
  try {
    const rows = serverSlug
      ? await db.select().from(mcpResources).where(eq(mcpResources.serverSlug, serverSlug))
      : await db.select().from(mcpResources);
    return rows.map((row) => ({
      id: row.id,
      serverSlug: row.serverSlug,
      uriTemplate: row.uriTemplate,
      nameFa: row.nameFa,
      descriptionFa: row.descriptionFa,
      mimeType: row.mimeType,
      enabled: row.enabled,
    }));
  } catch {
    return [];
  }
}

export async function listPrompts(serverSlug?: string): Promise<McpPromptRecord[]> {
  if (!hasDatabaseUrl()) return [];
  try {
    const rows = serverSlug
      ? await db.select().from(mcpPrompts).where(eq(mcpPrompts.serverSlug, serverSlug))
      : await db.select().from(mcpPrompts);
    return rows.map((row) => ({
      id: row.id,
      serverSlug: row.serverSlug,
      name: row.name,
      titleFa: row.titleFa,
      descriptionFa: row.descriptionFa,
      templateFa: row.templateFa,
      arguments: Array.isArray(row.arguments) ? row.arguments : [],
      enabled: row.enabled,
    }));
  } catch {
    return [];
  }
}

export async function setResourceEnabled(id: number, enabled: boolean): Promise<boolean> {
  if (!hasDatabaseUrl()) return false;
  try {
    await db.update(mcpResources).set({ enabled, updatedAt: new Date() }).where(eq(mcpResources.id, id));
    return true;
  } catch {
    return false;
  }
}

export async function setPromptEnabled(id: number, enabled: boolean): Promise<boolean> {
  if (!hasDatabaseUrl()) return false;
  try {
    await db.update(mcpPrompts).set({ enabled, updatedAt: new Date() }).where(eq(mcpPrompts.id, id));
    return true;
  } catch {
    return false;
  }
}

function toBinding(row: typeof mcpBindings.$inferSelect): McpBindingRecord {
  return {
    consumer: row.consumer,
    labelFa: row.labelFa,
    enabled: row.enabled,
    hasToken: Boolean(row.authTokenCipher),
    tokenHint: row.authTokenHint,
  };
}

export async function listBindings(): Promise<McpBindingRecord[]> {
  if (!hasDatabaseUrl()) return [];
  try {
    const rows = await db.select().from(mcpBindings);
    return rows.map(toBinding);
  } catch {
    return [];
  }
}

export async function getBinding(consumer: string): Promise<McpBindingRecord | null> {
  if (!hasDatabaseUrl()) return null;
  try {
    const [row] = await db.select().from(mcpBindings).where(eq(mcpBindings.consumer, consumer)).limit(1);
    return row ? toBinding(row) : null;
  } catch {
    return null;
  }
}

export async function saveBinding(input: {
  consumer?: unknown;
  enabled?: unknown;
  token?: unknown;
  clearToken?: unknown;
}): Promise<{ ok: true; binding: McpBindingRecord } | { ok: false; error: string; status: number }> {
  if (!hasDatabaseUrl()) return { ok: false, error: "اتصال دیتابیس برقرار نیست.", status: 503 };
  const consumer = cleanText(input.consumer, 64);
  if (!consumer) return { ok: false, error: "مصرف‌کننده لازم است.", status: 400 };
  const values: Partial<typeof mcpBindings.$inferInsert> = { consumer, updatedAt: new Date() };
  if (input.enabled !== undefined) values.enabled = Boolean(input.enabled);
  const token = typeof input.token === "string" ? input.token.trim() : "";
  if (token) {
    if (!canSealBotSecrets()) return { ok: false, error: "کلید رمزنگاری سرور تنظیم نشده است.", status: 503 };
    values.authTokenCipher = sealSecret(token);
    values.authTokenHint = `••••${tokenHintOf(token)}`;
  } else if (input.clearToken === true) {
    values.authTokenCipher = null;
    values.authTokenHint = null;
  }
  try {
    const [row] = await db
      .insert(mcpBindings)
      .values({ ...(values as typeof mcpBindings.$inferInsert), labelFa: consumer })
      .onConflictDoUpdate({ target: mcpBindings.consumer, set: values })
      .returning();
    return { ok: true, binding: toBinding(row) };
  } catch {
    return { ok: false, error: "ذخیرهٔ بستن ناموفق بود.", status: 500 };
  }
}

export async function openBindingToken(consumer: string): Promise<string | null> {
  if (!hasDatabaseUrl()) return null;
  try {
    const [row] = await db
      .select({ cipher: mcpBindings.authTokenCipher })
      .from(mcpBindings)
      .where(eq(mcpBindings.consumer, consumer))
      .limit(1);
    if (!row?.cipher) return null;
    return openSecret(row.cipher);
  } catch {
    return null;
  }
}

export async function listBindingTools(
  consumer: string,
): Promise<{ toolId: number; enabled: boolean; paramOverrides: Record<string, unknown> }[]> {
  if (!hasDatabaseUrl()) return [];
  try {
    const rows = await db.select().from(mcpBindingTools).where(eq(mcpBindingTools.consumer, consumer));
    return rows.map((row) => ({
      toolId: row.toolId,
      enabled: row.enabled,
      paramOverrides: asRecord(row.paramOverrides),
    }));
  } catch {
    return [];
  }
}

export async function setBindingTool(input: {
  consumer?: unknown;
  toolId?: unknown;
  enabled?: unknown;
  paramOverrides?: unknown;
}): Promise<boolean> {
  if (!hasDatabaseUrl()) return false;
  const consumer = cleanText(input.consumer, 64);
  const toolId = typeof input.toolId === "number" ? input.toolId : Number(input.toolId);
  if (!consumer || !Number.isFinite(toolId)) return false;
  try {
    await db
      .insert(mcpBindingTools)
      .values({
        consumer,
        toolId,
        enabled: input.enabled === undefined ? true : Boolean(input.enabled),
        paramOverrides: asRecord(input.paramOverrides),
      })
      .onConflictDoUpdate({
        target: [mcpBindingTools.consumer, mcpBindingTools.toolId],
        set: {
          enabled: input.enabled === undefined ? true : Boolean(input.enabled),
          paramOverrides: asRecord(input.paramOverrides),
        },
      });
    return true;
  } catch {
    return false;
  }
}

/**
 * قلب اعمال حکمرانی: ابزارهای مؤثر یک مصرف‌کننده.
 * ready=false یعنی رجیستری هنوز بذر ندارد (جدول نیست/بستن نیست) → مصرف‌کننده به پیش‌فرض کد برمی‌گردد.
 * ready=true یعنی فهرست نهایی است و حتی خالی‌بودنش «خاموشی عمدی» شمرده می‌شود.
 */
export async function effectiveTools(
  consumer: string,
): Promise<{ ready: boolean; bindingEnabled: boolean; tools: EffectiveTool[] }> {
  if (!hasDatabaseUrl()) return { ready: false, bindingEnabled: true, tools: [] };
  try {
    const [servers, tools, binding, bindingTools] = await Promise.all([
      listServers(),
      listTools(),
      getBinding(consumer),
      listBindingTools(consumer),
    ]);
    if (!binding || servers.length === 0) return { ready: false, bindingEnabled: true, tools: [] };
    if (!binding.enabled) return { ready: true, bindingEnabled: false, tools: [] };
    const serverBySlug = new Map(servers.map((s) => [s.slug, s]));
    const bindingByTool = new Map(bindingTools.map((b) => [b.toolId, b]));
    const out: EffectiveTool[] = [];
    for (const tool of tools) {
      const server = serverBySlug.get(tool.serverSlug);
      if (!server) continue;
      const bindingTool = bindingByTool.get(tool.id);
      const effective = isToolEffective({
        serverStatus: server.status,
        serverVisibility: server.visibility,
        toolEnabled: tool.enabled,
        reviewStatus: tool.reviewStatus,
        bindingEnabled: bindingTool ? bindingTool.enabled : false,
        consumer,
      });
      if (effective) {
        out.push({ server, tool, paramOverrides: bindingTool?.paramOverrides ?? {} });
      }
    }
    return { ready: true, bindingEnabled: true, tools: out };
  } catch {
    return { ready: false, bindingEnabled: true, tools: [] };
  }
}

export async function logCall(entry: {
  serverSlug: string | null;
  toolName: string;
  consumer: string;
  accountId?: number | null;
  ok: boolean;
  error?: string | null;
  durationMs?: number | null;
}): Promise<void> {
  if (!hasDatabaseUrl()) return;
  try {
    await db.insert(mcpCallLogs).values({
      serverSlug: entry.serverSlug,
      toolName: entry.toolName,
      consumer: entry.consumer,
      accountId: entry.accountId ?? null,
      ok: entry.ok,
      error: entry.error ? entry.error.slice(0, 1000) : null,
      durationMs: entry.durationMs ?? null,
    });
  } catch {
    // حسابرسی بهترین تلاش است؛ فراخوانی را نمی‌شکند.
  }
}

export async function listCallLogs(limit = 30): Promise<
  {
    id: number;
    serverSlug: string | null;
    toolName: string;
    consumer: string;
    ok: boolean;
    error: string | null;
    durationMs: number | null;
    createdAt: string;
  }[]
> {
  if (!hasDatabaseUrl()) return [];
  try {
    const rows = await db
      .select()
      .from(mcpCallLogs)
      .orderBy(desc(mcpCallLogs.createdAt))
      .limit(Math.min(100, Math.max(1, limit)));
    return rows.map((row) => ({
      id: row.id,
      serverSlug: row.serverSlug,
      toolName: row.toolName,
      consumer: row.consumer,
      ok: row.ok,
      error: row.error,
      durationMs: row.durationMs,
      createdAt: row.createdAt ? row.createdAt.toISOString() : "",
    }));
  } catch {
    return [];
  }
}
