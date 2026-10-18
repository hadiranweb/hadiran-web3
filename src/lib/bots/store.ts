import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { bots } from "@/db/schema";
import { ensureBotsSchema } from "@/lib/auth/schema-guard";
import {
  canSealBotSecrets,
  newBotId,
  newWebhookSecret,
  openSecret,
  sealSecret,
  tokenHintOf,
} from "@/lib/bots/secret";
import {
  isTelegramBotToken,
  telegramApiBaseIsProxy,
  telegramDeleteWebhook,
  telegramGetMe,
  telegramGetWebhookInfo,
  telegramSetMyCommands,
  telegramSetWebhook,
  webhookUrlFor,
  webhookUrlIsPublicHttps,
} from "@/lib/bots/telegram";
import { defaultScript, parseBotScript, parseBotService, telegramCommandsOf, type BotService } from "@/lib/bots/script";
import type { BotStatus, BotView } from "@/lib/bots/types";

export type { BotStatus, BotView };

export type BotRow = typeof bots.$inferSelect;

function asStatus(value: string): BotStatus {
  if (value === "connected" || value === "paused" || value === "error") return value;
  return "disconnected";
}

function viewOf(row: BotRow, extra?: { pendingUpdateCount?: number | null }): BotView {
  return {
    id: row.id,
    titleFa: row.titleFa,
    channel: "telegram",
    status: asStatus(row.status),
    service: parseBotService(row.service),
    analyzerSlug: row.analyzerSlug,
    script: parseBotScript({
      ...(row.script && typeof row.script === "object" && !Array.isArray(row.script) ? row.script : {}),
      service: row.service,
    }),
    telegramUsername: row.telegramUsername,
    telegramFirstName: row.telegramFirstName,
    tokenHint: row.tokenHint,
    hasToken: Boolean(row.tokenCipher),
    webhookUrl: webhookUrlFor(row.id),
    lastError: row.lastError,
    lastWebhookAt: row.lastWebhookAt ? row.lastWebhookAt.toISOString() : null,
    lastUpdateKind: row.lastUpdateKind,
    lastInboundStatus: row.lastInboundStatus ?? null,
    telegramLastError: row.telegramLastError,
    connectedAt: row.connectedAt ? row.connectedAt.toISOString() : null,
    pendingUpdateCount: extra?.pendingUpdateCount ?? row.telegramPendingCount ?? null,
  };
}

function persianTelegramError(code: string): string {
  if (code === "telegram_unauthorized") return "توکن نامعتبر است.";
  if (code === "telegram_unreachable") {
    return telegramApiBaseIsProxy()
      ? "پروکسی تلگرام پاسخ نداد — TELEGRAM_API_BASE را روی لیارا بررسی کنید."
      : "سرور لیارا به api.telegram.org دسترسی ندارد — Worker کلودفلر طبق docs/telegram-proxy.md و متغیر TELEGRAM_API_BASE روی لیارا.";
  }
  if (code === "missing_secret") return "رمز سرور برای نگهداری توکن آماده نیست.";
  if (code === "webhook_not_https") return "وب‌هوک تلگرام فقط روی HTTPS عمومی ثبت می‌شود.";
  if (code === "invalid_token") return "شکل توکن BotFather درست نیست.";
  if (code === "token_required") return "توکن را وارد کنید.";
  return "اتصال تلگرام انجام نشد.";
}

export async function listBots(ownerId: number): Promise<BotView[]> {
  await ensureBotsSchema();
  const rows = await db.select().from(bots).where(eq(bots.ownerId, ownerId)).orderBy(desc(bots.updatedAt));
  return rows.map((row) => viewOf(row));
}

export async function readBot(ownerId: number, id: string): Promise<BotView | null> {
  await ensureBotsSchema();
  const [row] = await db.select().from(bots).where(eq(bots.id, id)).limit(1);
  if (!row || row.ownerId !== ownerId) return null;
  return viewOf(row);
}

export async function readBotRowById(id: string): Promise<BotRow | null> {
  await ensureBotsSchema();
  const [row] = await db.select().from(bots).where(eq(bots.id, id)).limit(1);
  return row ?? null;
}

export async function createBot(
  ownerId: number,
  input: { titleFa: string; service?: unknown; analyzerSlug?: string | null },
): Promise<BotView> {
  await ensureBotsSchema();
  const titleFa = input.titleFa.replace(/\s+/g, " ").trim();
  if (titleFa.length < 3) throw new Error("عنوان حداقل سه نویسه باشد.");
  const service = parseBotService(input.service);
  const analyzerSlug = service === "analyzers" ? (input.analyzerSlug ?? null) : null;
  const id = newBotId();
  const [row] = await db
    .insert(bots)
    .values({
      id,
      ownerId,
      channel: "telegram",
      titleFa,
      service,
      analyzerSlug,
      script: defaultScript(service),
      status: "disconnected",
    })
    .returning();
  return viewOf(row);
}

export async function updateBot(
  ownerId: number,
  id: string,
  input: { titleFa?: string; service?: unknown; analyzerSlug?: string | null; script?: unknown },
): Promise<BotView> {
  await ensureBotsSchema();
  const [existing] = await db.select().from(bots).where(eq(bots.id, id)).limit(1);
  if (!existing || existing.ownerId !== ownerId) throw new Error("not_found");
  const titleFa =
    typeof input.titleFa === "string" && input.titleFa.trim().length >= 3
      ? input.titleFa.replace(/\s+/g, " ").trim()
      : existing.titleFa;
  const service: BotService =
    input.service === undefined ? parseBotService(existing.service) : parseBotService(input.service);
  const analyzerSlug =
    service !== "analyzers"
      ? null
      : input.analyzerSlug === undefined
        ? existing.analyzerSlug
        : input.analyzerSlug;
  const script =
    input.script === undefined
      ? parseBotScript({
          ...(existing.script && typeof existing.script === "object" && !Array.isArray(existing.script)
            ? existing.script
            : {}),
          service,
        })
      : parseBotScript({
          ...(input.script && typeof input.script === "object" && !Array.isArray(input.script)
            ? (input.script as Record<string, unknown>)
            : {}),
          service,
        });
  const [row] = await db
    .update(bots)
    .set({ titleFa, analyzerSlug, script, service, updatedAt: new Date() })
    .where(eq(bots.id, id))
    .returning();
  if (row.tokenCipher) {
    try {
      await telegramSetMyCommands(openSecret(row.tokenCipher), telegramCommandsOf(parseBotScript({ ...script, service })));
    } catch {
      // menu is optional
    }
  }
  return viewOf(row);
}

export async function deleteBot(ownerId: number, id: string): Promise<void> {
  await ensureBotsSchema();
  const [existing] = await db.select().from(bots).where(eq(bots.id, id)).limit(1);
  if (!existing || existing.ownerId !== ownerId) throw new Error("not_found");
  if (existing.tokenCipher) {
    try {
      const token = openSecret(existing.tokenCipher);
      await telegramDeleteWebhook(token);
    } catch {
      // still delete local row
    }
  }
  await db.delete(bots).where(eq(bots.id, id));
}

export async function connectBot(
  ownerId: number,
  id: string,
  tokenInput: string | null,
): Promise<BotView> {
  await ensureBotsSchema();
  if (!canSealBotSecrets()) throw new Error(persianTelegramError("missing_secret"));
  const [existing] = await db.select().from(bots).where(eq(bots.id, id)).limit(1);
  if (!existing || existing.ownerId !== ownerId) throw new Error("not_found");

  let token = tokenInput?.trim() || "";
  if (token) {
    if (!isTelegramBotToken(token)) throw new Error(persianTelegramError("invalid_token"));
  } else if (existing.tokenCipher) {
    token = openSecret(existing.tokenCipher);
  } else {
    throw new Error(persianTelegramError("token_required"));
  }

  const url = webhookUrlFor(existing.id);
  if (!webhookUrlIsPublicHttps(url)) throw new Error(persianTelegramError("webhook_not_https"));

  try {
    const me = await telegramGetMe(token);
    if (!me.is_bot) throw new Error(persianTelegramError("invalid_token"));
    const webhookSecret = newWebhookSecret();
    await telegramSetWebhook(token, { url, secretToken: webhookSecret });
    try {
      const script = parseBotScript({
        ...(existing.script && typeof existing.script === "object" && !Array.isArray(existing.script)
          ? existing.script
          : {}),
        service: existing.service,
      });
      await telegramSetMyCommands(token, telegramCommandsOf(script));
    } catch {
      // menu is optional; webhook still counts as connected
    }
    const [row] = await db
      .update(bots)
      .set({
        status: "connected",
        telegramBotId: String(me.id),
        telegramUsername: me.username ?? null,
        telegramFirstName: me.first_name ?? null,
        tokenCipher: sealSecret(token),
        tokenHint: tokenHintOf(token),
        webhookSecretCipher: sealSecret(webhookSecret),
        lastError: null,
        connectedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(bots.id, id))
      .returning();
    return viewOf(row);
  } catch (error) {
    const message = error instanceof Error ? error.message : "telegram_error";
    const lastError = message.startsWith("توکن") || message.startsWith("وب‌هوک") || message.startsWith("تلگرام")
      ? message
      : persianTelegramError(message);
    await db
      .update(bots)
      .set({ status: "error", lastError, updatedAt: new Date() })
      .where(eq(bots.id, id));
    throw new Error(lastError);
  }
}

export async function disconnectBot(ownerId: number, id: string): Promise<BotView> {
  await ensureBotsSchema();
  const [existing] = await db.select().from(bots).where(eq(bots.id, id)).limit(1);
  if (!existing || existing.ownerId !== ownerId) throw new Error("not_found");
  if (existing.tokenCipher) {
    try {
      await telegramDeleteWebhook(openSecret(existing.tokenCipher));
    } catch {
      // local disconnect still
    }
  }
  const [row] = await db
    .update(bots)
    .set({
      status: "disconnected",
      lastError: null,
      connectedAt: null,
      updatedAt: new Date(),
    })
    .where(eq(bots.id, id))
    .returning();
  return viewOf(row);
}

export async function refreshBot(ownerId: number, id: string): Promise<BotView> {
  await ensureBotsSchema();
  const [existing] = await db.select().from(bots).where(eq(bots.id, id)).limit(1);
  if (!existing || existing.ownerId !== ownerId) throw new Error("not_found");
  if (!existing.tokenCipher) return viewOf(existing, { pendingUpdateCount: null });
  try {
    const info = await telegramGetWebhookInfo(openSecret(existing.tokenCipher));
    const expected = webhookUrlFor(existing.id);
    const connected = Boolean(info.url) && info.url === expected;
    const [row] = await db
      .update(bots)
      .set({
        status: connected ? "connected" : existing.status === "paused" ? "paused" : "disconnected",
        lastError: info.last_error_message || existing.lastError,
        telegramLastError: info.last_error_message || null,
        telegramPendingCount: info.pending_update_count ?? 0,
        updatedAt: new Date(),
      })
      .where(eq(bots.id, id))
      .returning();
    return viewOf(row, { pendingUpdateCount: info.pending_update_count ?? 0 });
  } catch (error) {
    const lastError = persianTelegramError(error instanceof Error ? error.message : "telegram_error");
    const [row] = await db
      .update(bots)
      .set({ status: "error", lastError, updatedAt: new Date() })
      .where(eq(bots.id, id))
      .returning();
    return viewOf(row);
  }
}

export async function markBotLastError(id: string, lastError: string | null): Promise<void> {
  await ensureBotsSchema();
  await db.update(bots).set({ lastError, updatedAt: new Date() }).where(eq(bots.id, id));
}

export async function markWebhookHit(id: string, kind: string | null, status = 200): Promise<void> {
  await ensureBotsSchema();
  await db
    .update(bots)
    .set({
      lastWebhookAt: new Date(),
      lastUpdateKind: kind,
      lastInboundStatus: status,
      ...(status === 200 ? { lastError: null } : {}),
      updatedAt: new Date(),
    })
    .where(eq(bots.id, id));
}

export function openWebhookSecret(row: BotRow): string | null {
  if (!row.webhookSecretCipher) return null;
  try {
    return openSecret(row.webhookSecretCipher);
  } catch {
    return null;
  }
}
