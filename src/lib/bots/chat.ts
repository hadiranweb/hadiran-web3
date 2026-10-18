import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { accounts, botChatSessions } from "@/db/schema";
import { loadAnalyzers } from "@/lib/analyzers/catalog";
import {
  liveConsentAttempt,
  livePack,
  liveReadAttempt,
  liveRetakeAttempt,
  liveSaveAnswer,
  liveSubmitAttempt,
} from "@/lib/analyzers/live-attempts";
import { itemsOf, sectionOf, type AnalyzerPack, type Item } from "@/lib/analyzers/pack";
import { applyAttemptCodes } from "@/lib/analyzers/attempt-codes";
import {
  firstUnansweredIndex,
  isComplete,
  type AttemptView,
} from "@/lib/analyzers/runtime";
import { renderUserSummary } from "@/lib/analyzers/summary-template";
import { onboardingFlags } from "@/lib/auth/onboarding";
import { issueLoginOtp, consumeLoginOtp } from "@/lib/auth/otp-login";
import { InvalidPhoneError, normalizePhone } from "@/lib/auth/phone";
import { displayNameFromParts, normalizePersonName } from "@/lib/auth/profile";
import { referredByPublicCode, setAccountReferrer } from "@/lib/auth/referral";
import { ensureBotsSchema } from "@/lib/auth/schema-guard";
import { privacyPolicyVersion } from "@/lib/privacy/version";
import { accountIdByTelegramUserId, linkTelegramContact } from "@/lib/bots/identity";
import { markBotLastError } from "@/lib/bots/store";
import { botConsent } from "@/lib/bots/copy";
import { botVars, interpolateBotText, line, matchBotKey, parseBotScript, type BotKey, type BotScript } from "@/lib/bots/script";
import { telegramAnswerCallback, telegramDeleteMessages, telegramEditMessage, telegramSendMessage } from "@/lib/bots/telegram";
import { absoluteUrl } from "@/lib/site";

const FA = "۰۱۲۳۴۵۶۷۸۹";
const START_IDLE_MS = 10 * 60 * 1000;

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

type SessionPatch = {
  chatId?: string;
  consentedAt?: Date | null;
  awaitingReferral?: boolean;
  awaitingDiscount?: boolean;
  step?: string;
  analyzerSlug?: string | null;
  pendingPhone?: string | null;
  viaContact?: boolean;
  passwordLinkSentAt?: Date | null;
};

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

async function patchSession(botId: string, telegramUserId: string, chatId: string, patch: SessionPatch) {
  await ensureBotsSchema();
  const existing = await readSession(botId, telegramUserId);
  const now = new Date();
  if (existing) {
    const [row] = await db
      .update(botChatSessions)
      .set({
        chatId,
        consentedAt: patch.consentedAt === undefined ? existing.consentedAt : patch.consentedAt,
        awaitingReferral: patch.awaitingReferral ?? existing.awaitingReferral,
        awaitingDiscount: patch.awaitingDiscount ?? existing.awaitingDiscount,
        step: patch.step ?? existing.step,
        analyzerSlug: patch.analyzerSlug === undefined ? existing.analyzerSlug : patch.analyzerSlug,
        pendingPhone: patch.pendingPhone === undefined ? existing.pendingPhone : patch.pendingPhone,
        viaContact: patch.viaContact ?? existing.viaContact,
        passwordLinkSentAt:
          patch.passwordLinkSentAt === undefined ? existing.passwordLinkSentAt : patch.passwordLinkSentAt,
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
        consentedAt: patch.consentedAt ?? null,
        awaitingReferral: patch.awaitingReferral ?? false,
        awaitingDiscount: patch.awaitingDiscount ?? false,
        step: patch.step ?? "start",
        analyzerSlug: patch.analyzerSlug ?? null,
        pendingPhone: patch.pendingPhone ?? null,
        viaContact: patch.viaContact ?? false,
        passwordLinkSentAt: patch.passwordLinkSentAt ?? null,
      })
      .returning();
    return row;
  } catch {
    return readSession(botId, telegramUserId);
  }
}

function varsOf(titleFa: string, extra?: Record<string, string>) {
  return botVars({ service: titleFa || "تحلیل‌گر هوشمند", privacy: absoluteUrl("/privacy"), ...extra });
}

function isSkipText(text: string, label: string) {
  const n = text.replace(/\s+/g, " ").trim();
  return n === "رد" || n === "/skip" || n === label.trim();
}

function buttonStyle(action: BotKey["action"] | "contact"): string | undefined {
  if (action === "start" || action === "exams" || action === "contact") return "primary";
  if (action === "restart") return "success";
  if (action === "clear") return "danger";
  return undefined;
}

function replyButton(text: string, action: BotKey["action"] | "contact", extra?: Record<string, unknown>) {
  const style = buttonStyle(action);
  return { text: text.slice(0, 64), ...(style ? { style } : {}), ...extra };
}

function keysMarkup(script: BotScript) {
  const buttons = script.keys.filter((key) => key.inKeyboard && key.labelFa);
  const rest = buttons.filter((key) => key.action !== "clear");
  const clear = buttons.find((key) => key.action === "clear");
  const rows: Record<string, unknown>[][] = [];
  for (let i = 0; i < rest.length; i += 2) {
    rows.push(rest.slice(i, i + 2).map((key) => replyButton(key.labelFa, key.action)));
  }
  rows.push([replyButton(clear?.labelFa || "پاک کردن تاریخچه", "clear")]);
  return {
    keyboard: rows,
    resize_keyboard: true,
    is_persistent: true,
    input_field_placeholder: "یک کلید را بزنید…",
  };
}

function phoneKeyboard(script: BotScript) {
  const keys = keysMarkup(script);
  return {
    keyboard: [
      [replyButton(script.texts.phoneButton, "contact", { request_contact: true })],
      ...((keys.keyboard as Record<string, unknown>[][]) ?? []),
    ],
    resize_keyboard: true,
    is_persistent: true,
    input_field_placeholder: "شماره را بفرستید…",
  };
}

async function clearTelegramChat(token: string, chatId: number, lastMessageId: number) {
  const last = Math.max(1, Math.floor(lastMessageId));
  const from = Math.max(1, last - 299);
  const ids: number[] = [];
  for (let id = from; id <= last; id += 1) ids.push(id);
  for (let i = 0; i < ids.length; i += 100) {
    try {
      await telegramDeleteMessages(token, { chatId, messageIds: ids.slice(i, i + 100) });
    } catch {
      // پیام‌های قدیمی‌تر از ۴۸ ساعت یا ناموجود رد می‌شوند
    }
  }
}

function rangeRows(itemIndex: number) {
  const btn = (value: number) => ({ text: faNum(value), callback_data: `q:${itemIndex}:${value}` });
  return [[10, 9, 8, 7, 6].map(btn), [5, 4, 3, 2, 1, 0].map(btn)];
}

function choiceRows(itemIndex: number, item: Extract<Item, { kind: "choice" }>) {
  return item.options.map((option, optionIndex) => [
    { text: option.label.slice(0, 64), callback_data: `c:${itemIndex}:${optionIndex}` },
  ]);
}

function questionGuideBody(pack: AnalyzerPack, item: Item, index: number) {
  const all = itemsOf(pack);
  const section = sectionOf(pack, item.id);
  const lines = [section?.titleFa ?? pack.nameFa, `سؤال ${faNum(index + 1)} از ${faNum(all.length)}`];
  if (section?.introFa) lines.push("", section.introFa);
  if (item.kind === "range") {
    lines.push("", `۰ (راست) — ${item.anchors[0]}`);
    if (item.anchors[5]) lines.push(`۵ — ${item.anchors[5]}`);
    lines.push(`۱۰ (چپ) — ${item.anchors[10]}`);
  }
  if (item.kind === "text") {
    lines.push("", `پاسخ را همین‌جا بنویسید (تا ${faNum(item.maxLength)} نویسه).`);
  }
  return lines.join("\n");
}

function questionText(item: Item) {
  return item.text;
}

function questionMessage(item: Item, pack: AnalyzerPack, index: number, open: boolean) {
  if (!open) return questionText(item);
  return [questionText(item), "", questionGuideBody(pack, item, index)].join("\n");
}

function questionMarkup(itemIndex: number, item: Item, script: BotScript, open: boolean) {
  const rows =
    item.kind === "range" ? rangeRows(itemIndex) : item.kind === "choice" ? choiceRows(itemIndex, item) : [];
  const label = (open ? script.texts.questionGuideClose : script.texts.questionGuide).slice(0, 64);
  rows.push([{ text: label, callback_data: `g:${itemIndex}:${open ? "1" : "0"}` }]);
  return { inline_keyboard: rows };
}

function doneText(pack: AnalyzerPack, attempt: AttemptView): string {
  const summary = renderUserSummary(pack, attempt.answers, attempt.results);
  return [summary, "", `بازخوانی: ${absoluteUrl(`/analyzers/${pack.slug}/report`)}`].join("\n");
}

function commandName(text: string): string | null {
  const match = /^\/([a-zA-Z0-9_]+)(?:@[A-Za-z0-9_]+)?(?:\s|$)/.exec(text);
  return match ? match[1].toLowerCase() : null;
}

async function readAccount(id: number) {
  const [row] = await db.select().from(accounts).where(eq(accounts.id, id)).limit(1);
  return row ?? null;
}

async function promptPhone(token: string, botId: string, chatId: number, script: BotScript, titleFa: string) {
  await say(token, botId, chatId, line(script, "phonePrompt", varsOf(titleFa)), phoneKeyboard(script));
}

async function promptExamList(
  token: string,
  botId: string,
  chatId: number,
  script: BotScript,
  titleFa: string,
  boundSlug: string | null,
) {
  const open = (await loadAnalyzers()).filter(
    (item) => item.status === "open" && (!boundSlug || item.slug === boundSlug),
  );
  if (!open.length) {
    await say(token, botId, chatId, line(script, "noExams", varsOf(titleFa)), keysMarkup(script));
    return;
  }
  await say(token, botId, chatId, line(script, "examPick", varsOf(titleFa)), {
    inline_keyboard: open.map((item) => [
      { text: item.nameFa.slice(0, 64), callback_data: `exam:${item.slug}`, style: "primary" },
    ]),
  });
}

async function promptQuestion(
  token: string,
  botId: string,
  chatId: number,
  pack: AnalyzerPack,
  attempt: AttemptView,
  script: BotScript,
) {
  const items = itemsOf(pack);
  if (attempt.status === "submitted" || isComplete(pack, attempt.answers)) {
    await say(token, botId, chatId, doneText(pack, attempt), keysMarkup(script));
    return;
  }
  const index = firstUnansweredIndex(pack, attempt.answers);
  const item = items[index];
  if (!item) return;
  await say(token, botId, chatId, questionMessage(item, pack, index, false), questionMarkup(index, item, script, false));
}

async function continueQuiz(
  token: string,
  botId: string,
  chatId: number,
  accountId: number,
  pack: AnalyzerPack,
  script: BotScript,
  titleFa: string,
) {
  let attempt = await liveReadAttempt(accountId, pack.slug);
  if (!attempt?.consentAt) {
    const next = await liveConsentAttempt(accountId, pack.slug);
    if (next && "error" in next) {
      await say(token, botId, chatId, line(script, "packConsentFailed", varsOf(titleFa, { exam: pack.nameFa })));
      return;
    }
    attempt = next;
  }
  if (!attempt) {
    await say(token, botId, chatId, line(script, "examMissing", varsOf(titleFa, { exam: pack.nameFa })));
    return;
  }
  if (attempt.status === "submitted") {
    await say(token, botId, chatId, doneText(pack, attempt), keysMarkup(script));
    return;
  }
  if (isComplete(pack, attempt.answers)) {
    const submitted = await liveSubmitAttempt(accountId, pack.slug);
    if (submitted.ok) {
      await say(token, botId, chatId, doneText(pack, submitted.attempt), keysMarkup(script));
      return;
    }
  }
  await promptQuestion(token, botId, chatId, pack, attempt, script);
}

async function afterAccount(
  token: string,
  botId: string,
  chatId: number,
  telegramUserId: string,
  accountId: number,
  script: BotScript,
  titleFa: string,
  boundSlug: string | null,
) {
  const account = await readAccount(accountId);
  if (!account) {
    await promptPhone(token, botId, chatId, script, titleFa);
    return;
  }
  const flags = onboardingFlags(account);
  const session = await readSession(botId, telegramUserId);
  const v = varsOf(titleFa);
  if (script.flow.askPolicy && !flags.policiesAccepted) {
    await patchSession(botId, telegramUserId, String(chatId), { step: "policy" });
    await say(token, botId, chatId, line(script, "policy", v), {
      inline_keyboard: [[{ text: script.texts.policyButton.slice(0, 64), callback_data: "policyok", style: "success" }]],
    });
    return;
  }
  if (script.flow.askNames && !account.givenName?.trim()) {
    await patchSession(botId, telegramUserId, String(chatId), { step: "given" });
    await say(token, botId, chatId, line(script, "givenPrompt", v));
    return;
  }
  if (script.flow.askNames && !account.familyName?.trim()) {
    await patchSession(botId, telegramUserId, String(chatId), { step: "family" });
    await say(token, botId, chatId, line(script, "familyPrompt", v));
    return;
  }
  const already = await referredByPublicCode(accountId);
  if (
    script.flow.askReferral &&
    !already &&
    session?.step !== "pick" &&
    session?.step !== "quiz" &&
    session?.step !== "discount" &&
    session?.step !== "pack_consent"
  ) {
    await patchSession(botId, telegramUserId, String(chatId), { step: "referral", awaitingReferral: true });
    await say(token, botId, chatId, line(script, "referralPrompt", v), {
      inline_keyboard: [[{ text: script.texts.referralSkip.slice(0, 64), callback_data: "skipref" }]],
    });
    return;
  }
  if (script.service !== "analyzers") {
    await patchSession(botId, telegramUserId, String(chatId), { step: "idle", awaitingReferral: false });
    await say(token, botId, chatId, line(script, "ready", v), keysMarkup(script));
    return;
  }
  await patchSession(botId, telegramUserId, String(chatId), { step: "pick", awaitingReferral: false });
  await promptExamList(token, botId, chatId, script, titleFa, boundSlug);
}

async function startPack(
  token: string,
  botId: string,
  chatId: number,
  telegramUserId: string,
  slug: string,
  script: BotScript,
  titleFa: string,
  boundSlug: string | null,
) {
  if (script.service !== "analyzers") {
    await say(token, botId, chatId, line(script, "ready", varsOf(titleFa)));
    return;
  }
  if (boundSlug && slug !== boundSlug) {
    await say(token, botId, chatId, line(script, "examClosed", varsOf(titleFa, { exam: slug })));
    return;
  }
  const pack = await livePack(slug);
  if (!pack || pack.status !== "open") {
    await say(token, botId, chatId, line(script, "examClosed", varsOf(titleFa, { exam: pack?.nameFa ?? slug })));
    return;
  }
  const accountId = await accountIdByTelegramUserId(telegramUserId);
  const existing = accountId ? await liveReadAttempt(accountId, slug) : null;
  if (existing?.status === "submitted") {
    await patchSession(botId, telegramUserId, String(chatId), { step: "quiz", analyzerSlug: slug });
    await say(token, botId, chatId, doneText(pack, existing), keysMarkup(script));
    return;
  }
  if (accountId && existing?.consentAt && existing.status === "in_progress") {
    await patchSession(botId, telegramUserId, String(chatId), { step: "quiz", analyzerSlug: slug, awaitingDiscount: false });
    await continueQuiz(token, botId, chatId, accountId, pack, script, titleFa);
    return;
  }
  await patchSession(botId, telegramUserId, String(chatId), {
    step: "pack_consent",
    analyzerSlug: slug,
    awaitingDiscount: false,
  });
  await say(token, botId, chatId, botConsent(pack), {
    inline_keyboard: [[{ text: pack.consent.acceptLabelFa, callback_data: "packok", style: "success" }]],
  });
}

async function runBotKey(input: {
  token: string;
  botId: string;
  chatId: number;
  telegramUserId: string;
  script: BotScript;
  titleFa: string;
  boundSlug: string | null;
  key: BotKey;
  lastMessageId?: number;
}): Promise<void> {
  const { token, botId, chatId, telegramUserId, script, titleFa, boundSlug, key } = input;
  const v = varsOf(titleFa);
  if (key.action === "clear") {
    if (input.lastMessageId) await clearTelegramChat(token, chatId, input.lastMessageId);
    return;
  }
  if (key.action === "help") {
    await say(token, botId, chatId, line(script, "help", v), keysMarkup(script));
    return;
  }
  if (key.action === "reply") {
    await say(token, botId, chatId, interpolateOrReady(script, key, titleFa), keysMarkup(script));
    return;
  }
  if (key.action === "exams") {
    const accountId = await accountIdByTelegramUserId(telegramUserId);
    if (!accountId) {
      await promptPhone(token, botId, chatId, script, titleFa);
      return;
    }
    if (script.service !== "analyzers") {
      await afterAccount(token, botId, chatId, telegramUserId, accountId, script, titleFa, boundSlug);
      return;
    }
    await patchSession(botId, telegramUserId, String(chatId), { step: "pick" });
    await promptExamList(token, botId, chatId, script, titleFa, boundSlug);
    return;
  }
  if (key.action === "restart") {
    const accountId = await accountIdByTelegramUserId(telegramUserId);
    if (!accountId) {
      await promptPhone(token, botId, chatId, script, titleFa);
      return;
    }
    const session = await readSession(botId, telegramUserId);
    const slug = session?.analyzerSlug || boundSlug;
    if (!slug || script.service !== "analyzers") {
      await promptExamList(token, botId, chatId, script, titleFa, boundSlug);
      return;
    }
    await liveRetakeAttempt(accountId, slug);
    await startPack(token, botId, chatId, telegramUserId, slug, script, titleFa, boundSlug);
    return;
  }
  await patchSession(botId, telegramUserId, String(chatId), { step: "start" });
  await say(token, botId, chatId, line(script, "welcome", v), keysMarkup(script));
  const accountId = await accountIdByTelegramUserId(telegramUserId);
  if (!accountId) {
    await patchSession(botId, telegramUserId, String(chatId), { step: "phone" });
    await promptPhone(token, botId, chatId, script, titleFa);
    return;
  }
  await afterAccount(token, botId, chatId, telegramUserId, accountId, script, titleFa, boundSlug);
}

function interpolateOrReady(script: BotScript, key: BotKey, titleFa: string) {
  const text = key.replyFa.trim();
  if (!text) return line(script, "idleReply", varsOf(titleFa));
  return interpolateBotText(text, varsOf(titleFa)).slice(0, 4096);
}

export async function handleTelegramUpdate(input: {
  botId: string;
  token: string;
  update: unknown;
  script?: unknown;
  titleFa?: string;
  analyzerSlug?: string | null;
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

  const token = input.token;
  const botId = input.botId;
  const chatId = chat.id;
  const telegramUserId = String(from.id);
  const text = message?.text?.trim() ?? "";
  const command = commandName(text);
  const script = parseBotScript(input.script);
  const titleFa = input.titleFa?.trim() || "تحلیل‌گر هوشمند";
  const boundSlug = input.analyzerSlug?.trim() || null;
  const v = varsOf(titleFa);
  const lastMessageId = update.message?.message_id;
  const prior = await readSession(botId, telegramUserId);
  const idle = Boolean(prior?.updatedAt && Date.now() - prior.updatedAt.getTime() >= START_IDLE_MS);
  await patchSession(botId, telegramUserId, String(chatId), {});

  if (callback?.data === "retake" || callback?.data === "exams") {
    const action = callback.data === "retake" ? "restart" : "exams";
    const fallback: BotKey = {
      id: action,
      labelFa: action,
      action,
      command: action,
      descriptionFa: "",
      replyFa: "",
      inMenu: false,
      inKeyboard: false,
    };
    await runBotKey({
      token,
      botId,
      chatId,
      telegramUserId,
      script,
      titleFa,
      boundSlug,
      key: matchBotKey(script, "", action) ?? fallback,
      lastMessageId,
    });
    return;
  }

  const hit = matchBotKey(script, text, command);
  if (hit && (command || text === hit.labelFa || hit.action === "clear")) {
    await runBotKey({ token, botId, chatId, telegramUserId, script, titleFa, boundSlug, key: hit, lastMessageId });
    return;
  }

  if (idle && !callback) {
    const startKey =
      matchBotKey(script, "", "start") ??
      ({
        id: "start",
        labelFa: "شروع",
        action: "start",
        command: "start",
        descriptionFa: "",
        replyFa: "",
        inMenu: true,
        inKeyboard: true,
      } satisfies BotKey);
    await runBotKey({ token, botId, chatId, telegramUserId, script, titleFa, boundSlug, key: startKey, lastMessageId });
    return;
  }

  if (callback?.data === "policyok") {
    const accountId = await accountIdByTelegramUserId(telegramUserId);
    if (!accountId) {
      await promptPhone(token, botId, chatId, script, titleFa);
      return;
    }
    const now = new Date();
    const account = await readAccount(accountId);
    const named = Boolean(account?.givenName?.trim() && account?.familyName?.trim());
    await db
      .update(accounts)
      .set({
        policiesAcceptedAt: now,
        policiesVersion: privacyPolicyVersion(),
        onboardingCompletedAt: named ? (account?.onboardingCompletedAt ?? now) : null,
        updatedAt: now,
      })
      .where(eq(accounts.id, accountId));
    await afterAccount(token, botId, chatId, telegramUserId, accountId, script, titleFa, boundSlug);
    return;
  }

  if (callback?.data === "skipref") {
    const accountId = await accountIdByTelegramUserId(telegramUserId);
    await patchSession(botId, telegramUserId, String(chatId), { awaitingReferral: false, step: "pick" });
    if (accountId) await afterAccount(token, botId, chatId, telegramUserId, accountId, script, titleFa, boundSlug);
    else await promptExamList(token, botId, chatId, script, titleFa, boundSlug);
    return;
  }

  if (callback?.data === "skipdisc") {
    const session = await readSession(botId, telegramUserId);
    const accountId = await accountIdByTelegramUserId(telegramUserId);
    const slug = session?.analyzerSlug;
    if (!accountId || !slug) {
      await promptExamList(token, botId, chatId, script, titleFa, boundSlug);
      return;
    }
    await patchSession(botId, telegramUserId, String(chatId), { awaitingDiscount: false, step: "quiz" });
    const pack = await livePack(slug);
    if (pack) await continueQuiz(token, botId, chatId, accountId, pack, script, titleFa);
    return;
  }

  if (callback?.data === "packok") {
    const session = await readSession(botId, telegramUserId);
    const accountId = await accountIdByTelegramUserId(telegramUserId);
    const slug = session?.analyzerSlug;
    if (!accountId || !slug) {
      await promptExamList(token, botId, chatId, script, titleFa, boundSlug);
      return;
    }
    await liveConsentAttempt(accountId, slug);
    if (script.flow.askDiscount) {
      await patchSession(botId, telegramUserId, String(chatId), { step: "discount", awaitingDiscount: true });
      await say(token, botId, chatId, line(script, "discountPrompt", v), {
        inline_keyboard: [[{ text: script.texts.discountSkip.slice(0, 64), callback_data: "skipdisc" }]],
      });
      return;
    }
    await patchSession(botId, telegramUserId, String(chatId), { awaitingDiscount: false, step: "quiz" });
    const pack = await livePack(slug);
    if (pack) await continueQuiz(token, botId, chatId, accountId, pack, script, titleFa);
    return;
  }

  if (callback?.data?.startsWith("exam:")) {
    const slug = callback.data.slice(5);
    const accountId = await accountIdByTelegramUserId(telegramUserId);
    if (!accountId) {
      await promptPhone(token, botId, chatId, script, titleFa);
      return;
    }
    if (script.service !== "analyzers") {
      await afterAccount(token, botId, chatId, telegramUserId, accountId, script, titleFa, boundSlug);
      return;
    }
    await startPack(token, botId, chatId, telegramUserId, slug, script, titleFa, boundSlug);
    return;
  }

  if (callback?.data) {
    const session = await readSession(botId, telegramUserId);
    const slug = session?.analyzerSlug;
    const accountId = await accountIdByTelegramUserId(telegramUserId);
    if (!accountId || !slug) {
      const aid = await accountIdByTelegramUserId(telegramUserId);
      if (aid) await afterAccount(token, botId, chatId, telegramUserId, aid, script, titleFa, boundSlug);
      else await promptPhone(token, botId, chatId, script, titleFa);
      return;
    }
    const pack = await livePack(slug);
    if (!pack) return;
    const items = itemsOf(pack);
    const guideMatch = /^g:(\d+):([01])$/.exec(callback.data);
    if (guideMatch) {
      const index = Number(guideMatch[1]);
      const open = guideMatch[2] === "0";
      const item = items[index];
      if (!item) {
        await say(token, botId, chatId, line(script, "staleButton", v));
        return;
      }
      const text = questionMessage(item, pack, index, open);
      const markup = questionMarkup(index, item, script, open);
      const messageId = callback.message?.message_id;
      try {
        if (messageId == null) throw new Error("no_message");
        await telegramEditMessage(token, { chatId, messageId, text, replyMarkup: markup });
      } catch {
        await say(token, botId, chatId, text, markup);
      }
      return;
    }
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
      await say(token, botId, chatId, line(script, "staleButton", v));
      return;
    }
    const saved = await liveSaveAnswer(accountId, pack.slug, item.id, value);
    if (!saved.ok) {
      if (saved.error === "already_submitted") {
        const attempt = await liveReadAttempt(accountId, pack.slug);
        if (attempt) await say(token, botId, chatId, doneText(pack, attempt));
        return;
      }
      await say(token, botId, chatId, line(script, "saveFailed", v));
      return;
    }
    await continueQuiz(token, botId, chatId, accountId, pack, script, titleFa);
    return;
  }

  if (!message) return;
  const session = await readSession(botId, telegramUserId);

  if (message.contact) {
    if (message.contact.user_id != null && message.contact.user_id !== from.id) {
      await say(token, botId, chatId, line(script, "onlyOwnPhone", v));
      return;
    }
    let phone: string;
    try {
      phone = normalizePhone(message.contact.phone_number);
    } catch (error) {
      if (error instanceof InvalidPhoneError) {
        await say(token, botId, chatId, line(script, "iranPhoneOnly", v));
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
      await say(token, botId, chatId, linked.error);
      return;
    }
    await patchSession(botId, telegramUserId, String(chatId), {
      viaContact: true,
      pendingPhone: null,
      step: "policy",
    });
    await say(token, botId, chatId, line(script, "phoneSaved", v), keysMarkup(script));
    await afterAccount(token, botId, chatId, telegramUserId, linked.accountId, script, titleFa, boundSlug);
    return;
  }

  if (session?.step === "otp" && session.pendingPhone && text) {
    const ok = await consumeLoginOtp(session.pendingPhone, text);
    if (!ok) {
      await say(token, botId, chatId, line(script, "otpBad", v));
      return;
    }
    const linked = await linkTelegramContact({
      telegramUserId,
      phone: session.pendingPhone,
      givenName: from.first_name || null,
      familyName: from.last_name || null,
    });
    if (!linked.ok) {
      await say(token, botId, chatId, linked.error);
      return;
    }
    await patchSession(botId, telegramUserId, String(chatId), { pendingPhone: null, viaContact: false, step: "policy" });
    await afterAccount(token, botId, chatId, telegramUserId, linked.accountId, script, titleFa, boundSlug);
    return;
  }

  if ((session?.step === "phone" || !session || session.step === "start") && text && !command) {
    if (!script.flow.allowTypedPhone) {
      await promptPhone(token, botId, chatId, script, titleFa);
      return;
    }
    try {
      const phone = normalizePhone(text);
      const sent = await issueLoginOtp(phone);
      if (!sent.ok) {
        await say(
          token,
          botId,
          chatId,
          line(script, sent.error === "rate_limit" ? "rateLimit" : "smsFailed", v),
        );
        return;
      }
      await patchSession(botId, telegramUserId, String(chatId), { step: "otp", pendingPhone: phone, viaContact: false });
      await say(token, botId, chatId, line(script, "otpPrompt", v));
      return;
    } catch (error) {
      if (!(error instanceof InvalidPhoneError)) throw error;
    }
  }

  const accountId = await accountIdByTelegramUserId(telegramUserId);

  if (session?.step === "given" && accountId && text) {
    const givenName = normalizePersonName(text);
    if (!givenName) {
      await say(token, botId, chatId, line(script, "givenBad", v));
      return;
    }
    const account = await readAccount(accountId);
    await db
      .update(accounts)
      .set({
        givenName,
        displayName: displayNameFromParts(givenName, account?.familyName ?? null),
        updatedAt: new Date(),
      })
      .where(eq(accounts.id, accountId));
    await afterAccount(token, botId, chatId, telegramUserId, accountId, script, titleFa, boundSlug);
    return;
  }

  if (session?.step === "family" && accountId && text) {
    const familyName = normalizePersonName(text);
    if (!familyName) {
      await say(token, botId, chatId, line(script, "familyBad", v));
      return;
    }
    const account = await readAccount(accountId);
    const givenName = account?.givenName ?? null;
    const named = Boolean(givenName);
    const now = new Date();
    await db
      .update(accounts)
      .set({
        familyName,
        displayName: displayNameFromParts(givenName, familyName),
        onboardingCompletedAt: named ? (account?.onboardingCompletedAt ?? now) : null,
        updatedAt: now,
      })
      .where(eq(accounts.id, accountId));
    await afterAccount(token, botId, chatId, telegramUserId, accountId, script, titleFa, boundSlug);
    return;
  }

  if (session?.awaitingReferral && accountId && text) {
    if (isSkipText(text, script.texts.referralSkip)) {
      await patchSession(botId, telegramUserId, String(chatId), { awaitingReferral: false, step: "pick" });
      await afterAccount(token, botId, chatId, telegramUserId, accountId, script, titleFa, boundSlug);
      return;
    }
    const set = await setAccountReferrer(accountId, text);
    if (!set.ok && set.error !== "invalid_referral") {
      await say(token, botId, chatId, line(script, "referralBad", v));
      return;
    }
    if (!set.ok) {
      await say(token, botId, chatId, line(script, "referralBad", v));
      return;
    }
    await patchSession(botId, telegramUserId, String(chatId), { awaitingReferral: false, step: "pick" });
    await afterAccount(token, botId, chatId, telegramUserId, accountId, script, titleFa, boundSlug);
    return;
  }

  if (session?.awaitingDiscount && accountId && session.analyzerSlug && text) {
    const pack = await livePack(session.analyzerSlug);
    if (!pack) {
      await promptExamList(token, botId, chatId, script, titleFa, boundSlug);
      return;
    }
    if (isSkipText(text, script.texts.discountSkip)) {
      await patchSession(botId, telegramUserId, String(chatId), { awaitingDiscount: false, step: "quiz" });
      await continueQuiz(token, botId, chatId, accountId, pack, script, titleFa);
      return;
    }
    const applied = await applyAttemptCodes({ slug: pack.slug, accountId, discountCode: text });
    if (!applied.ok) {
      await say(token, botId, chatId, line(script, "discountBad", v));
      return;
    }
    await patchSession(botId, telegramUserId, String(chatId), { awaitingDiscount: false, step: "quiz" });
    await continueQuiz(token, botId, chatId, accountId, pack, script, titleFa);
    return;
  }

  if (!accountId) {
    await patchSession(botId, telegramUserId, String(chatId), { step: "phone" });
    await promptPhone(token, botId, chatId, script, titleFa);
    return;
  }

  if (session?.step === "quiz" && session.analyzerSlug && text) {
    const pack = await livePack(session.analyzerSlug);
    if (!pack) {
      await promptExamList(token, botId, chatId, script, titleFa, boundSlug);
      return;
    }
    const attempt = await liveReadAttempt(accountId, pack.slug);
    if (!attempt?.consentAt) {
      await startPack(token, botId, chatId, telegramUserId, pack.slug, script, titleFa, boundSlug);
      return;
    }
    if (attempt.status === "submitted") {
      await say(token, botId, chatId, doneText(pack, attempt), keysMarkup(script));
      return;
    }
    const items = itemsOf(pack);
    const index = firstUnansweredIndex(pack, attempt.answers);
    const item = items[index];
    if (!item) {
      await continueQuiz(token, botId, chatId, accountId, pack, script, titleFa);
      return;
    }
    if (item.kind !== "text") {
      await promptQuestion(token, botId, chatId, pack, attempt, script);
      return;
    }
    const saved = await liveSaveAnswer(accountId, pack.slug, item.id, text);
    if (!saved.ok) {
      await say(
        token,
        botId,
        chatId,
        saved.error === "invalid_answer"
          ? line(script, "textTooLong", { ...v, max: faNum(item.maxLength) })
          : line(script, "saveFailed", v),
      );
      return;
    }
    await continueQuiz(token, botId, chatId, accountId, pack, script, titleFa);
    return;
  }

  if (script.service !== "analyzers" && session?.step === "idle") {
    if (text) await say(token, botId, chatId, line(script, "idleReply", v));
    return;
  }

  await afterAccount(token, botId, chatId, telegramUserId, accountId, script, titleFa, boundSlug);
}
