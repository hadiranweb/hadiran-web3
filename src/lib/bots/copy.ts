import type { AnalyzerPack } from "@/lib/analyzers/pack";

export function botWelcome(pack: AnalyzerPack): string {
  return [
    `هادیران — ${pack.nameFa}`,
    "",
    "من ربات همین آزمون هستم؛ ورود سایت با تلگرام نیست.",
    "",
    "مسیر:",
    "۱. پذیرش متن رضایت (اجباری)",
    "۲. ارسال شمارهٔ همراه خودتان",
    "۳. پاسخ سؤال‌ها یکی‌یکی",
    "",
    "مقیاس ۰ تا ۱۰: صفر راست، ده چپ.",
  ].join("\n");
}

export function botHelp(pack: AnalyzerPack): string {
  return [
    `راهنما — ${pack.nameFa}`,
    "",
    "/start شروع یا ادامه از همان سؤال ناتمام",
    "/help همین راهنما",
    "",
    "قبول رضایت اجباری است؛ راه فرار ندارد.",
    "شماره فقط با دکمهٔ تلگرام و فقط مال خودتان.",
    "کد معرف هشت‌رقمی اختیاری است؛ اگر ندارید «رد».",
    "ورود هادیران همچنان با موبایل است، نه با این ربات.",
  ].join("\n");
}

export function botConsent(pack: AnalyzerPack): string {
  const body = [pack.consent.titleFa, "", ...pack.consent.bodyFa].join("\n");
  return body.slice(0, 3500);
}

export const BOT_COMMANDS = [
  { command: "start", description: "شروع یا ادامهٔ آزمون" },
  { command: "help", description: "راهنمای ربات" },
];
