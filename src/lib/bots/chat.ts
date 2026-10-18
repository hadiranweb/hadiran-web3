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
import { needsPasswordSetup } from "@/lib/auth/password";
import { issuePasswordSetupUrl } from "@/lib/auth/password-setup";
import { InvalidPhoneError, normalizePhone } from "@/lib/auth/phone";
import { displayNameFromParts, normalizePersonName } from "@/lib/auth/profile";
import { referredByPublicCode, setAccountReferrer } from "@/lib/auth/referral";
import { ensureBotsSchema } from "@/lib/auth/schema-guard";
import { privacyPolicyVersion } from "@/lib/privacy/version";
import { accountIdByTelegramUserId, linkTelegramContact } from "@/lib/bots/identity";
import { markBotLastError } from "@/lib/bots/store";
import { botConsent } from "@/lib/bots/copy";
import { botVars, interpolateBotText, line, matchBotKey, parseBotScript, type BotKey, type BotScript } from "@/lib/bots/script";
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

function phoneKeyboard(script: BotScript) {
  return {
    keyboard: [[{ text: script.texts.phoneButton.slice(0, 64), request_contact: true }]],
    resize_keyboard: true,
    one_time_keyboard: true,
  };
}

function keysMarkup(script: BotScript) {
  const buttons = script.keys.filter((key) => key.inKeyboard && key.labelFa);
  if (!buttons.length) return undefined;
  const rows: { text: string }[][] = [];
  for (let i = 0; i < buttons.length; i += 2) {
    rows.push(buttons.slice(i, i + 2).map((key) => ({ text: key.labelFa.slice(0, 64) })));
  }
  return { keyboard: rows, resize_keyboard: true, is_persistent: true };
}

function rangeKeyboard(itemIndex: number) {
  const btn = (value: number) => ({ text: faNum(value), callback_data: `q:${itemIndex}:${value}` });
  return { inline_keyboard: [[10, 9, 8, 7, 6].map(btn), [5, 4, 3, 2, 1, 0].map(btn)] };
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
  const lines = [section?.titleFa ?? pack.nameFa, `سؤال ${faNum(index + 1)} از ${faNum(all.length)}`, ""];
  if (section?.introFa && sectionPos === 1) lines.push(section.introFa, "");
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
    inline_keyboard: open.map((item) => [{ text: item.nameFa.slice(0, 64), callback_data: `exam:${item.slug}` }]),
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
  if (script.flow.sendPasswordLink && needsPasswordSetup({ phone: account.phone, passwordHash: account.passwordHash })) {
    if (!session?.passwordLinkSentAt) {
      const url = await issuePasswordSetupUrl(accountId);
      await say(token, botId, chatId, line(script, "passwordLink", { ...v, link: url }), { remove_keyboard: true });
      await patchSession(botId, telegramUserId, String(chatId), { passwordLinkSentAt: new Date() });
    }
  }
  if (script.flow.askPolicy && !flags.policiesAccepted) {
    await patchSession(botId, telegramUserId, String(chatId), { step: "policy" });
    await say(token, botId, chatId, line(script, "policy", v), {
      inline_keyboard: [[{ text: script.texts.policyButton.slice(0, 64), callback_data: "policyok" }]],
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
    inline_keyboard: [[{ text: pack.consent.acceptLabelFa, callback_data: "packok" }]],
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
}): Promise<void> {
  const { token, botId, chatId, telegramUserId, script, titleFa, boundSlug, key } = input;
  const v = varsOf(titleFa);
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
    });
    return;
  }

  const hit = matchBotKey(script, text, command);
  if (hit && (command || text === hit.labelFa)) {
    await runBotKey({ token, botId, chatId, telegramUserId, script, titleFa, boundSlug, key: hit });
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
