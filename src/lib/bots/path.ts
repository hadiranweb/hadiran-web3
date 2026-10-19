/** نقشهٔ مسیر ربات. مرحله‌ها ثابت سرویس‌اند؛ روشن/خاموش و متن از script، محتوای آزمون از pack. */

import type { BotFlow, BotService, BotTexts } from "@/lib/bots/script";

export type PathLane = "nav" | "main" | "exam";

export type PathParam = {
  id: string;
  dir: "in" | "out";
  labelFa: string;
  whereFa: string;
};

export type PathStage = {
  id: string;
  titleFa: string;
  hintFa: string;
  lane: PathLane;
  services: BotService[];
  /** اگر باشد، با همین کلید جریان روشن/خاموش می‌شود. */
  gate?: keyof BotFlow;
  texts: (keyof BotTexts)[];
  params: PathParam[];
  edit: "bot" | "pack" | "both";
};

export const BOT_PATH_STAGES: PathStage[] = [
  {
    id: "nav",
    titleFa: "کلیدهای پایدار",
    hintFa: "کیبورد پایین چت برای ناو ثابت است. گزینه‌های سؤال اینلاین روی همان پیام سؤال‌اند؛ با ناو قاطی نمی‌شوند.",
    lane: "nav",
    services: ["analyzers", "custom"],
    texts: ["startDescription", "helpDescription"],
    params: [
      { id: "keyboard", dir: "out", labelFa: "دکمه‌های پایین چت", whereFa: "محل: کیبورد پایدار · رنگ از سبک هر کلید" },
      { id: "menu", dir: "out", labelFa: "منوی / تلگرام", whereFa: "setMyCommands بعد از اتصال" },
      { id: "key-tap", dir: "in", labelFa: "متن دکمه یا /command", whereFa: "matchBotKey روی برچسب یا دستور" },
    ],
    edit: "bot",
  },
  {
    id: "start",
    titleFa: "شروع",
    hintFa: " /start یا کلید شروع. اگر ده دقیقه بیکار باشد دوباره از همین‌جا ادامه می‌دهد.",
    lane: "main",
    services: ["analyzers", "custom"],
    texts: ["welcome", "idleReply"],
    params: [
      { id: "/start", dir: "in", labelFa: "دستور /start", whereFa: "پیام متنی" },
      { id: "welcome", dir: "out", labelFa: "خوشامد", whereFa: "متن ربات · {service}" },
    ],
    edit: "bot",
  },
  {
    id: "phone",
    titleFa: "شماره",
    hintFa: "دکمهٔ تماس OTP نمی‌سازد. فقط شمارهٔ تایپی کد پیامک می‌گیرد. رمز در چت نیست.",
    lane: "main",
    services: ["analyzers", "custom"],
    texts: ["phonePrompt", "phoneButton", "phoneSaved", "onlyOwnPhone", "iranPhoneOnly"],
    params: [
      { id: "contact", dir: "in", labelFa: "contact.phone_number + user_id", whereFa: "دکمهٔ درخواست شماره" },
      { id: "typed-phone", dir: "in", labelFa: "شمارهٔ تایپی", whereFa: "فقط اگر تایپ شماره روشن باشد" },
      { id: "phonePrompt", dir: "out", labelFa: "درخواست شماره", whereFa: "متن ربات + کیبورد تماس" },
    ],
    edit: "bot",
  },
  {
    id: "otp",
    titleFa: "کد پیامک",
    hintFa: "فقط بعد از شمارهٔ تایپی. دکمهٔ تماس این مرحله را ندارد.",
    lane: "main",
    services: ["analyzers", "custom"],
    gate: "allowTypedPhone",
    texts: ["otpPrompt", "otpBad", "smsFailed", "rateLimit"],
    params: [
      { id: "otp", dir: "in", labelFa: "کد شش‌رقمی", whereFa: "پیام متنی" },
      { id: "otpPrompt", dir: "out", labelFa: "درخواست کد", whereFa: "متن ربات" },
    ],
    edit: "bot",
  },
  {
    id: "policy",
    titleFa: "قبول سیاست",
    hintFa: "سیاست سایت. جزئیات در /privacy.",
    lane: "main",
    services: ["analyzers", "custom"],
    gate: "askPolicy",
    texts: ["policy", "policyButton"],
    params: [
      { id: "policyok", dir: "in", labelFa: "callback policyok", whereFa: "دکمهٔ اینلاین روی همین پیام" },
      { id: "policy", dir: "out", labelFa: "متن سیاست", whereFa: "متن ربات · {privacy} {service}" },
    ],
    edit: "bot",
  },
  {
    id: "given",
    titleFa: "نام",
    hintFa: "نام کوچک حساب.",
    lane: "main",
    services: ["analyzers", "custom"],
    gate: "askNames",
    texts: ["givenPrompt", "givenBad"],
    params: [
      { id: "given", dir: "in", labelFa: "متن نام", whereFa: "پیام متنی" },
      { id: "givenPrompt", dir: "out", labelFa: "درخواست نام", whereFa: "متن ربات" },
    ],
    edit: "bot",
  },
  {
    id: "family",
    titleFa: "نام‌خانوادگی",
    hintFa: "بعد از نام، اگر پرسیدن نام روشن باشد.",
    lane: "main",
    services: ["analyzers", "custom"],
    gate: "askNames",
    texts: ["familyPrompt", "familyBad"],
    params: [
      { id: "family", dir: "in", labelFa: "متن نام‌خانوادگی", whereFa: "پیام متنی" },
      { id: "familyPrompt", dir: "out", labelFa: "درخواست نام‌خانوادگی", whereFa: "متن ربات" },
    ],
    edit: "bot",
  },
  {
    id: "referral",
    titleFa: "معرف",
    hintFa: "کد ۸رقمی. درخت معرف در اولین تماس، بدون حلقه.",
    lane: "main",
    services: ["analyzers", "custom"],
    gate: "askReferral",
    texts: ["referralPrompt", "referralSkip", "referralBad"],
    params: [
      { id: "code", dir: "in", labelFa: "۸ رقم یا رد", whereFa: "متن یا callback skipref" },
      { id: "referralPrompt", dir: "out", labelFa: "درخواست معرف", whereFa: "متن ربات + دکمهٔ رد اینلاین" },
    ],
    edit: "bot",
  },
  {
    id: "pick",
    titleFa: "انتخاب آزمون",
    hintFa: "پایان مسیر اصلی ربات آینه. اگر ربات به یک آزمون محدود باشد فقط همان می‌آید.",
    lane: "main",
    services: ["analyzers"],
    texts: ["examPick", "noExams", "examClosed", "examMissing"],
    params: [
      { id: "exam:slug", dir: "in", labelFa: "callback exam:{slug}", whereFa: "دکمهٔ اینلاین هر آزمون باز" },
      { id: "examPick", dir: "out", labelFa: "فهرست آزمون", whereFa: "متن ربات · نام از pack" },
    ],
    edit: "bot",
  },
  {
    id: "pack_consent",
    titleFa: "رضایت آزمون",
    hintFa: "متن و دکمه از pack همان آزمون است، نه از متن‌های عمومی ربات.",
    lane: "exam",
    services: ["analyzers"],
    texts: ["packConsentFailed"],
    params: [
      { id: "packok", dir: "in", labelFa: "callback packok", whereFa: "دکمهٔ اینلاین قبول" },
      { id: "consent", dir: "out", labelFa: "عنوان و متن رضایت", whereFa: "میز آزمون → ربات / مشخصات" },
    ],
    edit: "pack",
  },
  {
    id: "discount",
    titleFa: "تخفیف",
    hintFa: "بعد از انتخاب آزمون. کد تخفیف جدا از معرف است.",
    lane: "exam",
    services: ["analyzers"],
    gate: "askDiscount",
    texts: ["discountPrompt", "discountSkip", "discountBad"],
    params: [
      { id: "code", dir: "in", labelFa: "کد یا رد", whereFa: "متن یا callback skipdisc" },
      { id: "discountPrompt", dir: "out", labelFa: "درخواست تخفیف", whereFa: "متن ربات · {exam}" },
    ],
    edit: "bot",
  },
  {
    id: "question",
    titleFa: "سؤال‌ها",
    hintFa: "قالب MD سؤال و راهنما در «نحوه نمایش در ربات». مقیاس دو ردیف ۰–۱۰. راهنما بدون نقل‌قول.",
    lane: "exam",
    services: ["analyzers"],
    texts: ["questionGuide", "saveFailed", "staleButton", "textTooLong"],
    params: [
      { id: "q:i:v", dir: "in", labelFa: "callback q:{index}:{0–10}", whereFa: "دو ردیف؛ ۱۰…۶ سپس ۵…۰" },
      { id: "c:i:j", dir: "in", labelFa: "callback c:{index}:{option}", whereFa: "سؤال گزینه‌ای" },
      { id: "text", dir: "in", labelFa: "پاسخ متنی", whereFa: "سؤال باز تا maxLength" },
      { id: "item.text", dir: "out", labelFa: "متن سؤال", whereFa: "pack؛ **پررنگ** __کج__ `کد` و --- خط جدا" },
      { id: "guide", dir: "out", labelFa: "راهنما زیر گزینه‌ها", whereFa: "قالب MD آزمون؛ پیش‌فرض فقط لنگر ۰/۵/۱۰ بدون راست/چپ" },
    ],
    edit: "both",
  },
  {
    id: "result",
    titleFa: "خلاصهٔ نتیجه",
    hintFa: "یک پاراگراف با {token}؛ تفسیر لایه و گلوگاه به کاربر نمی‌رود.",
    lane: "exam",
    services: ["analyzers"],
    texts: [],
    params: [
      { id: "summary", dir: "out", labelFa: "قالب خلاصه + لینک بازخوانی", whereFa: "میز آزمون → گزارش · همان قالب وب و ربات" },
    ],
    edit: "pack",
  },
];

export function stagesForService(service: BotService, lane?: PathLane): PathStage[] {
  return BOT_PATH_STAGES.filter((stage) => stage.services.includes(service) && (!lane || stage.lane === lane));
}

export function stageIsOn(stage: PathStage, flow: BotFlow): boolean {
  if (!stage.gate) return true;
  return Boolean(flow[stage.gate]);
}

export const PATH_LANE_LABEL: Record<PathLane, string> = {
  nav: "نمایش کلیدها",
  main: "مسیر اصلی تا آزمون",
  exam: "مسیر هر آزمون",
};
