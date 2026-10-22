/**
 * مرحلهٔ ۵ (Slice 5): بانک ۶۹ گویهٔ غربالگری و عارضه‌یابی تفصیلی (15 SCR + 54 DIAG)،
 * موتور مسیریابی تطبیقی چندمرحله‌ای (CD-MST Routing — Kim & Yoo, 2026; Kaplan & de la Torre, 2015)
 * و مولد خودکار «برگهٔ ۱ صفحه‌ای حل مسئلهٔ A3 (Shook, 2008 — S051) و کارت آزمون PDSA (Taylor et al., 2014 — S022)».
 */

import type { BusinessContextProfile } from "./context-modulation";
import type { LayerKeyword } from "./interpretation";
import type { OntologyDiagnosisSummary } from "./ontology-graph";

export type DeepDiveItemDef = {
  id: string;
  text: string;
  critical: boolean;
  reverse?: boolean;
  /** یال‌های وزن‌دار اتصال این گویهٔ تفصیلی به کلیدواژه‌های اصلی گراف ۵ لایه */
  keywordWeights: { keywordId: string; weight: number }[];
};

export type DiagDimensionDef = {
  id: "d1" | "d2" | "d3" | "d4" | "d5" | "d6" | "d7" | "d8" | "d9";
  codePrefix: string;
  titleFa: string;
  summaryFa: string;
  vaultConceptsFa: string[];
  sourceIds: string[];
  /** وزن‌های اتصال این بُعد تخصصی به کلیدواژه‌های اصلی (برای مسیریابی تطبیقی مرحلهٔ ۲) */
  keywordLinks: { keywordId: string; weight: number }[];
  items: DeepDiveItemDef[];
};

export type RecommendedDeepDiveModule = {
  dimensionId: DiagDimensionDef["id"];
  titleFa: string;
  summaryFa: string;
  priorityIndex: number;
  triggeredByKeywords: { id: string; titleFa: string; score: number }[];
  criticalItemId: string;
  items: { id: string; text: string; critical: boolean; answeredScore?: number }[];
  moduleScore?: number | null;
};

export type PdsaTestCard = {
  cycleDurationDays: number;
  planHypothesisFa: string;
  doSmallScaleFa: string;
  studyMetricFa: string;
  actDecisionRuleFa: string;
  fidelityChecklistFa: string[];
};

export type A3ActionSheet = {
  titleFa: string;
  bottleneckLayerId: string;
  bottleneckLayerTitleFa: string;
  primaryKeywordId: string;
  primaryKeywordTitleFa: string;
  ownerRoleFa: string;
  horizonFa: string;
  backgroundFa: string;
  currentConditionFa: string;
  multiLevelRootCause: {
    organizationRootFa: string;
    processRootFa: string;
    performerRootFa: string;
  };
  targetCondition30DayFa: string;
  pdsaCard: PdsaTestCard;
  supportingSourceIds: string[];
};

export type AdaptiveDeepDiveSummary = {
  totalBankItemsCount: number;
  screeningItemsCount: number;
  diagDimensionsCount: number;
  diagItemsCount: number;
  recommendedModules: RecommendedDeepDiveModule[];
  a3Sheet: A3ActionSheet;
};

/**
 * ۱۵ گویهٔ غربالگری نود (SCR.s01..s15) از فایل مرجع questions.source-of-truth.yaml
 */
export const SCR_ITEMS: DeepDiveItemDef[] = [
  {
    id: "SCR.s01",
    text: "مالک و مسئول مشخصی برای این نود تعیین شده و اختیارات او مکتوب است.",
    critical: true,
    keywordWeights: [
      { keywordId: "L2-K3", weight: 0.55 },
      { keywordId: "L3-K1", weight: 0.45 },
    ],
  },
  {
    id: "SCR.s02",
    text: "فرآیندهای اصلی نود به‌صورت مکتوب (پلی‌بوک/چک‌لیست) مستند شده‌اند.",
    critical: false,
    keywordWeights: [
      { keywordId: "L2-K2", weight: 0.65 },
      { keywordId: "L5-K1", weight: 0.35 },
    ],
  },
  {
    id: "SCR.s03",
    text: "هر فرآیند کلیدی، ورودی، خروجی و معیار موفقیت روشنی دارد.",
    critical: false,
    keywordWeights: [
      { keywordId: "L2-K1", weight: 0.50 },
      { keywordId: "L2-K3", weight: 0.50 },
    ],
  },
  {
    id: "SCR.s04",
    text: "داده‌های کلیدی کسب‌وکار در یک محل مشخص و قابل اتکا نگهداری می‌شود.",
    critical: false,
    keywordWeights: [
      { keywordId: "L4-K1", weight: 0.60 },
      { keywordId: "L5-K3", weight: 0.40 },
    ],
  },
  {
    id: "SCR.s05",
    text: "شاخص‌های کلیدی عملکرد (KPI) تعریف شده و به‌طور منظم پایش می‌شوند.",
    critical: true,
    keywordWeights: [
      { keywordId: "L4-K1", weight: 0.70 },
      { keywordId: "L4-K2", weight: 0.30 },
    ],
  },
  {
    id: "SCR.s06",
    text: "استانداردها و الزامات قانونی مرتبط با این فعالیت شناسایی و رعایت می‌شوند.",
    critical: true,
    keywordWeights: [
      { keywordId: "L2-K2", weight: 0.50 },
      { keywordId: "L4-K3", weight: 0.50 },
    ],
  },
  {
    id: "SCR.s07",
    text: "کنترل کیفیت خروجی‌ها (بازبینی/چک‌لیست) به‌صورت روتین انجام می‌شود.",
    critical: false,
    keywordWeights: [
      { keywordId: "L2-K3", weight: 0.55 },
      { keywordId: "L4-K3", weight: 0.45 },
    ],
  },
  {
    id: "SCR.s08",
    text: "ابزار دیجیتال مناسب (CRM/ERP/سامانه‌ی تخصصی) در نود استفاده می‌شود.",
    critical: false,
    keywordWeights: [
      { keywordId: "L5-K3", weight: 0.65 },
      { keywordId: "L4-K1", weight: 0.35 },
    ],
  },
  {
    id: "SCR.s09",
    text: "کارهای تکراری تا حد ممکن خودکار یا استاندارد شده‌اند.",
    critical: true,
    keywordWeights: [
      { keywordId: "L2-K2", weight: 0.55 },
      { keywordId: "L5-K3", weight: 0.45 },
    ],
  },
  {
    id: "SCR.s10",
    text: "مهارت‌های لازم برای اجرای این نود در تیم موجود است.",
    critical: false,
    keywordWeights: [
      { keywordId: "L3-K2", weight: 0.65 },
      { keywordId: "L3-K3", weight: 0.35 },
    ],
  },
  {
    id: "SCR.s11",
    text: "دانش کلیدی نود مستند و قابل انتقال به فرد جدید است.",
    critical: false,
    keywordWeights: [
      { keywordId: "L3-K2", weight: 0.55 },
      { keywordId: "L2-K2", weight: 0.45 },
    ],
  },
  {
    id: "SCR.s12",
    text: "مشتری هدف و ارزش پیشنهادی نود به‌روشنی تعریف شده است.",
    critical: false,
    keywordWeights: [
      { keywordId: "L1-K1", weight: 0.50 },
      { keywordId: "L2-K1", weight: 0.50 },
    ],
  },
  {
    id: "SCR.s13",
    text: "جریان ورود مشتری/فروش قابل پیش‌بینی و تکرارپذیر است.",
    critical: false,
    keywordWeights: [
      { keywordId: "L2-K1", weight: 0.50 },
      { keywordId: "L5-K1", weight: 0.50 },
    ],
  },
  {
    id: "SCR.s14",
    text: "درآمد و هزینه‌های نود به‌صورت منظم اندازه‌گیری و تحلیل می‌شود.",
    critical: true,
    keywordWeights: [
      { keywordId: "L1-K2", weight: 0.55 },
      { keywordId: "L5-K2", weight: 0.45 },
    ],
  },
  {
    id: "SCR.s15",
    text: "نود حداقل به نقطه‌ی سربه‌سر رسیده یا مسیر روشنی برای آن دارد.",
    critical: false,
    keywordWeights: [
      { keywordId: "L5-K2", weight: 0.65 },
      { keywordId: "L1-K2", weight: 0.35 },
    ],
  },
];

/**
 * ۹ بُعد تخصصی و ۵۴ گویهٔ عارضه‌یابی تفصیلی (DIAG.d101..d906) از فایل مرجع questions.source-of-truth.yaml
 */
export const DIAG_DIMENSIONS: DiagDimensionDef[] = [
  {
    id: "d1",
    codePrefix: "DIAG.d1",
    titleFa: "بُعد ۱: استراتژی، مدل درآمدی و برنامهٔ رشد",
    summaryFa: "کالبدشکافی شفافیت مدل درآمدی، شکست اهداف ۱۲ ماهه به اهداف فصلی و تصمیم‌گیری راهبردی داده‌محور.",
    vaultConceptsFa: ["حاکمیت سازمانی", "هم‌راستایی و انسجام", "مقیاس‌پذیری"],
    sourceIds: ["S036", "S037", "S052"],
    keywordLinks: [
      { keywordId: "L1-K1", weight: 0.90 },
      { keywordId: "L5-K2", weight: 0.55 },
      { keywordId: "L5-K1", weight: 0.45 },
    ],
    items: [
      {
        id: "DIAG.d101",
        text: "مدل درآمدی نود (چگونه پول درمی‌آورد) مکتوب و شفاف است.",
        critical: false,
        keywordWeights: [
          { keywordId: "L1-K1", weight: 0.55 },
          { keywordId: "L5-K2", weight: 0.45 },
        ],
      },
      {
        id: "DIAG.d102",
        text: "بازار هدف و اندازه‌ی فرصت آن برآورد مستند دارد.",
        critical: false,
        keywordWeights: [
          { keywordId: "L1-K1", weight: 0.60 },
          { keywordId: "L5-K1", weight: 0.40 },
        ],
      },
      {
        id: "DIAG.d103",
        text: "مزیت رقابتی ما مشخص و قابل دفاع است.",
        critical: false,
        keywordWeights: [
          { keywordId: "L1-K1", weight: 0.60 },
          { keywordId: "L5-K1", weight: 0.40 },
        ],
      },
      {
        id: "DIAG.d104",
        text: "اهداف ۱۲ ماه آینده به اهداف فصلی و ماهانه شکسته شده است.",
        critical: true,
        keywordWeights: [
          { keywordId: "L1-K1", weight: 0.70 },
          { keywordId: "L4-K1", weight: 0.30 },
        ],
      },
      {
        id: "DIAG.d105",
        text: "تصمیم‌های راهبردی بر پایه‌ی داده گرفته می‌شود، نه سلیقه.",
        critical: false,
        keywordWeights: [
          { keywordId: "L1-K1", weight: 0.50 },
          { keywordId: "L4-K1", weight: 0.50 },
        ],
      },
      {
        id: "DIAG.d106",
        text: "برنامه‌ی رشد نود (محصول، بازار، ظرفیت) مکتوب است.",
        critical: false,
        keywordWeights: [
          { keywordId: "L1-K1", weight: 0.50 },
          { keywordId: "L5-K3", weight: 0.50 },
        ],
      },
    ],
  },
  {
    id: "d2",
    codePrefix: "DIAG.d2",
    titleFa: "بُعد ۲: معماری فرآیند، مالکیت و زمان چرخه",
    summaryFa: "بررسی نقشهٔ جریان کار، مالکیت هر فرآیند، مستندسازی ورودی/خروجی و سنجش گلوگاه‌ها.",
    vaultConceptsFa: ["مدیریت فرایند کسب‌وکار", "مدیریت فضای خالی", "کشف فرایند"],
    sourceIds: ["S025", "S039", "S052", "S053"],
    keywordLinks: [
      { keywordId: "L2-K1", weight: 0.90 },
      { keywordId: "L2-K3", weight: 0.85 },
      { keywordId: "L2-K2", weight: 0.70 },
    ],
    items: [
      {
        id: "DIAG.d201",
        text: "نقشه‌ی فرآیندهای اصلی (Workflow Map) ترسیم شده است.",
        critical: false,
        keywordWeights: [
          { keywordId: "L2-K1", weight: 0.75 },
          { keywordId: "L2-K2", weight: 0.25 },
        ],
      },
      {
        id: "DIAG.d202",
        text: "مالک و مسئول هر فرآیند مشخص است.",
        critical: false,
        keywordWeights: [
          { keywordId: "L2-K3", weight: 0.70 },
          { keywordId: "L3-K1", weight: 0.30 },
        ],
      },
      {
        id: "DIAG.d203",
        text: "ورودی و خروجی هر فرآیند مستند است.",
        critical: false,
        keywordWeights: [
          { keywordId: "L2-K3", weight: 0.60 },
          { keywordId: "L2-K2", weight: 0.40 },
        ],
      },
      {
        id: "DIAG.d204",
        text: "گلوگاه‌ها شناسایی شده و زمان چرخه‌ی هر فرآیند اندازه‌گیری می‌شود.",
        critical: true,
        keywordWeights: [
          { keywordId: "L2-K1", weight: 0.50 },
          { keywordId: "L4-K1", weight: 0.50 },
        ],
      },
      {
        id: "DIAG.d205",
        text: "رویه‌های اضطراری/جایگزین برای اختلال‌ها تعریف شده است.",
        critical: false,
        keywordWeights: [
          { keywordId: "L3-K3", weight: 0.60 },
          { keywordId: "L2-K2", weight: 0.40 },
        ],
      },
      {
        id: "DIAG.d206",
        text: "بهبود فرآیندها چرخه‌ی منظم دارد (بازخورد ← اصلاح).",
        critical: false,
        keywordWeights: [
          { keywordId: "L4-K3", weight: 0.65 },
          { keywordId: "L2-K2", weight: 0.35 },
        ],
      },
    ],
  },
  {
    id: "d3",
    codePrefix: "DIAG.d3",
    titleFa: "بُعد ۳: مدل داده، گزارش‌دهی و داشبورد مدیریتی",
    summaryFa: "ارزیابی ساختار داده‌ها، گزارش‌گیری خودکار (غیر دستی)، دسترسی تصمیم‌گیرنده به داشبورد و بازخورد به عملیات.",
    vaultConceptsFa: ["پایش", "شاخص کلیدی عملکرد (KPI)", "بهبود مستمر"],
    sourceIds: ["S028", "S043", "S048"],
    keywordLinks: [
      { keywordId: "L4-K1", weight: 0.95 },
      { keywordId: "L4-K2", weight: 0.70 },
      { keywordId: "L5-K3", weight: 0.50 },
    ],
    items: [
      {
        id: "DIAG.d301",
        text: "فیلدها و ساختار داده‌های اصلی (Data Model) تعریف شده است.",
        critical: false,
        keywordWeights: [
          { keywordId: "L4-K1", weight: 0.60 },
          { keywordId: "L5-K3", weight: 0.40 },
        ],
      },
      {
        id: "DIAG.d302",
        text: "سطوح دسترسی و محرمانگی داده‌ها مشخص و رعایت می‌شود.",
        critical: true,
        keywordWeights: [
          { keywordId: "L3-K1", weight: 0.50 },
          { keywordId: "L5-K3", weight: 0.50 },
        ],
      },
      {
        id: "DIAG.d303",
        text: "پاک‌سازی داده‌ی تکراری/متناقض به‌صورت منظم انجام می‌شود.",
        critical: false,
        keywordWeights: [
          { keywordId: "L4-K1", weight: 0.65 },
          { keywordId: "L4-K3", weight: 0.35 },
        ],
      },
      {
        id: "DIAG.d304",
        text: "گزارش‌های مدیریتی مستقیماً از داده استخراج می‌شوند (نه دستی).",
        critical: false,
        keywordWeights: [
          { keywordId: "L4-K1", weight: 0.75 },
          { keywordId: "L5-K3", weight: 0.25 },
        ],
      },
      {
        id: "DIAG.d305",
        text: "داشبورد مدیریتی به‌روز در دسترس تصمیم‌گیرنده است.",
        critical: false,
        keywordWeights: [
          { keywordId: "L4-K1", weight: 0.70 },
          { keywordId: "L4-K2", weight: 0.30 },
        ],
      },
      {
        id: "DIAG.d306",
        text: "مسیر بازگشت نتیجه‌ی تحلیل به عملیات روزمره برقرار است.",
        critical: false,
        keywordWeights: [
          { keywordId: "L4-K2", weight: 0.55 },
          { keywordId: "L4-K3", weight: 0.45 },
        ],
      },
    ],
  },
  {
    id: "d4",
    codePrefix: "DIAG.d4",
    titleFa: "بُعد ۴: فناوری، اتوماسیون و یکپارچگی سامانه‌ها",
    summaryFa: "بررسی یکپارچگی ابزارهای دیجیتال، پایداری اتوماسیون‌ها، پشتیبان‌گیری و نقشهٔ راه زیرساخت.",
    vaultConceptsFa: ["طراحی سیستم", "مقیاس‌پذیری", "استانداردسازی"],
    sourceIds: ["S039", "S045", "S047"],
    keywordLinks: [
      { keywordId: "L5-K3", weight: 0.95 },
      { keywordId: "L4-K1", weight: 0.55 },
      { keywordId: "L2-K2", weight: 0.45 },
    ],
    items: [
      {
        id: "DIAG.d401",
        text: "ابزارهای فعلی پاسخ نیاز نود را می‌دهند و از هم پراکنده نیستند.",
        critical: false,
        keywordWeights: [
          { keywordId: "L5-K3", weight: 0.70 },
          { keywordId: "L2-K2", weight: 0.30 },
        ],
      },
      {
        id: "DIAG.d402",
        text: "اتوماسیون‌های موجود پایدارند و خطای مکرر ندارند.",
        critical: true,
        keywordWeights: [
          { keywordId: "L5-K3", weight: 0.65 },
          { keywordId: "L4-K3", weight: 0.35 },
        ],
      },
      {
        id: "DIAG.d403",
        text: "یکپارچگی بین سامانه‌ها (API/فایل مشترک) برقرار است.",
        critical: false,
        keywordWeights: [
          { keywordId: "L5-K3", weight: 0.65 },
          { keywordId: "L2-K3", weight: 0.35 },
        ],
      },
      {
        id: "DIAG.d404",
        text: "محیط آزمون و پشتیبان‌گیری سامانه‌ها انجام می‌شود.",
        critical: false,
        keywordWeights: [
          { keywordId: "L5-K3", weight: 0.60 },
          { keywordId: "L3-K3", weight: 0.40 },
        ],
      },
      {
        id: "DIAG.d405",
        text: "تیم توان نگهداری ابزارها را دارد یا پشتیبانی قراردادی وجود دارد.",
        critical: false,
        keywordWeights: [
          { keywordId: "L3-K3", weight: 0.55 },
          { keywordId: "L5-K3", weight: 0.45 },
        ],
      },
      {
        id: "DIAG.d406",
        text: "نقشه‌ی راه فناوری (چه چیزی، چه زمانی، با چه هزینه‌ای) مکتوب است.",
        critical: false,
        keywordWeights: [
          { keywordId: "L5-K3", weight: 0.60 },
          { keywordId: "L1-K1", weight: 0.40 },
        ],
      },
    ],
  },
  {
    id: "d5",
    codePrefix: "DIAG.d5",
    titleFa: "بُعد ۵: استانداردها، کنترل کیفیت و انطباق",
    summaryFa: "بررسی رعایت استانداردهای اجرایی، کنترل کیفیت طبق دستورالعمل و ثبت سوابق ممیزی و اقدام اصلاحی.",
    vaultConceptsFa: ["روش اجرای کار (SOP)", "استانداردسازی", "بهبود مستمر"],
    sourceIds: ["S049", "S050", "S051"],
    keywordLinks: [
      { keywordId: "L2-K2", weight: 0.90 },
      { keywordId: "L4-K3", weight: 0.80 },
      { keywordId: "L2-K3", weight: 0.65 },
    ],
    items: [
      {
        id: "DIAG.d501",
        text: "فهرست استانداردها و الزامات مرتبط به‌روز نگهداری می‌شود.",
        critical: false,
        keywordWeights: [
          { keywordId: "L2-K2", weight: 0.70 },
          { keywordId: "L5-K1", weight: 0.30 },
        ],
      },
      {
        id: "DIAG.d502",
        text: "گواهی‌نامه‌ها/مجوزهای لازم معتبر و در دسترس‌اند.",
        critical: true,
        keywordWeights: [
          { keywordId: "L5-K1", weight: 0.55 },
          { keywordId: "L1-K1", weight: 0.45 },
        ],
      },
      {
        id: "DIAG.d503",
        text: "کنترل کیفیت تجهیزات/خروجی‌ها طبق دستورالعمل انجام می‌شود.",
        critical: false,
        keywordWeights: [
          { keywordId: "L2-K2", weight: 0.55 },
          { keywordId: "L2-K3", weight: 0.45 },
        ],
      },
      {
        id: "DIAG.d504",
        text: "سوابق ممیزی و اقدامات اصلاحی نگهداری می‌شود.",
        critical: false,
        keywordWeights: [
          { keywordId: "L4-K3", weight: 0.75 },
          { keywordId: "L4-K1", weight: 0.25 },
        ],
      },
      {
        id: "DIAG.d505",
        text: "کارکنان با الزامات قانونی مرتبط با نقش خود آشنا هستند.",
        critical: false,
        keywordWeights: [
          { keywordId: "L3-K2", weight: 0.60 },
          { keywordId: "L2-K3", weight: 0.40 },
        ],
      },
      {
        id: "DIAG.d506",
        text: "ریسک‌های انطباقی (جریمه/توقف فعالیت) ارزیابی شده است.",
        critical: false,
        keywordWeights: [
          { keywordId: "L4-K3", weight: 0.60 },
          { keywordId: "L3-K3", weight: 0.40 },
        ],
      },
    ],
  },
  {
    id: "d6",
    codePrefix: "DIAG.d6",
    titleFa: "بُعد ۶: ساختار سازمانی، سرمایهٔ انسانی و جایگزین‌پذیری",
    summaryFa: "ارزیابی شرح وظایف، فرآیند استاندارد ورود نیروی جدید (Onboarding)، آموزش مهارتی و مدیریت وابستگی به افراد کلیدی.",
    vaultConceptsFa: ["تفویض اختیار", "خودمختاری", "یادگیری و انتقال", "تکرارپذیری"],
    sourceIds: ["S038", "S040", "S041", "S042", "S044"],
    keywordLinks: [
      { keywordId: "L3-K1", weight: 0.90 },
      { keywordId: "L3-K2", weight: 0.95 },
      { keywordId: "L3-K3", weight: 0.85 },
      { keywordId: "L1-K3", weight: 0.70 },
    ],
    items: [
      {
        id: "DIAG.d601",
        text: "ساختار سازمانی و شرح وظایف به‌روز است.",
        critical: false,
        keywordWeights: [
          { keywordId: "L2-K3", weight: 0.55 },
          { keywordId: "L3-K1", weight: 0.45 },
        ],
      },
      {
        id: "DIAG.d602",
        text: "فرآیند جذب و ورود نیروی جدید (Onboarding) استاندارد دارد.",
        critical: false,
        keywordWeights: [
          { keywordId: "L3-K2", weight: 0.70 },
          { keywordId: "L2-K2", weight: 0.30 },
        ],
      },
      {
        id: "DIAG.d603",
        text: "برنامه‌ی آموزش مهارتی به‌صورت منظم اجرا می‌شود.",
        critical: false,
        keywordWeights: [
          { keywordId: "L3-K2", weight: 0.75 },
          { keywordId: "L3-K1", weight: 0.25 },
        ],
      },
      {
        id: "DIAG.d604",
        text: "شاخص عملکرد فردی اندازه‌گیری و بازخورد داده می‌شود.",
        critical: true,
        keywordWeights: [
          { keywordId: "L4-K1", weight: 0.50 },
          { keywordId: "L3-K1", weight: 0.50 },
        ],
      },
      {
        id: "DIAG.d605",
        text: "وابستگی به افراد کلیدی مدیریت شده (جایگزین/مستندسازی).",
        critical: false,
        keywordWeights: [
          { keywordId: "L3-K3", weight: 0.60 },
          { keywordId: "L1-K3", weight: 0.40 },
        ],
      },
      {
        id: "DIAG.d606",
        text: "رضایت و ماندگاری نیروی کلیدی پایش می‌شود.",
        critical: false,
        keywordWeights: [
          { keywordId: "L3-K3", weight: 0.55 },
          { keywordId: "L4-K2", weight: 0.45 },
        ],
      },
    ],
  },
  {
    id: "d7",
    codePrefix: "DIAG.d7",
    titleFa: "بُعد ۷: مشتری، قیمت‌گذاری، قیف فروش و برند",
    summaryFa: "بررسی مستندسازی پرسونای مشتری، اندازه‌گیری کانال‌های جذب، قیمت‌گذاری مبتنی بر هزینه و ارزش و پایش قیف فروش.",
    vaultConceptsFa: ["مدیریت فرایند کسب‌وکار", "فرانچایز و تکثیر", "اقتصاد واحد"],
    sourceIds: ["S023", "S025", "S045", "S046"],
    keywordLinks: [
      { keywordId: "L2-K1", weight: 0.85 },
      { keywordId: "L5-K1", weight: 0.75 },
      { keywordId: "L5-K2", weight: 0.70 },
    ],
    items: [
      {
        id: "DIAG.d701",
        text: "پرسونای مشتری و نیاز او مستند شده است.",
        critical: false,
        keywordWeights: [
          { keywordId: "L2-K1", weight: 0.60 },
          { keywordId: "L1-K1", weight: 0.40 },
        ],
      },
      {
        id: "DIAG.d702",
        text: "کانال‌های جذب مشتری مشخص و اندازه‌گیری می‌شوند.",
        critical: true,
        keywordWeights: [
          { keywordId: "L2-K1", weight: 0.55 },
          { keywordId: "L4-K1", weight: 0.45 },
        ],
      },
      {
        id: "DIAG.d703",
        text: "قیمت‌گذاری بر پایه‌ی هزینه و ارزش انجام شده است.",
        critical: false,
        keywordWeights: [
          { keywordId: "L5-K2", weight: 0.70 },
          { keywordId: "L1-K2", weight: 0.30 },
        ],
      },
      {
        id: "DIAG.d704",
        text: "قیف فروش (از سرنخ تا خرید) تعریف و پایش می‌شود.",
        critical: false,
        keywordWeights: [
          { keywordId: "L2-K1", weight: 0.60 },
          { keywordId: "L4-K1", weight: 0.40 },
        ],
      },
      {
        id: "DIAG.d705",
        text: "رضایت مشتری و نرخ شکایت/بازگشت اندازه‌گیری می‌شود.",
        critical: false,
        keywordWeights: [
          { keywordId: "L4-K1", weight: 0.50 },
          { keywordId: "L4-K3", weight: 0.50 },
        ],
      },
      {
        id: "DIAG.d706",
        text: "محتوا و هویت برند (پیام، لحن، تصویر) یکدست است.",
        critical: false,
        keywordWeights: [
          { keywordId: "L5-K1", weight: 0.70 },
          { keywordId: "L2-K2", weight: 0.30 },
        ],
      },
    ],
  },
  {
    id: "d8",
    codePrefix: "DIAG.d8",
    titleFa: "بُعد ۸: انضباط مالی، بهای تمام‌شده، نقدینگی و سودآوری",
    summaryFa: "بررسی تهیهٔ صورت سود و زیان ماهانه، محاسبهٔ بهای تمام‌شده و حاشیهٔ سود واحد، پیش‌بینی جریان نقد و حذف هزینه‌های پنهان.",
    vaultConceptsFa: ["حاکمیت سازمانی", "اقتصاد واحد", "پایداری و ریسک"],
    sourceIds: ["S023", "S036", "S045"],
    keywordLinks: [
      { keywordId: "L1-K2", weight: 0.95 },
      { keywordId: "L5-K2", weight: 0.95 },
      { keywordId: "L4-K1", weight: 0.50 },
    ],
    items: [
      {
        id: "DIAG.d801",
        text: "صورت درآمد و هزینه‌ی ماهانه تهیه می‌شود.",
        critical: true,
        keywordWeights: [
          { keywordId: "L1-K2", weight: 0.65 },
          { keywordId: "L4-K1", weight: 0.35 },
        ],
      },
      {
        id: "DIAG.d802",
        text: "بهای تمام‌شده‌ی محصول/خدمت محاسبه شده و به‌روز است.",
        critical: false,
        keywordWeights: [
          { keywordId: "L5-K2", weight: 0.70 },
          { keywordId: "L1-K2", weight: 0.30 },
        ],
      },
      {
        id: "DIAG.d803",
        text: "حاشیه‌ی سود هر محصول/خدمت مشخص است.",
        critical: false,
        keywordWeights: [
          { keywordId: "L5-K2", weight: 0.75 },
          { keywordId: "L1-K2", weight: 0.25 },
        ],
      },
      {
        id: "DIAG.d804",
        text: "برنامه‌ی نقدینگی و پیش‌بینی جریان نقدی وجود دارد.",
        critical: false,
        keywordWeights: [
          { keywordId: "L1-K2", weight: 0.70 },
          { keywordId: "L5-K2", weight: 0.30 },
        ],
      },
      {
        id: "DIAG.d805",
        text: "هزینه‌های پنهان/هدررفت شناسایی شده و هدف کاهش دارند.",
        critical: false,
        keywordWeights: [
          { keywordId: "L5-K2", weight: 0.60 },
          { keywordId: "L4-K3", weight: 0.40 },
        ],
      },
      {
        id: "DIAG.d806",
        text: "سرمایه‌گذاری‌ها و بازگشت آن‌ها (ROI) ارزیابی می‌شود.",
        critical: false,
        keywordWeights: [
          { keywordId: "L1-K2", weight: 0.50 },
          { keywordId: "L5-K2", weight: 0.50 },
        ],
      },
    ],
  },
  {
    id: "d9",
    codePrefix: "DIAG.d9",
    titleFa: "بُعد ۹: مدیریت ریسک، ثبت و ریشه‌یابی خطا و تداوم عملیاتی",
    summaryFa: "ارزیابی فهرست ریسک‌های اصلی، ثبت و ریشه‌یابی سیستمی خطاها (RCA)، نگهداری پیشگیرانه و رفع وابستگی به تک‌نفر یا تک‌مشتری.",
    vaultConceptsFa: ["تحلیل علت ریشه‌ای", "حل مسئله و A3", "پایداری و ریسک"],
    sourceIds: ["S049", "S051", "S054"],
    keywordLinks: [
      { keywordId: "L4-K3", weight: 0.95 },
      { keywordId: "L3-K3", weight: 0.85 },
      { keywordId: "L1-K3", weight: 0.65 },
    ],
    items: [
      {
        id: "DIAG.d901",
        text: "فهرست ریسک‌های اصلی (عملیاتی/مالی/حقوقی) تهیه شده است.",
        critical: true,
        keywordWeights: [
          { keywordId: "L3-K3", weight: 0.55 },
          { keywordId: "L1-K1", weight: 0.45 },
        ],
      },
      {
        id: "DIAG.d902",
        text: "برای ریسک‌های بحرانی برنامه‌ی کاهش/اقدام نوشته شده است.",
        critical: false,
        keywordWeights: [
          { keywordId: "L4-K3", weight: 0.55 },
          { keywordId: "L3-K3", weight: 0.45 },
        ],
      },
      {
        id: "DIAG.d903",
        text: "بیمه/پشتیبان مناسب (تجهیزات، اطلاعات، افراد) وجود دارد.",
        critical: false,
        keywordWeights: [
          { keywordId: "L3-K3", weight: 0.65 },
          { keywordId: "L5-K3", weight: 0.35 },
        ],
      },
      {
        id: "DIAG.d904",
        text: "حوادث و خطاها ثبت و ریشه‌یابی (عارضه‌یابی) می‌شوند.",
        critical: false,
        keywordWeights: [
          { keywordId: "L4-K3", weight: 0.85 },
          { keywordId: "L2-K2", weight: 0.15 },
        ],
      },
      {
        id: "DIAG.d905",
        text: "نگهداری پیشگیرانه/دوره‌ای تجهیزات و سامانه‌ها انجام می‌شود.",
        critical: false,
        keywordWeights: [
          { keywordId: "L5-K3", weight: 0.55 },
          { keywordId: "L4-K3", weight: 0.45 },
        ],
      },
      {
        id: "DIAG.d906",
        text: "وابستگی به یک مشتری/فرد/تأمین‌کننده مدیریت شده است.",
        critical: false,
        keywordWeights: [
          { keywordId: "L1-K3", weight: 0.50 },
          { keywordId: "L3-K3", weight: 0.50 },
        ],
      },
    ],
  },
];

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * انتخاب تطبیقی ماژول‌های مرحلهٔ ۲ (CD-MST Stage-2 Routing):
 * بر اساس بردار شکاف وزنی زمینه‌مند ۱۵ کلیدواژه، پراطلاع‌ترین ابعاد تخصصی (از میان d1..d9)
 * و ۱۲ تا ۱۸ گویهٔ کاوش عمیق را برای کالبدشکافی دقیق گلوگاه انتخاب می‌کند.
 */
export function selectAdaptiveDeepDiveModules(
  keywords: LayerKeyword[],
  answers: Record<string, number | string>,
  topCount = 2,
): RecommendedDeepDiveModule[] {
  const kwMap = new Map<string, LayerKeyword>(keywords.map((kw) => [kw.id, kw] as const));

  const scoredDims: RecommendedDeepDiveModule[] = DIAG_DIMENSIONS.map((dim) => {
    let priorityIndex = 0;
    const triggered: { id: string; titleFa: string; score: number }[] = [];

    for (const link of dim.keywordLinks) {
      const kw = kwMap.get(link.keywordId);
      const score = kw?.score ?? 10;
      const deficit = kw?.contextWeightedDeficit ?? Math.max(0, 20 - score);
      priorityIndex += link.weight * deficit;
      if (score < 14 && kw) {
        triggered.push({ id: kw.id, titleFa: kw.titleFa, score });
      }
    }

    let answeredSum = 0;
    let answeredCount = 0;
    const items = dim.items.map((item) => {
      const raw = answers[item.id];
      const num = typeof raw === "number" && Number.isFinite(raw) ? raw : undefined;
      if (num != null) {
        answeredSum += item.reverse ? 10 - num : num;
        answeredCount += 1;
      }
      return {
        id: item.id,
        text: item.text,
        critical: item.critical,
        ...(num != null ? { answeredScore: num } : {}),
      };
    });

    const criticalItem = dim.items.find((it) => it.critical) ?? dim.items[0]!;
    const moduleScore = answeredCount > 0 ? round1((answeredSum / answeredCount) * 2) : null;

    return {
      dimensionId: dim.id,
      titleFa: dim.titleFa,
      summaryFa: dim.summaryFa,
      priorityIndex: round1(priorityIndex),
      triggeredByKeywords: triggered.sort((a, b) => a.score - b.score),
      criticalItemId: criticalItem.id,
      items,
      moduleScore,
    };
  });

  return scoredDims
    .sort((a, b) => b.priorityIndex - a.priorityIndex)
    .slice(0, Math.max(1, Math.min(9, topCount)));
}

/**
 * تولید خودکار «برگهٔ ۱ صفحه‌ای حل مسئلهٔ A3 (Shook, 2008 — S051) و کارت آزمون PDSA (Taylor et al., 2014 — S022)»
 * برای بحرانی‌ترین گلوگاه کسب‌وکار.
 */
export function buildA3ActionSheet(params: {
  bottleneckLayerId: string;
  bottleneckLayerTitleFa: string;
  bottleneckLayerScore: number;
  allKeywords: LayerKeyword[];
  bottleneckKeywords: LayerKeyword[];
  ontology?: OntologyDiagnosisSummary;
  contextProfile?: BusinessContextProfile;
}): A3ActionSheet {
  const {
    bottleneckLayerId,
    bottleneckLayerTitleFa,
    bottleneckLayerScore,
    allKeywords,
    bottleneckKeywords,
    ontology,
    contextProfile,
  } = params;

  const primaryKw =
    bottleneckKeywords[0] ??
    [...allKeywords].sort(
      (a, b) => (b.contextWeightedDeficit ?? 0) - (a.contextWeightedDeficit ?? 0),
    )[0]!;

  const weakestSubs = (primaryKw?.scoredSubKeywords ?? []).slice(0, 2);
  const subSummaryFa =
    weakestSubs.length > 0
      ? weakestSubs.map((s) => `«${s.titleFa}» (${s.score}/۲۰)`).join(" و ")
      : `زیرشاخه‌های اجرایی «${primaryKw?.titleFa ?? ""}»`;

  const ownerRoleFa =
    contextProfile?.teamSize === "solo"
      ? "مالک (سازمان تک‌نفره)"
      : (primaryKw?.ownerRoleFa ?? "مدیرعامل و مالک فرایند");

  const horizonFa = primaryKw?.horizonFa ?? "کوتاه‌مدت (چرخه‌های ۱۴ روزه در افق ۳۰ روز)";

  // ۱. پیش‌زمینه (Background)
  const stageContextFa = contextProfile
    ? `با توجه به جایگاه کسب‌وکار در «${contextProfile.growthStageTitleFa}» (${contextProfile.growthStageCrisisFa})، `
    : "";
  const backgroundFa = `${stageContextFa}تحلیل کمّی ۵ لایه نشان می‌دهد که اصلی‌ترین گلوگاه ساختاری در «${bottleneckLayerTitleFa}» (نمرهٔ ${bottleneckLayerScore} از ۲۰) و به‌طور مشخص در کلیدواژهٔ «${primaryKw?.titleFa ?? ""}» (نمرهٔ ${primaryKw?.score ?? 0} از ۲۰) متمرکز است. ${primaryKw?.whyFa ?? ""}`.trim();

  // ۲. وضعیت موجود کمی‌شده (Quantified Current Condition — AS-IS)
  const currentConditionFa = `${primaryKw?.asIsWeakFa ?? primaryKw?.asIsGrowingFa ?? ""} بیشترین شکاف عملیاتی در زیرکلیدواژه‌های ${subSummaryFa} مشاهده می‌شود.`.trim();

  // ۳. تحلیل ریشه‌ای چندسطحی بدون مقصرانگاری فردی (Rummler-Brache S052 + Peerally et al. S054)
  const orgLevel = ontology?.rummlerBreakdown.find((l) => l.level === "organization");
  const procLevel = ontology?.rummlerBreakdown.find((l) => l.level === "process_whitespace");
  const jobLevel = ontology?.rummlerBreakdown.find((l) => l.level === "job_performer");

  const multiLevelRootCause = {
    organizationRootFa: `سطح کلان سازمان (${orgLevel?.avgScore ?? 0}/۲۰): ${
      orgLevel && orgLevel.avgScore < 12
        ? `ضعف در «${orgLevel.weakestKeywordTitleFa}» باعث شده مرز منابع، اولویت‌ها و قواعد کلان به لایه‌های اجرایی منتقل نشود.`
        : "جهت‌گیری کلان تعریف شده اما به معیارهای عملیاتی در لایهٔ گلوگاه ترجمه نشده است."
    }`,
    processRootFa: `سطح فرایند و فضای خالی بین نقش‌ها (${procLevel?.avgScore ?? 0}/۲۰): ${
      procLevel && procLevel.avgScore < 12
        ? `نبود استاندارد و چک‌لیست تحویل در «${procLevel.weakestKeywordTitleFa}» موجب دوباره‌کاری و ارجاع تصمیم‌ها به بالا می‌شود.`
        : `عدم اتصال حلقهٔ بازخورد به «${primaryKw?.titleFa ?? ""}» مانع از تثبیت روال شده است.`
    }`,
    performerRootFa: `سطح شغل و مجری — بدون سرزنش فردی (${jobLevel?.avgScore ?? 0}/۲۰): خطا یا توقف مجریان ناشی از کم‌کاری فردی نیست، بلکه نتیجهٔ ابهام در حدود اختیار، نبود چک‌لیست پذیرش و تمرین نشدن سناریوهای پرتکرار در «${jobLevel?.weakestKeywordTitleFa ?? primaryKw?.titleFa ?? ""}» است (S049, S054).`,
  };

  // ۴. وضعیت هدف ۳۰ روزه (Target Condition)
  const targetScore = Math.min(20, Math.max(14, round1((primaryKw?.score ?? 6) + 6)));
  const targetCondition30DayFa = `${primaryKw?.toBeFa ?? ""} هدف کمّی ۳۰ روزه: ارتقای امتیاز «${primaryKw?.titleFa ?? ""}» از ${primaryKw?.score ?? 0}/۲۰ به حداقل ${targetScore}/۲۰ و اجرای پایدارِ اقدام «${primaryKw?.actionStepFa ?? ""}» در حداقل ۸۰٪ موارد بدون مداخلهٔ اضطراری مالک.`;

  // ۵. کارت آزمون علمی ۱۴ روزهٔ PDSA (Taylor et al., 2014 — S022)
  const isSolo = contextProfile?.teamSize === "solo";
  const scopeSampleFa = isSolo
    ? "۵ سفارش یا پروندهٔ بعدی مشتری در ۱۴ روز آینده"
    : "۱ فرایند گلوگاهی در ۱ واحد یا روی ۵ پروندهٔ واقعی طی ۱۴ روز آینده (نه کل سازمان به‌صورت یک‌جا)";

  const pdsaCard: PdsaTestCard = {
    cycleDurationDays: 14,
    planHypothesisFa: `فرضیه و پیش‌بینی صریح (Plan): اگر اقدام «${primaryKw?.actionStepFa ?? primaryKw?.titleFa ?? ""}» را برای «${scopeSampleFa}» مستقر کنیم، پیش‌بینی می‌کنیم زمان توقف، خطای تحویل یا ارجاع به مالک در این محدوده حداقل ۴۰٪ کاهش یابد.`,
    doSmallScaleFa: `اجرای آزمایشی در مقیاس کوچک (Do): اجرای تغییر صرفاً روی ${scopeSampleFa} به مسئولیت «${ownerRoleFa}» و ثبت روزانهٔ موارد استثنا یا اصطکاک حین اجرا.`,
    studyMetricFa: `بررسی داده و مقایسه با پیش‌بینی (Study): در روز چهاردهم، تعداد دفعات اجرای موفقِ روال جدید، تعداد ارجاع به مدیر و انحراف از پیش‌بینی اولیه را با عدد خط پایه مقایسه کرده و علت انحراف‌ها را یادداشت کنید.`,
    actDecisionRuleFa: `قاعدهٔ تصمیم‌گیری (Act): اگر نرخ پایبندی و اثربخشی بالای ۸۰٪ بود ⟵ استانداردسازی و تعمیم به کل واحد (Adopt)؛ اگر بین ۵۰٪ تا ۸۰٪ بود ⟵ اصلاح گام مبهم و اجرای چرخهٔ دوم ۱۴ روزه (Adapt)؛ اگر زیر ۵۰٪ بود ⟵ بازنگری در فرضیهٔ ریشه‌ای (Abandon/Re-design).`,
    fidelityChecklistFa: [
      "آیا پیش‌بینی کمّی پیش از شروع تست مکتوب شده است؟ (Prediction-Based Test)",
      "آیا تست در مقیاس کوچک (۱ فرایند / ۱۴ روز) آغاز شده است؟ (Small-Scale Testing)",
      "آیا داده‌ها در طول ۱۴ روز ثبت شده‌اند نه صرفاً قضاوت ذهنی در پایان؟ (Data Over Time)",
      "آیا خروجی مرحلهٔ Act ورودی چرخهٔ بعدی PDSA را مشخص کرده است؟ (Iterative Linkage)",
    ],
  };

  const supportingSourceIds = Array.from(
    new Set(["S051", "S022", "S043", "S052", "S054", ...(primaryKw?.sourceIds ?? [])]),
  );

  return {
    titleFa: `برگهٔ ۱ صفحه‌ای حل مسئلهٔ A3 و کارت آزمون PDSA — «${primaryKw?.titleFa ?? bottleneckLayerTitleFa}»`,
    bottleneckLayerId,
    bottleneckLayerTitleFa,
    primaryKeywordId: primaryKw?.id ?? "",
    primaryKeywordTitleFa: primaryKw?.titleFa ?? "",
    ownerRoleFa,
    horizonFa,
    backgroundFa,
    currentConditionFa,
    multiLevelRootCause,
    targetCondition30DayFa,
    pdsaCard,
    supportingSourceIds,
  };
}

export function buildAdaptiveDeepDiveSummary(params: {
  bottleneckLayerId: string;
  bottleneckLayerTitleFa: string;
  bottleneckLayerScore: number;
  allKeywords: LayerKeyword[];
  bottleneckKeywords: LayerKeyword[];
  answers: Record<string, number | string>;
  ontology?: OntologyDiagnosisSummary;
  contextProfile?: BusinessContextProfile;
}): AdaptiveDeepDiveSummary {
  const recommendedModules = selectAdaptiveDeepDiveModules(params.allKeywords, params.answers, 2);
  const a3Sheet = buildA3ActionSheet(params);

  return {
    totalBankItemsCount: 89, // 20 FL + 15 SCR + 54 DIAG
    screeningItemsCount: SCR_ITEMS.length,
    diagDimensionsCount: DIAG_DIMENSIONS.length,
    diagItemsCount: DIAG_DIMENSIONS.reduce((sum, d) => sum + d.items.length, 0),
    recommendedModules,
    a3Sheet,
  };
}
