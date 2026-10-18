import type { AnalyzerPack } from "@/lib/analyzers/pack";
import { privacySummary, privacyUseTerms } from "@/lib/privacy/content";

export function botHubWelcome(): string {
  return [
    "هادیران — تحلیل‌گر هوشمند",
    "",
    "من ربات آزمون‌ها هستم؛ ورود مرورگر با تلگرام نیست.",
    "",
    "مسیر:",
    "۱. شمارهٔ خودتان",
    "۲. پذیرش سیاست",
    "۳. نام و نام‌خانوادگی",
    "۴. انتخاب آزمون",
    "",
    "رمز سایت را در چت ننویسید؛ لینک یک‌بارمصرف می‌آید.",
  ].join("\n");
}

export function botHubHelp(): string {
  return [
    "راهنما — تحلیل‌گر هوشمند",
    "",
    "/start شروع یا ادامه",
    "/help همین راهنما",
    "",
    "شماره با دکمه، یا تایپ (آن‌وقت کد پیامک).",
    "قبول سیاست اجباری است.",
    "کد معرف هشت‌رقمی اختیاری است.",
    "کد تخفیف بعد از انتخاب آزمون پرسیده می‌شود.",
    "ورود سایت با همان شماره و رمز لینک است، نه با این چت.",
  ].join("\n");
}

export function botHubPolicy(): string {
  return [privacySummary, "", ...privacyUseTerms, "", "جزئیات: /privacy روی سایت."].join("\n").slice(0, 3500);
}

export function botWelcome(pack: AnalyzerPack): string {
  return [`هادیران — ${pack.nameFa}`, "", pack.summaryFa].join("\n");
}

export function botHelp(pack: AnalyzerPack): string {
  return botHubHelp() + `\n\nآزمون جاری: ${pack.nameFa}`;
}

export function botConsent(pack: AnalyzerPack): string {
  const body = [pack.consent.titleFa, "", ...pack.consent.bodyFa].join("\n");
  return body.slice(0, 3500);
}

export const BOT_COMMANDS = [
  { command: "start", description: "شروع یا ادامه" },
  { command: "help", description: "راهنمای ربات" },
];
