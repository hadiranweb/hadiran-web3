/** Telegram Bot API — webhook, not getUpdates. Token never logged. */

import { absoluteUrl } from "@/lib/site";

const TELEGRAM_API_DEFAULT = "https://api.telegram.org";

/** Outbound base. On Iranian Liara set TELEGRAM_API_BASE to the Cloudflare Worker (docs/telegram-proxy.md). */
export function telegramApiBase(): string {
  const raw = (process.env.TELEGRAM_API_BASE || "").trim().replace(/\/+$/, "");
  if (!raw) return TELEGRAM_API_DEFAULT;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") return TELEGRAM_API_DEFAULT;
    return `${url.origin}${url.pathname.replace(/\/+$/, "")}`;
  } catch {
    return TELEGRAM_API_DEFAULT;
  }
}

export function telegramApiBaseIsProxy(): boolean {
  return telegramApiBase() !== TELEGRAM_API_DEFAULT;
}

export type TelegramUser = {
  id: number;
  is_bot?: boolean;
  first_name?: string;
  username?: string;
};

export type TelegramWebhookInfo = {
  url?: string;
  pending_update_count?: number;
  last_error_date?: number;
  last_error_message?: string;
  max_connections?: number;
};

type TelegramResponse<T> = { ok: boolean; result?: T; description?: string; error_code?: number };

async function call<T>(token: string, method: string, body?: Record<string, unknown>): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${telegramApiBase()}/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : "{}",
      signal: AbortSignal.timeout(12_000),
    });
  } catch {
    throw new Error("telegram_unreachable");
  }
  let data: TelegramResponse<T>;
  try {
    data = (await res.json()) as TelegramResponse<T>;
  } catch {
    throw new Error("telegram_unreachable");
  }
  if (!data.ok || data.result == null) {
    if (data.error_code === 401) throw new Error("telegram_unauthorized");
    throw new Error("telegram_error");
  }
  return data.result;
}

export async function telegramGetMe(token: string): Promise<TelegramUser> {
  return call<TelegramUser>(token, "getMe");
}

export async function telegramSetWebhook(
  token: string,
  args: { url: string; secretToken: string },
): Promise<true> {
  return call<true>(token, "setWebhook", {
    url: args.url,
    secret_token: args.secretToken,
    allowed_updates: ["message", "callback_query"],
    drop_pending_updates: false,
    max_connections: 20,
  });
}

export async function telegramDeleteWebhook(token: string): Promise<true> {
  return call<true>(token, "deleteWebhook", { drop_pending_updates: false });
}

export async function telegramGetWebhookInfo(token: string): Promise<TelegramWebhookInfo> {
  return call<TelegramWebhookInfo>(token, "getWebhookInfo");
}

export async function telegramSetMyCommands(
  token: string,
  commands: { command: string; description: string }[],
): Promise<true> {
  return call<true>(token, "setMyCommands", {
    commands,
    language_code: "fa",
  });
}

export async function telegramSetMyDescription(token: string, description: string): Promise<void> {
  await call<true>(token, "setMyDescription", { description: description.slice(0, 512), language_code: "fa" });
}

export async function telegramSetMyShortDescription(token: string, shortDescription: string): Promise<void> {
  await call<true>(token, "setMyShortDescription", {
    short_description: shortDescription.slice(0, 120),
    language_code: "fa",
  });
}

export async function telegramSetChatMenuButton(token: string): Promise<void> {
  await call<true>(token, "setChatMenuButton", { menu_button: { type: "commands" } });
}

export async function telegramDeleteMessages(
  token: string,
  args: { chatId: number | string; messageIds: number[] },
): Promise<void> {
  const ids = args.messageIds.filter((id) => Number.isInteger(id) && id > 0).slice(0, 100);
  if (!ids.length) return;
  await call<true>(token, "deleteMessages", { chat_id: args.chatId, message_ids: ids });
}

export async function telegramSendMessage(
  token: string,
  args: { chatId: number | string; text: string; replyMarkup?: Record<string, unknown> },
): Promise<void> {
  const payload: Record<string, unknown> = {
    chat_id: args.chatId,
    text: args.text.slice(0, 4096),
  };
  if (args.replyMarkup) payload.reply_markup = args.replyMarkup;
  await call<unknown>(token, "sendMessage", payload);
}

export async function telegramEditMessage(
  token: string,
  args: { chatId: number | string; messageId: number; text: string; replyMarkup?: Record<string, unknown> },
): Promise<void> {
  const payload: Record<string, unknown> = {
    chat_id: args.chatId,
    message_id: args.messageId,
    text: args.text.slice(0, 4096),
  };
  if (args.replyMarkup) payload.reply_markup = args.replyMarkup;
  await call<unknown>(token, "editMessageText", payload);
}

export async function telegramAnswerCallback(token: string, callbackQueryId: string): Promise<void> {
  try {
    await call<unknown>(token, "answerCallbackQuery", { callback_query_id: callbackQueryId });
  } catch {
    // expired query
  }
}

export function isTelegramBotToken(value: string): boolean {
  return /^\d{6,}:[A-Za-z0-9_-]{20,}$/.test(value.trim());
}

export function webhookUrlFor(botId: string): string {
  if (telegramApiBaseIsProxy()) {
    return `${telegramApiBase()}/hook/${botId}`;
  }
  return absoluteUrl(`/api/bots/telegram/${botId}/webhook`);
}

export function webhookUrlIsPublicHttps(url: string): boolean {
  return url.startsWith("https://") && !url.includes("localhost") && !url.includes("127.0.0.1");
}
