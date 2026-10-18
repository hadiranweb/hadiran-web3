/** قالب گفتگوی ربات سرویس تحلیل‌گر. بدون eval. */

import { privacySummary, privacyUseTerms } from "@/lib/privacy/content";

export const BOT_SERVICES = ["analyzers"] as const;
export type BotService = (typeof BOT_SERVICES)[number];

export type BotFlow = {
  allowTypedPhone: boolean;
  askPolicy: boolean;
  askNames: boolean;
  askReferral: boolean;
  askDiscount: boolean;
  sendPasswordLink: boolean;
};

export type BotTexts = {
  welcome: string;
  help: string;
  phonePrompt: string;
  phoneButton: string;
  phoneSaved: string;
  onlyOwnPhone: string;
  iranPhoneOnly: string;
  otpPrompt: string;
  otpBad: string;
  smsFailed: string;
  rateLimit: string;
  policy: string;
  policyButton: string;
  givenPrompt: string;
  familyPrompt: string;
  givenBad: string;
  familyBad: string;
  referralPrompt: string;
  referralSkip: string;
  referralBad: string;
  examPick: string;
  noExams: string;
  examClosed: string;
  packConsentFailed: string;
  examMissing: string;
  discountPrompt: string;
  discountSkip: string;
  discountBad: string;
  passwordLink: string;
  staleButton: string;
  saveFailed: string;
  textTooLong: string;
  startDescription: string;
  helpDescription: string;
};

export type BotScript = {
  service: BotService;
  flow: BotFlow;
  texts: BotTexts;
};

const POLICY_DEFAULT = [privacySummary, "", ...privacyUseTerms, "", "جزئیات: {privacy}"].join("\n");

export const DEFAULT_BOT_FLOW: BotFlow = {
  allowTypedPhone: true,
  askPolicy: true,
  askNames: true,
  askReferral: true,
  askDiscount: true,
  sendPasswordLink: true,
};

export const DEFAULT_BOT_TEXTS: BotTexts = {
  welcome:
    "هادیران — {service}\n\nمن ربات آزمون‌ها هستم؛ ورود مرورگر با تلگرام نیست.\n\nمسیر:\n۱. شمارهٔ خودتان\n۲. پذیرش سیاست\n۳. نام و نام‌خانوادگی\n۴. انتخاب آزمون\n\nرمز سایت را در چت ننویسید؛ لینک یک‌بارمصرف می‌آید.",
  help: "راهنما — {service}\n\n/start شروع یا ادامه\n/help همین راهنما\n\nشماره با دکمه، یا تایپ (آن‌وقت کد پیامک).\nقبول سیاست اجباری است.\nکد معرف هشت‌رقمی اختیاری است.\nکد تخفیف بعد از انتخاب آزمون پرسیده می‌شود.\nورود سایت با همان شماره و رمز لینک است، نه با این چت.",
  phonePrompt: "شمارهٔ همراه خودتان را با دکمه بفرستید. اگر دکمه نیست، همان شماره را بنویسید تا کد پیامک بیاید.",
  phoneButton: "ارسال شمارهٔ همراه",
  phoneSaved: "شماره ثبت شد.",
  onlyOwnPhone: "فقط شمارهٔ خودتان را بفرستید.",
  iranPhoneOnly: "فقط موبایل ایران پذیرفته می‌شود.",
  otpPrompt: "کد شش‌رقمی پیامک را همین‌جا بفرستید.",
  otpBad: "کد درست نیست. دوباره بفرستید یا /start.",
  smsFailed: "پیامک ارسال نشد. دکمهٔ شماره را بزنید.",
  rateLimit: "کمی صبر کنید و دوباره بفرستید.",
  policy: POLICY_DEFAULT,
  policyButton: "قبول می‌کنم",
  givenPrompt: "نام کوچک را بنویسید.",
  familyPrompt: "نام‌خانوادگی را بنویسید.",
  givenBad: "نام را کوتاه و بدون نویسهٔ کنترل بنویسید.",
  familyBad: "نام‌خانوادگی را کوتاه بنویسید.",
  referralPrompt: "اگر کد معرف دارید بفرستید (۸ رقم). اگر ندارید «رد».",
  referralSkip: "رد کردن",
  referralBad: "این کد معرف پذیرفته نشد. دوباره بفرستید یا «رد».",
  examPick: "آزمون را انتخاب کنید:",
  noExams: "الان آزمون بازی نیست.",
  examClosed: "این آزمون باز نیست.",
  packConsentFailed: "رضایت آزمون ثبت نشد.",
  examMissing: "آزمون در دسترس نیست.",
  discountPrompt: "اگر کد تخفیف دارید بفرستید. اگر ندارید «رد».",
  discountSkip: "رد کردن",
  discountBad: "این کد تخفیف پذیرفته نشد. دوباره بفرستید یا «رد».",
  passwordLink: "برای ورود بعدی به سایت، رمز را در این لینک بگذارید (در چت ننویسید):\n{link}",
  staleButton: "این دکمه دیگر معتبر نیست. /start بزنید.",
  saveFailed: "این پاسخ ذخیره نشد. دوباره تلاش کنید.",
  textTooLong: "متن را کوتاه‌تر بنویسید (تا {max} نویسه).",
  startDescription: "شروع یا ادامه",
  helpDescription: "راهنمای ربات",
};

export const BOT_TEXT_FIELDS: { id: keyof BotTexts; labelFa: string; hintFa: string }[] = [
  { id: "welcome", labelFa: "خوشامد /start", hintFa: "{service}" },
  { id: "help", labelFa: "راهنما /help", hintFa: "{service}" },
  { id: "phonePrompt", labelFa: "درخواست شماره", hintFa: "" },
  { id: "phoneButton", labelFa: "دکمهٔ شماره", hintFa: "" },
  { id: "phoneSaved", labelFa: "بعد از ثبت شماره", hintFa: "" },
  { id: "onlyOwnPhone", labelFa: "شمارهٔ دیگران", hintFa: "" },
  { id: "iranPhoneOnly", labelFa: "شمارهٔ غیر ایران", hintFa: "" },
  { id: "otpPrompt", labelFa: "درخواست کد پیامک", hintFa: "" },
  { id: "otpBad", labelFa: "کد نادرست", hintFa: "" },
  { id: "smsFailed", labelFa: "شکست پیامک", hintFa: "" },
  { id: "rateLimit", labelFa: "محدودیت ارسال کد", hintFa: "" },
  { id: "policy", labelFa: "متن سیاست", hintFa: "{privacy} {service}" },
  { id: "policyButton", labelFa: "دکمهٔ قبول سیاست", hintFa: "" },
  { id: "givenPrompt", labelFa: "درخواست نام", hintFa: "" },
  { id: "familyPrompt", labelFa: "درخواست نام‌خانوادگی", hintFa: "" },
  { id: "givenBad", labelFa: "نام نامعتبر", hintFa: "" },
  { id: "familyBad", labelFa: "نام‌خانوادگی نامعتبر", hintFa: "" },
  { id: "referralPrompt", labelFa: "درخواست معرف", hintFa: "" },
  { id: "referralSkip", labelFa: "دکمهٔ رد معرف", hintFa: "" },
  { id: "referralBad", labelFa: "معرف نامعتبر", hintFa: "" },
  { id: "examPick", labelFa: "انتخاب آزمون", hintFa: "{service}" },
  { id: "noExams", labelFa: "هیچ آزمون بازی نیست", hintFa: "" },
  { id: "examClosed", labelFa: "آزمون بسته", hintFa: "{exam}" },
  { id: "packConsentFailed", labelFa: "رضایت آزمون ثبت نشد", hintFa: "{exam}" },
  { id: "examMissing", labelFa: "آزمون در دسترس نیست", hintFa: "" },
  { id: "discountPrompt", labelFa: "درخواست تخفیف", hintFa: "{exam}" },
  { id: "discountSkip", labelFa: "دکمهٔ رد تخفیف", hintFa: "" },
  { id: "discountBad", labelFa: "تخفیف نامعتبر", hintFa: "" },
  { id: "passwordLink", labelFa: "لینک تعیین رمز", hintFa: "{link}" },
  { id: "staleButton", labelFa: "دکمهٔ منقضی", hintFa: "" },
  { id: "saveFailed", labelFa: "ذخیرهٔ پاسخ نشد", hintFa: "" },
  { id: "textTooLong", labelFa: "متن سؤال باز خیلی بلند", hintFa: "{max}" },
  { id: "startDescription", labelFa: "شرح دستور /start در منو", hintFa: "" },
  { id: "helpDescription", labelFa: "شرح دستور /help در منو", hintFa: "" },
];

export const BOT_FLOW_FIELDS: { id: keyof BotFlow; labelFa: string }[] = [
  { id: "allowTypedPhone", labelFa: "تایپ شماره و OTP (اگر خام باشد فقط دکمه)" },
  { id: "askPolicy", labelFa: "پرسیدن قبول سیاست در ربات" },
  { id: "askNames", labelFa: "پرسیدن نام و نام‌خانوادگی" },
  { id: "askReferral", labelFa: "پرسیدن کد معرف" },
  { id: "askDiscount", labelFa: "پرسیدن کد تخفیف بعد از انتخاب آزمون" },
  { id: "sendPasswordLink", labelFa: "فرستادن لینک تعیین رمز سایت" },
];

function asMultiline(value: unknown, max: number, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const text = value.replace(/\r\n/g, "\n").replace(/[^\S\n]+/g, " ").trim();
  if (!text || text.length > max) return fallback;
  return text;
}

export function interpolateBotText(template: string, vars: Record<string, string>): string {
  return template.replace(/\{([^{}\n]+)\}/g, (_, raw: string) => {
    const key = raw.trim();
    return Object.prototype.hasOwnProperty.call(vars, key) ? vars[key]! : "";
  });
}

export function parseBotScript(raw: unknown): BotScript {
  const row = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const flowRaw = row.flow && typeof row.flow === "object" && !Array.isArray(row.flow) ? (row.flow as Record<string, unknown>) : {};
  const textRaw = row.texts && typeof row.texts === "object" && !Array.isArray(row.texts) ? (row.texts as Record<string, unknown>) : row;
  const flow: BotFlow = { ...DEFAULT_BOT_FLOW };
  for (const key of Object.keys(DEFAULT_BOT_FLOW) as (keyof BotFlow)[]) {
    if (flowRaw[key] === true) flow[key] = true;
    if (flowRaw[key] === false) flow[key] = false;
  }
  const texts: BotTexts = { ...DEFAULT_BOT_TEXTS };
  for (const key of Object.keys(DEFAULT_BOT_TEXTS) as (keyof BotTexts)[]) {
    texts[key] = asMultiline(textRaw[key], key === "policy" || key === "welcome" || key === "help" ? 3500 : 500, DEFAULT_BOT_TEXTS[key]);
  }
  return {
    service: "analyzers",
    flow,
    texts,
  };
}

export function botVars(input: {
  service?: string;
  exam?: string;
  link?: string;
  privacy?: string;
  max?: string;
}): Record<string, string> {
  return {
    service: input.service ?? "تحلیل‌گر هوشمند",
    exam: input.exam ?? "",
    link: input.link ?? "",
    privacy: input.privacy ?? "/privacy",
    max: input.max ?? "",
  };
}

export function line(script: BotScript, key: keyof BotTexts, vars?: Record<string, string>): string {
  return interpolateBotText(script.texts[key], vars ?? botVars({ service: "تحلیل‌گر هوشمند" })).slice(0, 4096);
}
