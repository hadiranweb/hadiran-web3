/** منبع: questions.source-of-truth.yaml v1.3.0 + سند ۰۴ + interpretation-matrix v1.3.0. */

import {
  edgesFromScoredSections,
  type AnalyzerPack,
  type ScaleAnchors,
  type Section,
} from "@/lib/analyzers/pack";
import { casioKeywordEdges, casioKeywords } from "./interpretation";

export type { ChoiceItem, Item, RangeItem, ScaleAnchors, Section, TextItem } from "@/lib/analyzers/pack";

export const INSTRUMENT_VERSION = "casio-ss-1.3.0";

export const GATE_ANCHORS: ScaleAnchors = {
  0: "اصلاً / هرگز",
  5: "گاهی / تا حدی",
  10: "کاملاً / همیشه",
};

export const CONSENT_TITLE = "قبل از شروع";
export const CONSENT_BODY = [
  "این یک ارزیابی کوتاه دربارهٔ شما و کسب‌وکارتان است. چند سؤال ساده از خودتان و کسب‌وکارتان می‌پرسیم و در پایان، بر اساس جواب‌هایتان یک جمع‌بندی به شما می‌دهیم.",
  "برای این کار لازم است نام و شمارهٔ همراه‌تان را داشته باشیم و جواب‌هایتان را نگه داریم تا بتوانید بعداً هم نتیجه‌تان را ببینید و اگر وسط راه رفتید، از همان‌جا ادامه دهید.",
  "جواب‌های شما فقط برای همین ارزیابی و بهتر شدن همین خدمت استفاده می‌شود؛ فروخته نمی‌شود و در اختیار کسی بیرون از تیم هادیران قرار نمی‌گیرد.",
  "نتیجهٔ این ارزیابی یک راهنمای کلی است، نه حکم قطعی دربارهٔ شما یا کسب‌وکارتان.",
  "شرکت در این ارزیابی کاملاً اختیاری است. هر وقت هم خواستید، می‌توانید بگویید اطلاعاتتان پاک شود.",
];

export const INTRO_SUMMARY =
  "عارضه‌یابی سازمانی هادیران: ارزیابی الگوی ذهنی، زمینهٔ کسب‌وکار، و بیست سؤال پنج‌لایه روی مقیاس ۰ تا ۱۰. پس از ثبت پاسخ‌ها گزارش شخصی پنج‌لایه ساخته می‌شود.";

const gateSections: Section[] = [
  { id: "gate-control", titleFa: "ارزیابی — منبع کنترل", introFa: "۱۲ گزاره؛ عدد نزدیک به تجربهٔ واقعی. درست یا غلط وجود ندارد.", items: [
    {
      kind: "range",
      id: "MG.A1",
      text: "وقتی کاری نتیجه نمی‌دهد، چقدر ابتدا در تصمیم یا اقدام خودم دنبال علت می‌گردم؟",
      reverse: false,
      anchors: GATE_ANCHORS,
    },
    {
      kind: "range",
      id: "MG.A2",
      text: "تا چه اندازه فکر می‌کنید بیشتر نتایج زندگی‌تان را تلاش خودتان تعیین می‌کند نه شانس؟",
      reverse: false,
      anchors: GATE_ANCHORS,
    },
    {
      kind: "range",
      id: "MG.A3",
      text: "تا چه اندازه احساس می‌کنید اتفاقات مهم زندگی‌تان بدون دخالت شما رخ می‌دهد؟",
      reverse: true,
      anchors: GATE_ANCHORS,
    },
    {
      kind: "range",
      id: "MG.A4",
      text: "وقتی یک نرم‌افزار خطا می‌دهد، چقدر قبل از مقصر دانستن آن، خودتان راه‌حلی جست‌وجو می‌کنید؟",
      reverse: false,
      anchors: GATE_ANCHORS,
    },
  ]},
  { id: "gate-agency", titleFa: "ارزیابی — فاعلیت و خودتنظیمی", introFa: undefined, items: [
    {
      kind: "range",
      id: "MG.B1",
      text: "وقتی یک فرم یا سامانه جدید را نمی‌فهمید، چقدر ابتدا خودتان راهنما را می‌خوانید و امتحان می‌کنید؟",
      reverse: false,
      anchors: GATE_ANCHORS,
    },
    {
      kind: "range",
      id: "MG.B2",
      text: "وقتی در ثبت‌نام یا استفاده از یک سامانه با اشکال مواجه می‌شوید، چقدر با امتحان روش‌های دیگر مشکل را دنبال می‌کنید؟",
      reverse: false,
      anchors: GATE_ANCHORS,
    },
    {
      kind: "range",
      id: "MG.B3",
      text: "وقتی کاری با اشکال مواجه می‌شود، چقدر تمایل دارید آن را رها کنید تا کس دیگری حلش کند؟",
      reverse: true,
      anchors: GATE_ANCHORS,
    },
    {
      kind: "range",
      id: "MG.B4",
      text: "در شرایط ناکامی تا چه اندازه می‌توانید ناراحتی خود را کنترل کرده و کار را ادامه دهید؟",
      reverse: false,
      anchors: GATE_ANCHORS,
    },
  ]},
  { id: "gate-problem", titleFa: "ارزیابی — تفکر مسئله‌محور", introFa: undefined, items: [
    {
      kind: "range",
      id: "MG.C1",
      text: "در موقعیت مبهم، چقدر ابتدا اطلاعات جمع می‌کنید و گزینه‌ها را مقایسه می‌کنید؟",
      reverse: false,
      anchors: GATE_ANCHORS,
    },
    {
      kind: "range",
      id: "MG.C2",
      text: "وقتی درباره یک مشکل صحبت می‌کنید، چقدر تمرکز شما بر پیشنهاد راه‌حل است تا بیان ناراحتی؟",
      reverse: false,
      anchors: GATE_ANCHORS,
    },
    {
      kind: "range",
      id: "MG.C3",
      text: "وقتی مشکلی پیش می‌آید، چقدر بیشتر وقت خود را صرف توصیف نارضایتی می‌کنید؟",
      reverse: true,
      anchors: GATE_ANCHORS,
    },
    {
      kind: "range",
      id: "MG.C4",
      text: "اگر راه اول جواب ندهد، چقدر سریع راه جایگزین امتحان می‌کنید؟",
      reverse: false,
      anchors: GATE_ANCHORS,
    },
  ]},
];

const businessSection: Section = {
  id: "business",
  titleFa: "زمینهٔ کسب‌وکار",
  introFa: "این شش مورد در نمره اثر ندارند؛ برای شناخت زمینه و سربرگ گزارش‌اند.",
  items: [
    { kind: "text", id: "BIZ.1", text: "نام کسب‌وکار", maxLength: 128 },
    { kind: "choice", id: "BIZ.2", text: "نوع کسب‌وکار", options: [{ value: "service", label: "خدماتی" }, { value: "product", label: "تولیدی" }, { value: "trade", label: "بازرگانی/فروش" }, { value: "digital", label: "آنلاین/دیجیتال" }, { value: "other", label: "سایر" }] },
    { kind: "text", id: "BIZ.3", text: "حیطهٔ فعالیت (مثلاً رستوران، نرم‌افزار، پوشاک)", maxLength: 64 },
    { kind: "choice", id: "BIZ.4", text: "تعداد پرسنل", options: [{ value: "solo", label: "فقط خودم" }, { value: "2-5", label: "۲ تا ۵" }, { value: "6-20", label: "۶ تا ۲۰" }, { value: "21-50", label: "۲۱ تا ۵۰" }, { value: "50+", label: "بیشتر از ۵۰" }] },
    { kind: "choice", id: "BIZ.5", text: "سابقهٔ مدیر (چند سال است مدیریت می‌کنید؟)", options: [{ value: "lt1", label: "کمتر از ۱ سال" }, { value: "1-3", label: "۱ تا ۳" }, { value: "3-5", label: "۳ تا ۵" }, { value: "5-10", label: "۵ تا ۱۰" }, { value: "10+", label: "بیشتر از ۱۰ سال" }] },
    { kind: "choice", id: "BIZ.6", text: "قدمت کسب‌وکار (چند سال است این کسب‌وکار فعال است؟)", options: [{ value: "lt1", label: "کمتر از ۱ سال" }, { value: "1-3", label: "۱ تا ۳" }, { value: "3-5", label: "۳ تا ۵" }, { value: "5-10", label: "۵ تا ۱۰" }, { value: "10+", label: "بیشتر از ۱۰ سال" }] },
  ],
};

const layerSections: Section[] = [
  { id: "layer-foundation", titleFa: "لایهٔ عارضه‌یابی — بنیان و رهبری", items: [
    {
      kind: "range",
      id: "FL.L1.Q1",
      text: "اگر امروز بخواهید کسب‌وکارتان را واگذار کنید، این مجموعه چقدر به‌عنوان یک سیستم مستقل (بدون حضور شما) قابل انتقال است؟",
      reverse: false,
      anchors: {
        0: "اصلاً مستقل نیست (با رفتن من کسب‌وکار کاملاً متوقف می‌شود).",
        5: "تا حدی مستقل است (بخشی از کارها بدون من پیش می‌رود).",
        10: "کاملاً مستقل است (خریدار می‌تواند تمام فرآیندها و مسئولیت‌ها را تحویل بگیرد).",
      },
    },
    {
      kind: "range",
      id: "FL.L1.Q2",
      text: "چقدر از زمان هفتگی شما صرف کارهای اجرایی و فنی روزمره می‌شود؟",
      reverse: true,
      anchors: {
        0: "اصلاً صرف کارهای اجرایی نمی‌شود (تمام زمانم صرف استراتژی و مدیریت می‌شود).",
        5: "حدود نصف زمانم صرف کارهای اجرایی می‌شود.",
        10: "تقریباً تمام زمانم صرف کارهای اجرایی روزمره می‌شود.",
      },
    },
    {
      kind: "range",
      id: "FL.L1.Q3",
      text: "اهداف کوتاه‌مدت (۳ ماهه) و بلندمدت (سالانه) کسب‌وکارتان چقدر مکتوب، شفاف و با مدیران یا شرکا به اشتراک گذاشته شده است؟",
      reverse: false,
      anchors: {
        0: "هیچ هدف مکتوبی وجود ندارد.",
        5: "اهداف مکتوب هستند، اما مبهم‌اند یا به بقیه اعلام نشده‌اند.",
        10: "کاملاً مکتوب، شفاف و با همه مدیران و شرکا به اشتراک گذاشته شده‌اند.",
      },
    },
    {
      kind: "range",
      id: "FL.L1.Q4",
      text: "حساب‌های مالی شرکت و برداشت‌های شخصی شما چقدر از هم تفکیک و جدا شده‌اند؟",
      reverse: false,
      anchors: {
        0: "اصلاً تفکیک نشده است (کاملاً وابسته به جیب و حساب شخصی مالک است).",
        5: "تا حدی تفکیک شده، اما گاهی با هم مخلوط می‌شوند.",
        10: "کاملاً تفکیک شده و انضباط کامل مالی برقرار است.",
      },
    },
  ]},
  { id: "layer-architecture", titleFa: "لایهٔ عارضه‌یابی — معماری و طراحی", items: [
    {
      kind: "range",
      id: "FL.L2.Q1",
      text: "مسیر کامل مشتری (از جذب و بازاریابی تا تحویل محصول یا خدمت) چقدر مکتوب و شفاف ترسیم شده است؟",
      reverse: false,
      anchors: {
        0: "اصلاً مکتوب نیست (فقط در ذهن افراد است).",
        5: "در قالب یادداشت‌های پراکنده وجود دارد.",
        10: "کاملاً به صورت فلوچارت یا نقشه فرآیند مکتوب و به‌روز وجود دارد.",
      },
    },
    {
      kind: "range",
      id: "FL.L2.Q2",
      text: "چقدر از کارهای روتین و تکراری شرکت دارای دستورالعمل گام‌به‌گام (SOP) یا چک‌لیست مشخص هستند؟",
      reverse: false,
      anchors: {
        0: "هیچ‌کدام دستورالعمل ندارند.",
        5: "حدود نصف کارهای روتین دستورالعمل دارند.",
        10: "تقریباً تمام کارهای روتین دارای دستورالعمل مکتوب هستند.",
      },
    },
    {
      kind: "range",
      id: "FL.L2.Q3",
      text: "یک کارمند جدید برای یادگیری کارش چقدر به آموزش حضوری و تجربه کلامی دیگران وابسته است؟",
      reverse: true,
      anchors: {
        0: "اصلاً وابسته نیست (با اسناد و آموزش‌های مکتوب به صورت مستقل راه می‌افتد).",
        5: "تا حدی وابسته است (نیمی با اسناد و نیمی با آموزش حضوری).",
        10: "کاملاً وابسته است (باید هفته‌ها کنار بقیه بنشیند تا کار را یاد بگیرد).",
      },
    },
    {
      kind: "range",
      id: "FL.L2.Q4",
      text: "مسئول نهاییِ هر خروجی و نتیجه در کسب‌وکارتان چقدر مشخص و شفاف است؟",
      reverse: false,
      anchors: {
        0: "اصلاً مشخص نیست (مرز وظایف و مسئولیت‌ها شناور و نامعلوم است).",
        5: "مسئولیت‌ها تا حدی مشخص است.",
        10: "کاملاً مشخص است (برای هر خروجی، یک مسئول نهاییِ معلوم وجود دارد).",
      },
    },
  ]},
  { id: "layer-flow", titleFa: "لایهٔ عارضه‌یابی — جاری‌سازی", items: [
    {
      kind: "range",
      id: "FL.L3.Q1",
      text: "اگر شما ۴ هفته متوالی غایب و از دسترس خارج باشید، کسب‌وکار چقدر می‌تواند بدون افت کیفیت به کارش ادامه دهد؟",
      reverse: false,
      anchors: {
        0: "اصلاً نمی‌تواند (کسب‌وکار کاملاً فلج می‌شود).",
        5: "تا حدی ادامه می‌دهد، اما با اختلال و افت کیفیت زیاد.",
        10: "کاملاً ادامه می‌دهد (بدون هیچ تغییری در کیفیت و حتی همراه با رشد).",
      },
    },
    {
      kind: "range",
      id: "FL.L3.Q2",
      text: "کارکنان در طول روز چقدر برای تصمیم‌گیری‌های خرد یا گرفتن تأیید نهایی به شما مراجعه می‌کنند؟",
      reverse: true,
      anchors: {
        0: "تقریباً هیچ (کمتر از ۳ بار در روز).",
        5: "تا حدی (حدود ۳ تا ۱۰ بار در روز).",
        10: "بسیار زیاد (بیش از ۱۰ بار در روز).",
      },
    },
    {
      kind: "range",
      id: "FL.L3.Q3",
      text: "تیم شما چقدر به دستورالعمل‌های مکتوب پایبند است و کارها را طبق آن‌ها انجام می‌دهد؟",
      reverse: false,
      anchors: {
        0: "اصلاً پایبند نیست (کارها کاملاً به روش‌های سلیقه‌ای و قدیمی انجام می‌شود).",
        5: "تا حدی پایبند است (گاهی طبق دستورالعمل و گاهی دیمی عمل می‌کنند).",
        10: "کاملاً پایبند است (تیم همیشه به طور مستمر طبق دستورالعمل عمل می‌کند).",
      },
    },
    {
      kind: "range",
      id: "FL.L3.Q4",
      text: "فرآیندها و آموزش‌های نوشته‌شده چقدر در عمل پیاده‌سازی و جاری شده‌اند؟",
      reverse: false,
      anchors: {
        0: "اصلاً جاری نشده‌اند (یا نوشته نشده‌اند یا کاملاً بایگانی شده و خاک می‌خورند).",
        5: "بخشی از آن‌ها جاری شده و بخشی بایگانی است.",
        10: "کاملاً جاری شده‌اند و در عمل روزمره استفاده می‌شوند.",
      },
    },
  ]},
  { id: "layer-monitor", titleFa: "لایهٔ عارضه‌یابی — نگهداشت و پایش", items: [
    {
      kind: "range",
      id: "FL.L4.Q1",
      text: "وضعیت کسب‌وکارتان چقدر با داشبورد عددی و شاخص‌های کلیدی (KPI) رصد می‌شود؟",
      reverse: false,
      anchors: {
        0: "اصلاً رصد نمی‌شود (فقط بر اساس حدس و گمان یا موجودی حساب رصد می‌شود).",
        5: "تا حدی رصد می‌شود (با گزارش‌های پراکنده و غیرمنظم).",
        10: "کاملاً رصد می‌شود (با داشبورد منظم و شاخص‌های عددیِ هفتگی).",
      },
    },
    {
      kind: "range",
      id: "FL.L4.Q2",
      text: "جلسات کاری تیم شما چقدر منظم، ساختاریافته و مسئله‌محور برگزار می‌شوند؟",
      reverse: false,
      anchors: {
        0: "اصلاً منظم نیست (فقط هنگام بروز مشکل یا بحران جلسه می‌گذاریم).",
        5: "تا حدی منظم است (گاهی منظم و گاهی بی‌برنامه).",
        10: "کاملاً منظم است (جلسات روتین با دستورجلسه مشخص و پیگیری مصوبات).",
      },
    },
    {
      kind: "range",
      id: "FL.L4.Q3",
      text: "وقتی یک خطای تکراری در کیفیت یا ارائه خدمات رخ می‌دهد، واکنش سیستم چقدر سرزنش یا جریمه فرد است؟",
      reverse: true,
      anchors: {
        0: "اصلاً جریمه نمی‌شود (همیشه خودِ فرآیند و سیستم بررسی و اصلاح می‌شود).",
        5: "گاهی فرد سرزنش می‌شود و گاهی فرآیند بررسی می‌شود.",
        10: "کاملاً جریمه می‌شود (واکنش اول، همیشه سرزنش یا جریمه فرد است).",
      },
    },
    {
      kind: "range",
      id: "FL.L4.Q4",
      text: "سیستم گزارش‌دهی شما چقدر می‌تواند انحراف از اهداف را به صورت خودکار هشدار دهد؟",
      reverse: false,
      anchors: {
        0: "اصلاً هشدار نمی‌دهد (حتماً باید پیگیری و پرس‌وجوی دستی انجام شود).",
        5: "تا حدی هشدار می‌دهد (گزارش‌ها و هشدارها گاهی دستی و غیرمنظم ارسال می‌شوند).",
        10: "کاملاً خودکار هشدار می‌دهد (انحراف‌ها به موقع و بدون نیاز به پرس‌وجو مشخص می‌شوند).",
      },
    },
  ]},
  { id: "layer-scale", titleFa: "لایهٔ عارضه‌یابی — توسعه و مقیاس‌پذیری", items: [
    {
      kind: "range",
      id: "FL.L5.Q1",
      text: "اگر حجم سفارش‌ها یا مشتریان شما در ماه آینده ۳ برابر شود، کسب‌وکارتان چقدر توانایی پاسخگویی (بدون افت کیفیت) را دارد؟",
      reverse: false,
      anchors: {
        0: "اصلاً ندارد (سیستم از هم می‌پاشد و کیفیت شدیداً افت می‌کند).",
        5: "تا حدی دارد (اما فقط با جذب سریع نیروهای جدید ممکن است).",
        10: "کاملاً دارد (سیستم آماده است و به راحتی بزرگ می‌شود).",
      },
    },
    {
      kind: "range",
      id: "FL.L5.Q2",
      text: "مدل کسب‌وکارتان چقدر قابلیت تکثیر (افتتاح شعبه، نمایندگی یا خط درآمد جدید) بدون حضور مستقیم شما را دارد؟",
      reverse: false,
      anchors: {
        0: "اصلاً قابلیت تکثیر ندارد.",
        5: "فقط با حضور و دخالت زیادِ خود من قابل تکثیر است.",
        10: "کاملاً بدون حضور مستقیم من قابل تکثیر است.",
      },
    },
    {
      kind: "range",
      id: "FL.L5.Q3",
      text: "رشد کسب‌وکارتان چقدر به وقت و حضور شخصی شما وابسته است؟",
      reverse: true,
      anchors: {
        0: "اصلاً وابسته نیست (بدون حضور من هم رشد می‌کند).",
        5: "تا حدی وابسته است.",
        10: "کاملاً وابسته است (اگر من بیشتر کار نکنم، کسب‌وکارم رشد نمی‌کند).",
      },
    },
    {
      kind: "range",
      id: "FL.L5.Q4",
      text: "کسب‌وکارتان چقدر توانایی دارد که با زیاد شدن مشتری‌ها، «زمان و هزینهِ ارائه کار به هر مشتری» را پایین و کنترل‌شده نگه دارد؟",
      reverse: false,
      anchors: {
        0: "اصلاً توانایی ندارد (با هر مشتری جدید، زمان، هزینه و دردسر به شدت بالا می‌رود).",
        5: "تا حدی توانایی دارد (هزینه‌ها دقیقاً به همان نسبتِ زیاد شدن مشتریان بالا می‌رود).",
        10: "کاملاً توانایی دارد (می‌توانیم مشتریان بسیار بیشتری را بدون بالا رفتنِ زمان و هزینه به ازای هر نفر، مدیریت کنیم).",
      },
    },
  ]},
];

export const sections: Section[] = [...gateSections, businessSection, ...layerSections];

export const allItems = sections.flatMap((s) => s.items);

export function sectionOf(itemId: string): Section | undefined {
  return sections.find((s) => s.items.some((i) => i.id === itemId));
}

const findings: AnalyzerPack["findings"] = [
  { id: "mindset", titleFa: "الگوی ذهنی", kind: "group" },
  { id: "gate-control", titleFa: "منبع کنترل", kind: "dimension", parentId: "mindset" },
  { id: "gate-agency", titleFa: "فاعلیت و خودتنظیمی", kind: "dimension", parentId: "mindset" },
  { id: "gate-problem", titleFa: "تفکر مسئله‌محور", kind: "dimension", parentId: "mindset" },
  { id: "diagnosis", titleFa: "عارضه‌یابی پنج‌لایه", kind: "group" },
  { id: "layer-foundation", titleFa: "بنیان و رهبری", kind: "layer", parentId: "diagnosis" },
  { id: "layer-architecture", titleFa: "معماری و طراحی", kind: "layer", parentId: "diagnosis" },
  { id: "layer-flow", titleFa: "جاری‌سازی", kind: "layer", parentId: "diagnosis" },
  { id: "layer-monitor", titleFa: "نگهداشت و پایش", kind: "layer", parentId: "diagnosis" },
  { id: "layer-scale", titleFa: "توسعه و مقیاس‌پذیری", kind: "layer", parentId: "diagnosis" },
];

const formulas: AnalyzerPack["formulas"] = [
  { id: "gate-control", op: "mean", of: ["MG.A1", "MG.A2", "MG.A3", "MG.A4"] },
  { id: "gate-agency", op: "mean", of: ["MG.B1", "MG.B2", "MG.B3", "MG.B4"] },
  { id: "gate-problem", op: "mean", of: ["MG.C1", "MG.C2", "MG.C3", "MG.C4"] },
  { id: "gate-mean", op: "mean", of: ["gate-control", "gate-agency", "gate-problem"] },
  { id: "gate-total", op: "weighted_sum", weights: [{ item: "gate-mean", weight: 10 }] },
  {
    id: "gate-band",
    op: "band",
    of: ["gate-total"],
    bands: [
      { id: "green", labelFa: "سبز", gte: 70, lte: 100 },
      { id: "yellow", labelFa: "زرد", gte: 40, lt: 70 },
      { id: "red", labelFa: "قرمز", lt: 40 },
    ],
  },
  { id: "layer-foundation", op: "sum_div", of: ["FL.L1.Q1", "FL.L1.Q2", "FL.L1.Q3", "FL.L1.Q4"], divisor: 2 },
  { id: "layer-architecture", op: "sum_div", of: ["FL.L2.Q1", "FL.L2.Q2", "FL.L2.Q3", "FL.L2.Q4"], divisor: 2 },
  { id: "layer-flow", op: "sum_div", of: ["FL.L3.Q1", "FL.L3.Q2", "FL.L3.Q3", "FL.L3.Q4"], divisor: 2 },
  { id: "layer-monitor", op: "sum_div", of: ["FL.L4.Q1", "FL.L4.Q2", "FL.L4.Q3", "FL.L4.Q4"], divisor: 2 },
  { id: "layer-scale", op: "sum_div", of: ["FL.L5.Q1", "FL.L5.Q2", "FL.L5.Q3", "FL.L5.Q4"], divisor: 2 },
  {
    id: "diagnosis-total",
    op: "sum",
    of: ["layer-foundation", "layer-architecture", "layer-flow", "layer-monitor", "layer-scale"],
  },
  {
    id: "bottleneck",
    op: "argmin",
    of: ["layer-foundation", "layer-architecture", "layer-flow", "layer-monitor", "layer-scale"],
  },
  {
    id: "maturity",
    op: "band",
    of: ["diagnosis-total"],
    bands: [
      { id: "mature", labelFa: "بالغ", gte: 80, lte: 100 },
      { id: "maturing", labelFa: "در حال بلوغ", gte: 60, lt: 80 },
      { id: "forming", labelFa: "در حال شکل‌گیری", gte: 40, lt: 60 },
      { id: "nascent", labelFa: "نوپا", lt: 40 },
    ],
  },
];

export const casioSsPack: AnalyzerPack = {
  slug: "casio-ss",
  version: INSTRUMENT_VERSION,
  status: "open",
  nameFa: "عارضه‌یابی سازمانی",
  summaryFa: INTRO_SUMMARY,
  scale: { kind: "range-0-10", min: 0, max: 10 },
  consent: {
    titleFa: CONSENT_TITLE,
    bodyFa: CONSENT_BODY,
    acceptLabelFa: "خواندم و موافقم",
  },
  sections,
  findings,
  keywords: casioKeywords,
  edges: [...edgesFromScoredSections(sections), ...casioKeywordEdges],
  formulas,
};

