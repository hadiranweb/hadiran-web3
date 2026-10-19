/** متن‌های خلاصهٔ گزارش کاسیو از بستهٔ تحویل. نمره اینجا محاسبه نمی‌شود. */

export const KEYWORD_GRAPH_NOTE_FA =
  "این شبکه ساختار مفهومی کلیدواژه‌های این لایه را نشان می‌دهد؛ اتصال آن به متن وضعیت موجود، حضور تک‌تک کلیدواژه‌ها در پاسخ فرد را اثبات نمی‌کند.";

export const BOTTLENECK_AS_IS_LABEL_FA = "وضعیت موجودِ مرجع";

const TITLE = "چالش اصلی شما در لایهٔ {layer_name} است.";
const GREETING = "{name} عزیز، به دنیای سیستم‌سازی خوش‌آمدید.";

type SummaryBand = {
  id: "low" | "middle" | "high";
  paragraphs: string[];
  match: (score: number) => boolean;
};

const BANDS: SummaryBand[] = [
  {
    id: "low",
    match: (score) => score < 30,
    paragraphs: [
      "واقعیتش را بخواهید، نمرهٔ کلی شما {total_score} از {total_score_max} شده، این یعنی شرایط شما از نگاه سیستم‌سازی نیازمند رسیدگی‌های بسیار است.",
      "پیشنهاد اکید کاسیو این است که به صورت اورژانسی به سراغ گلوگاه بحرانی خود در لایهٔ {bottleneck_layer_name} بروید و اصطلاحاً به داد آن برسید.",
      "خاصیت سیستم‌سازی این است که تغییر بهینه در وضعیت‌های موجود یعنی: {current_state_text} باعث تغییر اجزای دیگر هم می‌شود.",
      "گزارش از همین نقطه شروع می‌کند و سپس پنج لایه را جداگانه بررسی می‌کند تا بی‌درنگ بتوانید اولین قدم را در مسیر بهبود وضعیت فعلی بردارید.",
    ],
  },
  {
    id: "middle",
    match: (score) => score >= 30 && score <= 70,
    paragraphs: [
      "شرایط شما از نگاه سیستم‌سازی به رسیدگی بیشتری احتیاج دارد. نمرهٔ کلی شما {total_score} از {total_score_max} تشخیص داده شده و چالش اصلی شما در لایهٔ {bottleneck_layer_name} است.",
      "پیشنهاد کاسیو برای شما این است که با توجه به وضعیت موجود یعنی {current_state_text}، روی ترکیب راهکارهای گفته‌شده در این سند تمرکز کنید.",
      "خبر خوب! تغییر بهینه در هرکدام از اجزای سیستم کسب‌وکار شما، به‌صورت ناخودآگاه باعث بهبود در اجزای دیگر هم خواهد شد.",
      "راهکارهای ارائه‌شده را جدی بگیرید. توسعه می‌تواند نزدیک باشد.",
    ],
  },
  {
    id: "high",
    match: (score) => score > 70,
    paragraphs: [
      "شرایط شما از نگاه سیستم‌سازی عدد کلی {total_score} از {total_score_max} را دریافت کرده که قابل قبول است.",
      "اگر توجه ویژه‌ای به لایهٔ {bottleneck_layer_name} داشته باشید، توسعهٔ اصولی نزدیک است.",
      "به عبارت دیگر شما باید برای چیدن سیب از درخت توسعه، روی انگشتان پای خود بایستید.",
      "هم به مسیری که طی کردید و هم به خواندن ادامهٔ این سند، ادامه دهید.",
    ],
  },
];

function fill(template: string, vars: Record<string, string>) {
  return template.replace(/\{([a-z_]+)\}/g, (_, key: string) => vars[key] ?? "");
}

function firstNameFa(name: string) {
  return name.trim().split(/\s+/)[0] ?? "";
}

export function casioSummaryCopy(input: {
  personNameFa: string;
  totalScore: number | null;
  totalFa: string;
  totalMaxFa: string;
  bottleneckFa: string;
  bottleneckAsIsFa: string;
}): { summaryTitleFa: string; summaryParagraphsFa: string[] } {
  const score = input.totalScore ?? 0;
  const vars = {
    name: firstNameFa(input.personNameFa),
    layer_name: input.bottleneckFa,
    bottleneck_layer_name: input.bottleneckFa,
    total_score: input.totalFa,
    total_score_max: input.totalMaxFa,
    current_state_text: input.bottleneckAsIsFa,
  };
  const band = BANDS.find((row) => row.match(score)) ?? BANDS[1]!;
  const greeting = vars.name
    ? fill(GREETING, vars)
    : "به دنیای سیستم‌سازی خوش‌آمدید.";
  return {
    summaryTitleFa: fill(TITLE, vars),
    summaryParagraphsFa: [greeting, ...band.paragraphs.map((row) => fill(row, vars))],
  };
}

export const KEYWORD_ACCENT_COLORS = ["#a71925", "#176b89", "#c99b53"] as const;
