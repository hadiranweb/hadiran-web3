/** قالب گفتگوی هر ربات. سرویس روی خود ربات است، نه روی یک آزمون. بدون eval. */

import { privacySummary, privacyUseTerms } from "@/lib/privacy/content";

export const BOT_SERVICES = ["analyzers", "custom"] as const;
export type BotService = (typeof BOT_SERVICES)[number];

export const BOT_SERVICE_OPTIONS: { id: BotService; labelFa: string; hintFa: string }[] = [
  { id: "analyzers", labelFa: "آزمون‌ها", hintFa: "فهرست آزمون‌های باز. به عارضه‌یابی یا هیچ آزمون دیگری قفل نیست." },
  { id: "custom", labelFa: "گفتگوی آزاد", hintFa: "خوشامد و ثبت هویت؛ بدون آزمون." },
];

export function parseBotService(raw: unknown): BotService {
  return raw === "custom" ? "custom" : "analyzers";
}

export function botServiceLabel(id: BotService): string {
  return BOT_SERVICE_OPTIONS.find((item) => item.id === id)?.labelFa ?? id;
}

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
  ready: string;
  idleReply: string;
  questionGuide: string;
  questionGuideClose: string;
  startDescription: string;
  helpDescription: string;
};

export const BOT_KEY_ACTIONS = ["start", "help", "exams", "restart", "clear", "reply"] as const;
export type BotKeyAction = (typeof BOT_KEY_ACTIONS)[number];

export const BOT_BUTTON_STYLES = ["", "primary", "success", "danger"] as const;
export type BotButtonStyle = (typeof BOT_BUTTON_STYLES)[number];

export const BOT_BUTTON_STYLE_OPTIONS: { id: BotButtonStyle | "auto"; labelFa: string }[] = [
  { id: "auto", labelFa: "پیش‌فرض کار" },
  { id: "", labelFa: "بدون رنگ تلگرام" },
  { id: "primary", labelFa: "آبی (اصلی)" },
  { id: "success", labelFa: "سبز (موفق)" },
  { id: "danger", labelFa: "قرمز (خطر)" },
];

export type BotKey = {
  id: string;
  labelFa: string;
  action: BotKeyAction;
  command: string;
  descriptionFa: string;
  replyFa: string;
  inMenu: boolean;
  inKeyboard: boolean;
  /** اگر نباشد، رنگ از روی کار کلید است. */
  style?: BotButtonStyle | "auto";
};

export type BotChrome = {
  policyButtonStyle: BotButtonStyle;
  examPickStyle: BotButtonStyle;
  packAcceptStyle: BotButtonStyle;
  referralSkipStyle: BotButtonStyle;
  discountSkipStyle: BotButtonStyle;
  questionSelectedStyle: BotButtonStyle;
  questionPrevStyle: BotButtonStyle;
};

export const DEFAULT_BOT_CHROME: BotChrome = {
  policyButtonStyle: "success",
  examPickStyle: "primary",
  packAcceptStyle: "success",
  referralSkipStyle: "",
  discountSkipStyle: "",
  /** تلگرام زرد ندارد؛ انتخاب مقیاس فقط سبز success است. */
  questionSelectedStyle: "success",
  questionPrevStyle: "primary",
};

export const BOT_CHROME_FIELDS: { id: keyof BotChrome; labelFa: string; services?: BotService[] }[] = [
  { id: "policyButtonStyle", labelFa: "رنگ دکمهٔ قبول سیاست" },
  { id: "referralSkipStyle", labelFa: "رنگ دکمهٔ رد معرف" },
  { id: "examPickStyle", labelFa: "رنگ دکمهٔ هر آزمون", services: ["analyzers"] },
  { id: "packAcceptStyle", labelFa: "رنگ دکمهٔ رضایت آزمون", services: ["analyzers"] },
  { id: "discountSkipStyle", labelFa: "رنگ دکمهٔ رد تخفیف", services: ["analyzers"] },
  { id: "questionSelectedStyle", labelFa: "رنگ گزینهٔ انتخاب‌شدهٔ مقیاس", services: ["analyzers"] },
  { id: "questionPrevStyle", labelFa: "رنگ دکمهٔ سؤال قبل (تلگرام زرد ندارد)", services: ["analyzers"] },
];

export const BOT_KEY_ACTION_OPTIONS: { id: BotKeyAction; labelFa: string }[] = [
  { id: "start", labelFa: "شروع گفتگو" },
  { id: "help", labelFa: "راهنما" },
  { id: "exams", labelFa: "فهرست آزمون‌ها" },
  { id: "restart", labelFa: "شروع مجدد آزمون جاری" },
  { id: "clear", labelFa: "پاک کردن تاریخچهٔ همین چت" },
  { id: "reply", labelFa: "ارسال متن ثابت" },
];

export const DEFAULT_ANALYZER_KEYS: BotKey[] = [
  {
    id: "start",
    labelFa: "شروع",
    action: "start",
    command: "start",
    descriptionFa: "شروع یا ادامه",
    replyFa: "",
    inMenu: true,
    inKeyboard: true,
  },
  {
    id: "help",
    labelFa: "راهنما",
    action: "help",
    command: "help",
    descriptionFa: "راهنمای ربات",
    replyFa: "",
    inMenu: true,
    inKeyboard: true,
  },
  {
    id: "exams",
    labelFa: "آزمون‌ها",
    action: "exams",
    command: "exams",
    descriptionFa: "فهرست آزمون‌ها",
    replyFa: "",
    inMenu: true,
    inKeyboard: true,
  },
  {
    id: "restart",
    labelFa: "شروع مجدد",
    action: "restart",
    command: "restart",
    descriptionFa: "نوبت تازه همین آزمون",
    replyFa: "",
    inMenu: true,
    inKeyboard: true,
  },
  {
    id: "clear",
    labelFa: "پاک کردن تاریخچه",
    action: "clear",
    command: "clear",
    descriptionFa: "فقط همین صفحهٔ چت را تمیز می‌کند",
    replyFa: "",
    inMenu: true,
    inKeyboard: true,
  },
];

export const DEFAULT_CUSTOM_KEYS: BotKey[] = DEFAULT_ANALYZER_KEYS.filter(
  (key) => key.action === "start" || key.action === "help" || key.action === "clear",
);

export type BotScript = {
  service: BotService;
  flow: BotFlow;
  texts: BotTexts;
  keys: BotKey[];
  chrome: BotChrome;
};

const POLICY_DEFAULT = [privacySummary, "", ...privacyUseTerms, "", "جزئیات: {privacy}"].join("\n");

export const DEFAULT_BOT_FLOW: BotFlow = {
  allowTypedPhone: true,
  askPolicy: true,
  askNames: true,
  askReferral: true,
  askDiscount: true,
  sendPasswordLink: false,
};

export const DEFAULT_BOT_TEXTS: BotTexts = {
  welcome:
    "هادیران — {service}\n\nمن ربات آزمون‌ها هستم؛ ورود مرورگر با تلگرام نیست.\n\nمسیر:\n۱. شمارهٔ خودتان\n۲. پذیرش سیاست\n۳. نام و نام‌خانوادگی\n۴. انتخاب آزمون",
  help: "راهنما — {service}\n\n/start شروع یا ادامه\n/help همین راهنما\n/clear پاک کردن همین صفحهٔ چت\n\nشماره با دکمه، یا تایپ (آن‌وقت کد پیامک).\nقبول سیاست اجباری است.\nکد معرف هشت‌رقمی اختیاری است.\nکد تخفیف بعد از انتخاب آزمون پرسیده می‌شود.\nرمز ثابت در این چت خواسته نمی‌شود.",
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
  ready: "ثبت شد.",
  idleReply: "اگر کاری دارید /start بزنید.",
  questionGuide: "راهنمای این سوال",
  questionGuideClose: "بستن راهنما",
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
  { id: "staleButton", labelFa: "دکمهٔ منقضی", hintFa: "" },
  { id: "saveFailed", labelFa: "ذخیرهٔ پاسخ نشد", hintFa: "" },
  { id: "textTooLong", labelFa: "متن سؤال باز خیلی بلند", hintFa: "{max}" },
  { id: "ready", labelFa: "بعد از ثبت هویت", hintFa: "{service}" },
  { id: "idleReply", labelFa: "پاسخ وقتی کار دیگری نیست", hintFa: "" },
  { id: "questionGuide", labelFa: "عنوان راهنمای سؤال (زیر گزینه‌ها)", hintFa: "" },
  { id: "startDescription", labelFa: "شرح دستور /start در منو", hintFa: "" },
  { id: "helpDescription", labelFa: "شرح دستور /help در منو", hintFa: "" },
];

export const BOT_FLOW_FIELDS: { id: keyof BotFlow; labelFa: string; services?: BotService[] }[] = [
  { id: "allowTypedPhone", labelFa: "تایپ شماره و OTP (اگر خام باشد فقط دکمه)" },
  { id: "askPolicy", labelFa: "پرسیدن قبول سیاست در ربات" },
  { id: "askNames", labelFa: "پرسیدن نام و نام‌خانوادگی" },
  { id: "askReferral", labelFa: "پرسیدن کد معرف" },
  { id: "askDiscount", labelFa: "پرسیدن کد تخفیف بعد از انتخاب آزمون", services: ["analyzers"] },
];

export const ANALYZER_TEXT_IDS: (keyof BotTexts)[] = [
  "examPick",
  "noExams",
  "examClosed",
  "packConsentFailed",
  "examMissing",
  "discountPrompt",
  "discountSkip",
  "discountBad",
  "textTooLong",
  "questionGuide",
];

const CUSTOM_WELCOME =
  "هادیران — {service}\n\nورود سایت با تلگرام نیست.\nشمارهٔ خودتان را بفرستید. رمز ثابت در این چت خواسته نمی‌شود.";
const CUSTOM_HELP = "راهنما — {service}\n\n/start شروع یا ادامه\n/help همین راهنما\n/clear پاک کردن همین صفحهٔ چت";
const CUSTOM_READY = "ثبت شد. اگر پیامی دارید همین‌جا بنویسید.";

function asCommand(value: unknown): string {
  if (typeof value !== "string") return "";
  return value
    .trim()
    .toLowerCase()
    .replace(/^\/+/, "")
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 32);
}

function parseButtonStyle(raw: unknown, fallback: BotButtonStyle): BotButtonStyle {
  if (raw === "" || raw === "primary" || raw === "success" || raw === "danger") return raw;
  return fallback;
}

function parseKeyStyle(raw: unknown): BotKey["style"] {
  if (raw === "auto" || raw === undefined || raw === null) return "auto";
  if (raw === "" || raw === "primary" || raw === "success" || raw === "danger") return raw;
  return "auto";
}

function parseBotKey(raw: unknown, fallbackId: string): BotKey | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const row = raw as Record<string, unknown>;
  const labelFa = asMultiline(row.labelFa, 64, "");
  if (!labelFa) return null;
  const action = BOT_KEY_ACTIONS.includes(row.action as BotKeyAction) ? (row.action as BotKeyAction) : "reply";
  const id = asCommand(row.id) || asCommand(row.command) || fallbackId;
  return {
    id: id || fallbackId,
    labelFa,
    action,
    command: asCommand(row.command),
    descriptionFa: asMultiline(row.descriptionFa, 256, labelFa),
    replyFa: asMultiline(row.replyFa, 500, ""),
    inMenu: row.inMenu !== false,
    inKeyboard: row.inKeyboard !== false,
    style: parseKeyStyle(row.style),
  };
}

export function telegramCommandsOf(script: BotScript): { command: string; description: string }[] {
  const seen = new Set<string>();
  const out: { command: string; description: string }[] = [];
  for (const key of script.keys) {
    if (!key.inMenu || !key.command || seen.has(key.command)) continue;
    seen.add(key.command);
    const description = (key.descriptionFa || key.labelFa).slice(0, 256);
    out.push({ command: key.command, description: description.length >= 3 ? description : `${description}…` });
  }
  if (!out.length) {
    out.push({ command: "start", description: "شروع یا ادامه" }, { command: "help", description: "راهنمای ربات" });
  }
  return out.slice(0, 100);
}

export function matchBotKey(script: BotScript, text: string, command: string | null): BotKey | null {
  if (command) {
    const byCommand = script.keys.find((key) => key.command && key.command === command);
    if (byCommand) return byCommand;
  }
  const label = text.replace(/\s+/g, " ").trim();
  if (!label) return null;
  const byLabel = script.keys.find((key) => key.labelFa === label);
  if (byLabel) return byLabel;
  if (label === "پاک کردن تاریخچه" || command === "clear") {
    return (
      script.keys.find((key) => key.action === "clear") ?? {
        id: "clear",
        labelFa: "پاک کردن تاریخچه",
        action: "clear",
        command: "clear",
        descriptionFa: "فقط همین صفحهٔ چت را تمیز می‌کند",
        replyFa: "",
        inMenu: true,
        inKeyboard: true,
      }
    );
  }
  return null;
}

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

export function defaultScript(service: BotService = "analyzers"): BotScript {
  const texts: BotTexts = { ...DEFAULT_BOT_TEXTS };
  const flow: BotFlow = { ...DEFAULT_BOT_FLOW };
  if (service === "custom") {
    texts.welcome = CUSTOM_WELCOME;
    texts.help = CUSTOM_HELP;
    texts.ready = CUSTOM_READY;
    flow.askDiscount = false;
  }
  return {
    service,
    flow,
    texts,
    chrome: { ...DEFAULT_BOT_CHROME },
    keys: service === "custom" ? DEFAULT_CUSTOM_KEYS.map((key) => ({ ...key })) : DEFAULT_ANALYZER_KEYS.map((key) => ({ ...key })),
  };
}

export function parseBotScript(raw: unknown): BotScript {
  const row = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const service = parseBotService(row.service);
  const base = defaultScript(service);
  const flowRaw = row.flow && typeof row.flow === "object" && !Array.isArray(row.flow) ? (row.flow as Record<string, unknown>) : {};
  const textRaw = row.texts && typeof row.texts === "object" && !Array.isArray(row.texts) ? (row.texts as Record<string, unknown>) : row;
  const flow: BotFlow = { ...base.flow };
  for (const key of Object.keys(DEFAULT_BOT_FLOW) as (keyof BotFlow)[]) {
    if (flowRaw[key] === true) flow[key] = true;
    if (flowRaw[key] === false) flow[key] = false;
  }
  if (service !== "analyzers") flow.askDiscount = false;
  flow.sendPasswordLink = false;
  const texts: BotTexts = { ...base.texts };
  for (const key of Object.keys(DEFAULT_BOT_TEXTS) as (keyof BotTexts)[]) {
    texts[key] = asMultiline(textRaw[key], key === "policy" || key === "welcome" || key === "help" ? 3500 : 500, base.texts[key]);
  }
  const parsedKeys = Array.isArray(row.keys)
    ? row.keys
        .map((item, index) => parseBotKey(item, `key${index + 1}`))
        .filter((item): item is BotKey => Boolean(item))
        .slice(0, 20)
    : [];
  const keys = parsedKeys.length ? parsedKeys : base.keys.map((key) => ({ ...key }));
  if (!keys.some((key) => key.action === "clear")) {
    const clear = DEFAULT_ANALYZER_KEYS.find((key) => key.action === "clear");
    if (clear) keys.push({ ...clear });
  }
  const chromeRaw =
    row.chrome && typeof row.chrome === "object" && !Array.isArray(row.chrome)
      ? (row.chrome as Record<string, unknown>)
      : {};
  const chrome: BotChrome = { ...DEFAULT_BOT_CHROME };
  for (const key of Object.keys(DEFAULT_BOT_CHROME) as (keyof BotChrome)[]) {
    chrome[key] = parseButtonStyle(chromeRaw[key], DEFAULT_BOT_CHROME[key]);
  }
  return { service, flow, texts, keys, chrome };
}

export function botVars(input: {
  service?: string;
  exam?: string;
  link?: string;
  privacy?: string;
  max?: string;
}): Record<string, string> {
  return {
    service: input.service ?? "آینه",
    exam: input.exam ?? "",
    link: input.link ?? "",
    privacy: input.privacy ?? "/privacy",
    max: input.max ?? "",
  };
}

export function line(script: BotScript, key: keyof BotTexts, vars?: Record<string, string>): string {
  return interpolateBotText(script.texts[key], vars ?? botVars({ service: "آینه" })).slice(0, 4096);
}
