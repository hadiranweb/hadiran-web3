import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { botChatSessions } from "@/db/schema";
import {
  liveConsentAttempt,
  livePack,
  liveReadAttempt,
  liveSaveAnswer,
  liveSubmitAttempt,
} from "@/lib/analyzers/live-attempts";
import { itemsOf, sectionOf, type AnalyzerPack, type Item } from "@/lib/analyzers/pack";
import { buildCasioReport } from "@/lib/analyzers/casio-ss/report";
import {
  firstUnansweredIndex,
  isComplete,
  type AttemptView,
} from "@/lib/analyzers/runtime";
import { InvalidPhoneError, normalizePhone } from "@/lib/auth/phone";
import { ensureBotsSchema } from "@/lib/auth/schema-guard";
import { accountIdByTelegramUserId, linkTelegramContact } from "@/lib/bots/identity";
import { markBotLastError } from "@/lib/bots/store";
import { telegramAnswerCallback, telegramSendMessage } from "@/lib/bots/telegram";
import { absoluteUrl } from "@/lib/site";

const FA = "۰۱۲۳۴۵۶۷۸۹";

function faNum(value: number | string) {
  return String(value).replace(/\d/g, (digit) => FA[Number(digit)] ?? digit);
}

type TgUser = { id: number; first_name?: string; last_name?: string; is_bot?: boolean };
type TgChat = { id: number; type?: string };
type TgContact = { phone_number: string; first_name?: string; last_name?: string; user_id?: number };
type TgMessage = {
  message_id: number;
  from?: TgUser;
  chat: TgChat;
  text?: string;
  contact?: TgContact;
};
type TgCallback = { id: string; from: TgUser; data?: string; message?: TgMessage };
type TgUpdate = { message?: TgMessage; callback_query?: TgCallback };

function asUpdate(value: unknown): TgUpdate | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as TgUpdate;
}

async function say(
  token: string,
  botId: string,
  chatId: number,
  text: string,
  replyMarkup?: Record<string, unknown>,
) {
  try {
    await telegramSendMessage(token, { chatId, text, replyMarkup });
  } catch {
    await markBotLastError(botId, "ارسال پیام تلگرام انجام نشد.");
  }
}

async function readSession(botId: string, telegramUserId: string) {
  await ensureBotsSchema();
  const [row] = await db
    .select()
    .from(botChatSessions)
    .where(and(eq(botChatSessions.botId, botId), eq(botChatSessions.telegramUserId, telegramUserId)))
    .limit(1);
  return row ?? null;
}

async function touchSession(
  botId: string,
  telegramUserId: string,
  chatId: string,
  consented: boolean,
  awaitingReferral?: boolean,
) {
  await ensureBotsSchema();
  const existing = await readSession(botId, telegramUserId);
  const now = new Date();
  if (existing) {
    const [row] = await db
      .update(botChatSessions)
      .set({
        chatId,
        consentedAt: consented ? existing.consentedAt ?? now : existing.consentedAt,
        awaitingReferral: awaitingReferral ?? existing.awaitingReferral,
        updatedAt: now,
      })
      .where(and(eq(botChatSessions.botId, botId), eq(botChatSessions.telegramUserId, telegramUserId)))
      .returning();
    return row;
  }
  try {
    const [row] = await db
      .insert(botChatSessions)
      .values({
        botId,
        telegramUserId,
        chatId,
        consentedAt: consented ? now : null,
        awaitingReferral: awaitingReferral ?? false,
      })
      .returning();
    return row;
  } catch {
    return readSession(botId, telegramUserId);
  }
}

function consentKeyboard(label: string) {
  return { inline_keyboard: [[{ text: label, callback_data: "ok" }]] };
}

function phoneKeyboard() {
  return {
    keyboard: [[{ text: "ارسال شمارهٔ همراه", request_contact: true }]],
    resize_keyboard: true,
    one_time_keyboard: true,
  };
}

function rangeKeyboard(itemIndex: number) {
  const btn = (value: number) => ({ text: faNum(value), callback_data: `q:${itemIndex}:${value}` });
  return {
    inline_keyboard: [
      [10, 9, 8, 7, 6].map(btn),
      [5, 4, 3, 2, 1, 0].map(btn),
    ],
  };
}

function choiceKeyboard(itemIndex: number, item: Extract<Item, { kind: "choice" }>) {
  return {
    inline_keyboard: item.options.map((option, optionIndex) => [
      { text: option.label.slice(0, 64), callback_data: `c:${itemIndex}:${optionIndex}` },
    ]),
  };
}

function questionText(pack: AnalyzerPack, item: Item, index: number) {
  const all = itemsOf(pack);
  const section = sectionOf(pack, item.id);
  const sectionItems = section ? section.items : [item];
  const sectionPos = sectionItems.findIndex((row) => row.id === item.id) + 1;
  const lines = [
    section?.titleFa ?? pack.nameFa,
    `سؤال ${faNum(index + 1)} از ${faNum(all.length)}`,
    "",
  ];
  if (section?.introFa && sectionPos === 1) {
    lines.push(section.introFa, "");
  }
  lines.push(item.text);
  if (item.kind === "range") {
    lines.push("", `۰ (راست) — ${item.anchors[0]}`, `۱۰ (چپ) — ${item.anchors[10]}`);
  }
  if (item.kind === "text") {
    lines.push("", `پاسخ را همین‌جا بنویسید (تا ${faNum(item.maxLength)} نویسه).`);
  }
  return lines.join("\n");
}

function doneText(pack: AnalyzerPack, attempt: AttemptView): string {
  const lines = [`${pack.nameFa} ثبت شد.`];
  if (pack.slug === "casio-ss" && attempt.results) {
    const report = buildCasioReport(pack, attempt.answers, attempt.results);
    lines.push(
      `نمرهٔ کل: ${faNum(report.total)}`,
      `بلوغ: ${report.maturity.labelFa}`,
      `گلوگاه: ${report.bottleneck.titleFa}`,
    );
    for (const layer of report.layers) {
      lines.push(`${layer.titleFa}: ${faNum(layer.score)}`);
    }
    if (report.closingFa) lines.push("", report.closingFa);
  } else if (attempt.results) {
    const total = attempt.results.scores["diagnosis-total"];
    if (typeof total === "number") lines.push(`نمرهٔ کل: ${faNum(Math.round(total * 10) / 10)}`);
    const bottleneck = attempt.results.scores.bottleneck;
    if (typeof bottleneck === "string") {
      const finding = pack.findings.find((row) => row.id === bottleneck);
      lines.push(`گلوگاه: ${finding?.titleFa ?? bottleneck}`);
    }
  }
  lines.push("", `گزارش کامل با ورود همین شماره: ${absoluteUrl(`/analyzers/${pack.slug}/report`)}`);
  return lines.join("\n");
}

async function promptConsent(token: string, botId: string, chatId: number, pack: AnalyzerPack) {
  const text = [`${pack.nameFa}`, pack.summaryFa, "", pack.consent.titleFa, "", ...pack.consent.bodyFa].join("\n");
  await say(token, botId, chatId, text, consentKeyboard(pack.consent.acceptLabelFa));
}

async function promptPhone(token: string, botId: string, chatId: number) {
  await say(
    token,
    botId,
    chatId,
    "برای ادامه، شمارهٔ همراه خودتان را با دکمه بفرستید. شمارهٔ دیگران پذیرفته نمی‌شود.",
    phoneKeyboard(),
  );
}

async function promptQuestion(
  token: string,
  botId: string,
  chatId: number,
  pack: AnalyzerPack,
  attempt: AttemptView,
) {
  const items = itemsOf(pack);
  if (attempt.status === "submitted" || isComplete(pack, attempt.answers)) {
    await say(token, botId, chatId, doneText(pack, attempt), { remove_keyboard: true });
    return;
  }
  const index = firstUnansweredIndex(pack, attempt.answers);
  const item = items[index];
  if (!item) return;
  let markup: Record<string, unknown> | undefined;
  if (item.kind === "range") markup = rangeKeyboard(index);
  if (item.kind === "choice") markup = choiceKeyboard(index, item);
  await say(token, botId, chatId, questionText(pack, item, index), markup);
}

async function continueQuiz(
  token: string,
  botId: string,
  chatId: number,
  accountId: number,
  pack: AnalyzerPack,
) {
  let attempt = await liveReadAttempt(accountId, pack.slug);
  if (!attempt?.consentAt) {
    const next = await liveConsentAttempt(accountId, pack.slug);
    if (next && "error" in next) {
      await say(token, botId, chatId, "رضایت ثبت نشد.");
      return;
    }
    attempt = next;
  }
  if (!attempt) {
    await say(token, botId, chatId, "آزمون در دسترس نیست.");
    return;
  }
  if (attempt.status === "submitted") {
    await say(token, botId, chatId, doneText(pack, attempt), { remove_keyboard: true });
    return;
  }
  if (isComplete(pack, attempt.answers)) {
    const submitted = await liveSubmitAttempt(accountId, pack.slug);
    if (submitted.ok) {
      await say(token, botId, chatId, doneText(pack, submitted.attempt), { remove_keyboard: true });
      return;
    }
  }
  await promptQuestion(token, botId, chatId, pack, attempt);
}

async function handleStart(
  token: string,
  botId: string,
  chatId: number,
  telegramUserId: string,
  pack: AnalyzerPack,
) {
  await touchSession(botId, telegramUserId, String(chatId), false);
  const accountId = await accountIdByTelegramUserId(telegramUserId);
  if (!accountId) {
    await promptConsent(token, botId, chatId, pack);
    return;
  }
  await continueQuiz(token, botId, chatId, accountId, pack);
}

export async function handleTelegramUpdate(input: {
  botId: string;
  analyzerSlug: string | null;
  token: string;
  update: unknown;
}): Promise<void> {
  const update = asUpdate(input.update);
  if (!update) return;
  const callback = update.callback_query;
  const message = callback?.message ?? update.message;
  const from = callback?.from ?? message?.from;
  const chat = message?.chat;
  if (!from || from.is_bot || !chat) return;
  if (chat.type && chat.type !== "private") return;
  if (callback) await telegramAnswerCallback(input.token, callback.id);

  const slug = input.analyzerSlug?.trim() || "casio-ss";
  const pack = await livePack(slug);
  if (!pack) {
    await say(input.token, input.botId, chat.id, "آزمونی برای این ربات انتخاب نشده.");
    return;
  }

  const telegramUserId = String(from.id);

  if (callback?.data === "skipref") {
    await touchSession(input.botId, telegramUserId, String(chat.id), true, false);
    const accountId = await accountIdByTelegramUserId(telegramUserId);
    if (accountId) await continueQuiz(input.token, input.botId, chat.id, accountId, pack);
    return;
  }

  if (callback?.data === "ok") {
    await touchSession(input.botId, telegramUserId, String(chat.id), true);
    const accountId = await accountIdByTelegramUserId(telegramUserId);
    if (accountId) {
      await continueQuiz(input.token, input.botId, chat.id, accountId, pack);
      return;
    }
    await promptPhone(input.token, input.botId, chat.id);
    return;
  }

  if (callback?.data) {
    const accountId = await accountIdByTelegramUserId(telegramUserId);
    if (!accountId) {
      await promptConsent(input.token, input.botId, chat.id, pack);
      return;
    }
    const items = itemsOf(pack);
    const rangeMatch = /^q:(\d+):(\d+)$/.exec(callback.data);
    const choiceMatch = /^c:(\d+):(\d+)$/.exec(callback.data);
    let item: Item | undefined;
    let value: number | string | undefined;
    if (rangeMatch) {
      item = items[Number(rangeMatch[1])];
      value = Number(rangeMatch[2]);
    } else if (choiceMatch) {
      item = items[Number(choiceMatch[1])];
      const optionIndex = Number(choiceMatch[2]);
      if (item?.kind === "choice") value = item.options[optionIndex]?.value;
    }
    if (!item || value == null) {
      await say(input.token, input.botId, chat.id, "این دکمه دیگر معتبر نیست. /start بزنید.");
      return;
    }
    const saved = await liveSaveAnswer(accountId, pack.slug, item.id, value);
    if (!saved.ok) {
      if (saved.error === "already_submitted") {
        const attempt = await liveReadAttempt(accountId, pack.slug);
        if (attempt) await say(input.token, input.botId, chat.id, doneText(pack, attempt));
        return;
      }
      if (saved.error === "consent_required") {
        await promptConsent(input.token, input.botId, chat.id, pack);
        return;
      }
      await say(input.token, input.botId, chat.id, "این پاسخ ذخیره نشد. دوباره تلاش کنید.");
      return;
    }
    await continueQuiz(input.token, input.botId, chat.id, accountId, pack);
    return;
  }

  if (!message) return;
  const text = message.text?.trim() ?? "";
  const session = await readSession(input.botId, telegramUserId);
  if (session?.awaitingReferral && text && text !== "/start" && !text.startsWith("/start ")) {
    const accountId = await accountIdByTelegramUserId(telegramUserId);
    if (accountId && (text === "رد" || text === "/skip")) {
      await touchSession(input.botId, telegramUserId, String(chat.id), true, false);
      await continueQuiz(input.token, input.botId, chat.id, accountId, pack);
      return;
    }
    if (accountId) {
      const { setAccountReferrer } = await import("@/lib/auth/referral");
      const { applyAttemptCodes } = await import("@/lib/analyzers/attempt-codes");
      const set = await setAccountReferrer(accountId, text);
      if (!set.ok && set.error !== "invalid_referral") {
        await say(input.token, input.botId, chat.id, "این کد معرف پذیرفته نشد. دوباره بفرستید یا بنویسید: رد");
        return;
      }
      if (set.ok && !("skipped" in set)) {
        await applyAttemptCodes({ slug: pack.slug, accountId, referralCode: text });
      } else if (!set.ok) {
        await say(input.token, input.botId, chat.id, "کد معرف هشت رقم است یا «رد».");
        return;
      }
      await touchSession(input.botId, telegramUserId, String(chat.id), true, false);
      await continueQuiz(input.token, input.botId, chat.id, accountId, pack);
      return;
    }
  }
  if (text === "/start" || text === "/help" || text.startsWith("/start ")) {
    await handleStart(input.token, input.botId, chat.id, telegramUserId, pack);
    return;
  }

  if (message.contact) {
    const session = await readSession(input.botId, telegramUserId);
    if (!session?.consentedAt) {
      await promptConsent(input.token, input.botId, chat.id, pack);
      return;
    }
    if (message.contact.user_id != null && message.contact.user_id !== from.id) {
      await say(input.token, input.botId, chat.id, "فقط شمارهٔ خودتان را بفرستید.");
      return;
    }
    let phone: string;
    try {
      phone = normalizePhone(message.contact.phone_number);
    } catch (error) {
      if (error instanceof InvalidPhoneError) {
        await say(input.token, input.botId, chat.id, "فقط موبایل ایران پذیرفته می‌شود.");
        return;
      }
      throw error;
    }
    const linked = await linkTelegramContact({
      telegramUserId,
      phone,
      givenName: message.contact.first_name || from.first_name || null,
      familyName: message.contact.last_name || from.last_name || null,
    });
    if (!linked.ok) {
      await say(input.token, input.botId, chat.id, linked.error);
      return;
    }
    await say(input.token, input.botId, chat.id, "شماره ثبت شد.", { remove_keyboard: true });
    const { referredByPublicCode } = await import("@/lib/auth/referral");
    const already = await referredByPublicCode(linked.accountId);
    if (!already) {
      await touchSession(input.botId, telegramUserId, String(chat.id), true, true);
      await say(input.token, input.botId, chat.id, "اگر کد معرف دارید بفرستید (۸ رقم). اگر ندارید بنویسید: رد", {
        inline_keyboard: [[{ text: "رد کردن", callback_data: "skipref" }]],
      });
      return;
    }
    await continueQuiz(input.token, input.botId, chat.id, linked.accountId, pack);
    return;
  }

  const accountId = await accountIdByTelegramUserId(telegramUserId);
  if (!accountId) {
    const session = await readSession(input.botId, telegramUserId);
    if (session?.consentedAt) {
      await promptPhone(input.token, input.botId, chat.id);
      return;
    }
    await promptConsent(input.token, input.botId, chat.id, pack);
    return;
  }

  const attempt = await liveReadAttempt(accountId, pack.slug);
  if (!attempt?.consentAt) {
    await promptConsent(input.token, input.botId, chat.id, pack);
    return;
  }
  if (attempt.status === "submitted") {
    await say(input.token, input.botId, chat.id, doneText(pack, attempt), { remove_keyboard: true });
    return;
  }
  const items = itemsOf(pack);
  const index = firstUnansweredIndex(pack, attempt.answers);
  const item = items[index];
  if (!item) {
    await continueQuiz(input.token, input.botId, chat.id, accountId, pack);
    return;
  }
  if (item.kind !== "text") {
    await promptQuestion(input.token, input.botId, chat.id, pack, attempt);
    return;
  }
  if (!text) {
    await promptQuestion(input.token, input.botId, chat.id, pack, attempt);
    return;
  }
  const saved = await liveSaveAnswer(accountId, pack.slug, item.id, text);
  if (!saved.ok) {
    await say(
      input.token,
      input.botId,
      chat.id,
      saved.error === "invalid_answer" ? `متن را کوتاه‌تر و کامل بنویسید (تا ${faNum(item.maxLength)} نویسه).` : "ذخیره نشد.",
    );
    return;
  }
  await continueQuiz(input.token, input.botId, chat.id, accountId, pack);
}
