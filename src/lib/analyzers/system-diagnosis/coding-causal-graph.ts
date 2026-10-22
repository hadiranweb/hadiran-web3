/**
 * استاندارد یکپارچهٔ «کدینگ چندمحوری» (HADIRAN-CODING-2.0) و موتور گراف علّی «مؤثرها و متأثرها»
 * (DEMATEL + ISM + MICMAC Causal Influencer/Influenced Engine).
 *
 * پشتوانهٔ علمی و ریاضی:
 * - روش DEMATEL برای محاسبهٔ ماتریس اثرات کل (مستقیم + غیرمستقیم) T = X(I - X)^(-1)،
 *   توان اثرگذاری (Driving Power D_i — مؤثریت)، توان اثرپذیری (Dependence Power R_i — متأثریت)،
 *   مرکزیت سیستمی (Prominence D_i + R_i) و شاخص خالص علیت (Net Cause-Effect D_i - R_i)
 * - مدلسازی ساختاری تفسیری (ISM) و ماتریس چهارربعی MICMAC (Duperrin & Godet, 1973):
 *   تفکیک گره‌ها به ۴ طبقه: پیشران مستقل (Independent Driver)، اهرم پیوندی (Linkage Lever)،
 *   خروجی وابسته/معلول (Dependent Outcome) و موضعی (Autonomous)
 * - مدل بلوغ فرایند و سازمان (Hammer, 2007 — PEMM) و سه سطح عملکرد (Rummler & Brache, 1995/2012 — S052)
 */

import type { BusinessContextProfile } from "./context-modulation";
import type { LayerKeyword } from "./interpretation";

export type EntityAxisCode =
  | "DOM" // Domain (دامنهٔ ارزیابی)
  | "CTX" // Business Context (متغیرهای زمینهٔ کسب‌وکار)
  | "LYR" // Diagnostic Layer (لایهٔ پنج‌گانهٔ سیستم)
  | "KW" // Primary Keyword (۱۵ کلیدواژهٔ اصلی)
  | "SKW" // Sub-Keyword (۷۵ زیرکلیدواژهٔ عملیاتی)
  | "ITM" // Assessment Item (۸۹ گویهٔ کسب‌وکار + ۱۲ گویهٔ الگوی ذهنی)
  | "DIM" // Deep-Dive Dimension (۹ بُعد عارضه‌یابی تفصیلی)
  | "PRC" // Solopreneur Core Process (۹ فرایند هستهٔ سازمان تک‌نفره C1..C9)
  | "VLT" // Research Vault Concept (مفاهیم گراف دانشی)
  | "SRC"; // Research Source (منابع علمی S001..S055)

export type MicmacQuadrant =
  | "independent_driver" // مؤثر مستقل / پیشران بنیادین (D بالا، R پایین)
  | "linkage_lever" // اهرم پیوندی / گلوگاه میانی حساس (D بالا، R بالا)
  | "dependent_outcome" // متأثر وابسته / خروجی و معلول (D پایین، R بالا)
  | "autonomous"; // موضعی (D پایین، R پایین)

export type CausalEdgeType =
  | "prerequisite" // پیش‌نیاز ساختاری رو به جلو (Feed-Forward Enabler)
  | "cybernetic_feedback" // حلقهٔ بازخورد اصلاحی (Cybernetic Feedback Loop)
  | "reinforcing"; // حلقهٔ تقویتی دوجانبه (Reinforcing Loop)

export type CausalKeywordEdge = {
  id: string;
  /** گره مؤثر (Influencer / Cause) */
  fromKeywordId: string;
  fromCanonicalCode: string;
  /** گره متأثر (Influenced / Effect) */
  toKeywordId: string;
  toCanonicalCode: string;
  /** شدت اثر مستقیم در مقیاس ۰ تا ۱ (در DEMATEL معادل مقیاس ۰ تا ۴ تقسیم بر ۴) */
  weight: number;
  edgeType: CausalEdgeType;
  mechanismFa: string;
  sourceIds: string[];
};

export type KeywordCausalProfile = {
  keywordId: string;
  canonicalCode: string;
  layerCanonicalCode: string;
  titleFa: string;
  /** توان اثرگذاری کل (مستقیم + غیرمستقیم): مجموع سطر در ماتریس T */
  drivingPower: number;
  /** توان اثرپذیری کل (مستقیم + غیرمستقیم): مجموع ستون در ماتریس T */
  dependencePower: number;
  /** برجستگی و مرکزیت سیستمی (D + R) */
  prominence: number;
  /** شاخص خالص علیت (D - R): مثبت = مؤثر خالص (علت)، منفی = متأثر خالص (معلول) */
  netCauseEffect: number;
  causalRole: "cause_driver" | "effect_symptom";
   causalRoleLabelFa: string;
  micmacQuadrant: MicmacQuadrant;
  micmacLabelFa: string;
  /** سطح در سلسله‌مراتب علیّت ISM (۱ = بنیادی‌ترین مؤثرها در قاعدهٔ هرم، ۵ = نهایی‌ترین متأثرها در رأس هرم) */
  ismLevel: 1 | 2 | 3 | 4 | 5;
  /** فهرست کلیدواژه‌هایی که مستقیماً بر این کلیدواژه اثر می‌گذارند (مؤثرهای مستقیم این گره) */
  directInfluencers: {
    keywordId: string;
    canonicalCode: string;
    weight: number;
    edgeType: CausalEdgeType;
    mechanismFa: string;
  }[];
  /** فهرست کلیدواژه‌هایی که مستقیماً از این کلیدواژه اثر می‌پذیرند (متأثرهای مستقیم این گره) */
  directInfluenced: {
    keywordId: string;
    canonicalCode: string;
    weight: number;
    edgeType: CausalEdgeType;
    mechanismFa: string;
  }[];
};

export type ActiveNodeCausalLink = {
  keywordId: string;
  canonicalCode: string;
  titleFa: string;
  score: number;
  directWeight: number;
  totalEffectWeight: number;
  /** سهم این گره بالادستی در ایجاد شکاف فعلی، یا شدت آسیب ارسالی به گره پایین‌دستی */
  propagatedDeficitImpact: number;
  mechanismFa: string;
};

export type RespondentKeywordCausalNode = {
  keywordId: string;
  canonicalCode: string;
  titleFa: string;
  score: number;
  bandId: "weak" | "growing" | "strong";
  drivingPower: number;
  dependencePower: number;
  netCauseEffect: number;
  causalRole: "cause_driver" | "effect_symptom";
  causalRoleLabelFa: string;
  micmacQuadrant: MicmacQuadrant;
  micmacLabelFa: string;
  ismLevel: 1 | 2 | 3 | 4 | 5;
  /** امتیاز اهرم ریشه‌ای: ترکیب شکاف زمینه‌مندِ خود گره + بار کسری منتقل‌شده به متأثرهای پایین‌دستی */
  rootCauseLeverageScore: number;
  /** مؤثرهای بالادستیِ این گره (چرا این گره ضعیف شده است؟) */
  upstreamInfluencers: ActiveNodeCausalLink[];
  /** متأثرهای پایین‌دستیِ این گره (ضعف این گره چه چیزهای دیگری را قفل کرده است؟) */
  downstreamInfluenced: ActiveNodeCausalLink[];
};

export type CausalInterventionWave = {
  waveNumber: 1 | 2 | 3;
  titleFa: string;
  rationaleFa: string;
  keywords: {
    keywordId: string;
    canonicalCode: string;
    titleFa: string;
    score: number;
    micmacLabelFa: string;
    rootCauseLeverageScore: number;
    actionStepFa: string;
    unlockedDownstreamTitlesFa: string[];
  }[];
};

export type RespondentCausalGraphSummary = {
  codingVersion: string;
  /** کلیدواژهٔ دارای بالاترین امتیاز اهرم ریشه‌ای (اصلی‌ترین مؤثرِ نیازمند مداخله) */
  primaryRootCauseDriver: RespondentKeywordCausalNode;
  /** هشدار تلهٔ معلول‌درمانی: اگر گلوگاه ظاهری یک «متأثر پایین‌دستی» باشد که مؤثرهای بالادستی‌اش ضعیف‌اند */
  symptomTrapWarningFa: string | null;
  /** نقشهٔ راه ۳ موجی مداخله بر اساس توالی علّی (مؤثر ⟵ اهرم پیوندی ⟵ متأثر) */
  interventionWaves: CausalInterventionWave[];
  /** پروفایل علّی کامل هر ۱۵ کلیدواژه برای این پاسخ‌دهنده */
  nodes: RespondentKeywordCausalNode[];
};

export const CODING_STANDARD_VERSION = "HADIRAN-CODING-2.0.0";

/**
 * ۱. جدول نگاشت استاندارد کدینگ لایه‌ها و کلیدواژه‌ها (Canonical Code Registry)
 */
export const LAYER_CANONICAL_CODES: Record<string, string> = {
  "layer-foundation": "LYR.L1",
  "layer-architecture": "LYR.L2",
  "layer-flow": "LYR.L3",
  "layer-monitor": "LYR.L4",
  "layer-scale": "LYR.L5",
};

export const KEYWORD_CANONICAL_CODES: Record<string, string> = {
  "L1-K1": "KW.L1.K1",
  "L1-K2": "KW.L1.K2",
  "L1-K3": "KW.L1.K3",
  "L2-K1": "KW.L2.K1",
  "L2-K2": "KW.L2.K2",
  "L2-K3": "KW.L2.K3",
  "L3-K1": "KW.L3.K1",
  "L3-K2": "KW.L3.K2",
  "L3-K3": "KW.L3.K3",
  "L4-K1": "KW.L4.K1",
  "L4-K2": "KW.L4.K2",
  "L4-K3": "KW.L4.K3",
  "L5-K1": "KW.L5.K1",
  "L5-K2": "KW.L5.K2",
  "L5-K3": "KW.L5.K3",
};

export const KEYWORD_ISM_LEVELS: Record<string, 1 | 2 | 3 | 4 | 5> = {
  "L1-K1": 1, // قاعدهٔ هرم علّی: شفافیت مقصد و اهداف راهبردی
  "L1-K2": 1, // قاعدهٔ هرم علّی: تفکیک حساب و انضباط مالی پایه
  "L2-K1": 2, // سطح ۲: ترسیم نقشهٔ کلان زنجیرهٔ ارزش مشتری
  "L2-K2": 2, // سطح ۲: تدوین دستورالعمل‌های گام‌به‌گام (SOP)
  "L2-K3": 2, // سطح ۲: شفاف‌سازی مرز نقش‌ها و چک‌لیست تحویل بین‌واحدی
  "L3-K1": 3, // سطح ۳: ماتریس حدود اختیارات تصمیم‌گیری پرسنل
  "L3-K2": 3, // سطح ۳: آموزش مبتنی بر سناریو و انتقال دانش ضمنی
  "L4-K1": 3, // سطح ۳: داشبورد شاخص‌های کلیدی عملکرد (KPI)
  "L4-K2": 4, // سطح ۴: ریتم جلسات منضبط هفتگی
  "L4-K3": 4, // سطح ۴: چرخهٔ حل مسئلهٔ ریشه‌ای (RCA / A3) و اصلاح باگ‌های فرآیندی
  "L1-K3": 4, // سطح ۴: آزادسازی واقعی زمان مالک از تلهٔ روزمرگی (محصولِ معماری + تفویض اختیار)
  "L5-K3": 4, // سطح ۴: ظرفیت زیرسیستم‌ها و معماری ماژولار
  "L3-K3": 5, // سطح ۵ (خروجی وابسته): تداوم کار در غیاب ۴ هفته‌ای مالک
  "L5-K2": 5, // سطح ۵ (خروجی وابسته): پایداری اقتصاد واحد در مقیاس بالا
  "L5-K1": 5, // سطح ۵ (خروجی وابسته): پکیج کامل فرانچایز و تکثیر شعبهٔ جدید
};

export const DOMAIN_CANONICAL_CODES: Record<string, string> = {
  "system-diagnosis": "DOM.SYSTEM_DIAGNOSIS",
  "mindset-gate": "DOM.MINDSET_GATE",
};

export const DIMENSION_CANONICAL_CODES: Record<string, string> = {
  d1_decision: "DIM.D1",
  d2_role: "DIM.D2",
  d3_sop: "DIM.D3",
  d4_finance: "DIM.D4",
  d5_kpi: "DIM.D5",
  d6_people: "DIM.D6",
  d7_customer: "DIM.D7",
  d8_problem: "DIM.D8",
  d9_scale: "DIM.D9",
};

/**
 * تبدیل هر شناسهٔ قدیم (Legacy ID) به کد استاندارد سلسله‌مراتبی (Canonical Code)
 */
export function toCanonicalCode(legacyId: string): string {
  if (DOMAIN_CANONICAL_CODES[legacyId]) return DOMAIN_CANONICAL_CODES[legacyId]!;
  if (DIMENSION_CANONICAL_CODES[legacyId]) return DIMENSION_CANONICAL_CODES[legacyId]!;
  if (KEYWORD_CANONICAL_CODES[legacyId]) return KEYWORD_CANONICAL_CODES[legacyId]!;
  if (LAYER_CANONICAL_CODES[legacyId]) return LAYER_CANONICAL_CODES[legacyId]!;

  // Layer alias: layer-l1 -> LYR.L1
  const lyrAlias = legacyId.match(/^layer-l([1-5])$/i);
  if (lyrAlias) return `LYR.L${lyrAlias[1]}`;

  // Sub-keywords: L1-K1-S1 -> SKW.L1.K1.S1
  const skwMatch = legacyId.match(/^L(\d)-K(\d)-S(\d)$/);
  if (skwMatch) return `SKW.L${skwMatch[1]}.K${skwMatch[2]}.S${skwMatch[3]}`;

  // Context items: BIZ.1 -> CTX.BIZ.01
  const bizMatch = legacyId.match(/^BIZ\.(\d+)$/);
  if (bizMatch) return `CTX.BIZ.${bizMatch[1]!.padStart(2, "0")}`;

  // Five-Layer items: FL.L1.Q1 -> ITM.FL.L1.Q1
  if (legacyId.startsWith("FL.")) return `ITM.${legacyId}`;

  // Screening items: SCR.s01 -> ITM.SCR.S01
  const scrMatch = legacyId.match(/^SCR\.s(\d+)$/i);
  if (scrMatch) return `ITM.SCR.S${scrMatch[1]!.padStart(2, "0")}`;

  // Deep-Dive items: DIAG.d101 -> ITM.DIAG.D1.01
  const diagMatch = legacyId.match(/^DIAG\.d(\d)(\d{2})$/i);
  if (diagMatch) return `ITM.DIAG.D${diagMatch[1]}.${diagMatch[2]}`;

  // Mindset items: MG.A1 -> ITM.MND.A1
  if (legacyId.startsWith("MG.")) return `ITM.MND.${legacyId.slice(3)}`;

  // Processes: C1..C9 -> PRC.C1..PRC.C9
  if (/^C[1-9]$/.test(legacyId)) return `PRC.${legacyId}`;

  // Vault concepts: V01..V99 -> VLT.V01..VLT.V99
  if (/^V\d{2}$/.test(legacyId)) return `VLT.${legacyId}`;

  // Sources: S001..S055 -> SRC.S001..SRC.S055
  if (/^S\d{3}$/.test(legacyId)) return `SRC.${legacyId}`;

  return legacyId;
}

/**
 * تبدیل کد استاندارد (Canonical Code) به شناسهٔ قدیم (Legacy ID) برای سازگاری کامل با دیتابیس
 */
export function fromCanonicalCode(canonicalCode: string): string {
  for (const [legacy, canon] of Object.entries(DOMAIN_CANONICAL_CODES)) {
    if (canon === canonicalCode) return legacy;
  }
  for (const [legacy, canon] of Object.entries(DIMENSION_CANONICAL_CODES)) {
    if (canon === canonicalCode) return legacy;
  }
  for (const [legacy, canon] of Object.entries(KEYWORD_CANONICAL_CODES)) {
    if (canon === canonicalCode) return legacy;
  }
  for (const [legacy, canon] of Object.entries(LAYER_CANONICAL_CODES)) {
    if (canon === canonicalCode) return legacy;
  }
  const skwMatch = canonicalCode.match(/^SKW\.L(\d)\.K(\d)\.S(\d)$/);
  if (skwMatch) return `L${skwMatch[1]}-K${skwMatch[2]}-S${skwMatch[3]}`;

  const ctxMatch = canonicalCode.match(/^CTX\.BIZ\.0?(\d+)$/);
  if (ctxMatch) return `BIZ.${Number(ctxMatch[1])}`;

  if (canonicalCode.startsWith("ITM.FL.")) return canonicalCode.slice(4);

  const scrMatch = canonicalCode.match(/^ITM\.SCR\.S(\d+)$/i);
  if (scrMatch) return `SCR.s${scrMatch[1]!.padStart(2, "0")}`;

  const diagMatch = canonicalCode.match(/^ITM\.DIAG\.D(\d)\.(\d{2})$/i);
  if (diagMatch) return `DIAG.d${diagMatch[1]}${diagMatch[2]}`;

  if (canonicalCode.startsWith("ITM.MND.")) return `MG.${canonicalCode.slice(8)}`;
  if (canonicalCode.startsWith("PRC.C")) return canonicalCode.slice(4);
  if (canonicalCode.startsWith("VLT.V")) return canonicalCode.slice(4);
  if (canonicalCode.startsWith("SRC.S")) return canonicalCode.slice(4);

  return canonicalCode;
}

/**
 * ۲. گراف علّی مؤثرها و متأثرها میان ۱۵ کلیدواژهٔ اصلی (CAUSAL_KEYWORD_EDGES)
 * شامل یال‌های پیش‌نیاز رو به جلو (prerequisite) و حلقه‌های بازخورد سایبرنتیک (cybernetic_feedback).
 */
type RawCausalEdge = {
  from: string;
  to: string;
  weight: number;
  edgeType: CausalEdgeType;
  mechanismFa: string;
  sourceIds: string[];
};

const RAW_CAUSAL_EDGES: RawCausalEdge[] = [
  // --- اثرگذاری‌های L1-K1 (شفافیت مقصد و اهداف راهبردی) ---
  {
    from: "L1-K1",
    to: "L2-K1",
    weight: 0.85,
    edgeType: "prerequisite",
    mechanismFa: "شفافیت مقصد ۱ تا ۳ ساله تعیین می‌کند زنجیرهٔ ارزش مشتری بر کدام محصول و بازار متمرکز شود.",
    sourceIds: ["S036", "S052", "S055"],
  },
  {
    from: "L1-K1",
    to: "L2-K3",
    weight: 0.70,
    edgeType: "prerequisite",
    mechanismFa: "بدون هم‌راستایی راهبردی، واحدها به سیلوهای جزیره‌ای با اهداف متضاد تبدیل می‌شوند.",
    sourceIds: ["S052", "S055"],
  },
  {
    from: "L1-K1",
    to: "L4-K1",
    weight: 0.85,
    edgeType: "prerequisite",
    mechanismFa: "شاخص‌های کلیدی عملکرد (KPI) تنها زمانی معنادارند که از اهداف راهبردی مکتوب مشتق شده باشند (جلوگیری از انفکاک وسیله از هدف).",
    sourceIds: ["S028", "S052"],
  },
  {
    from: "L1-K1",
    to: "L5-K1",
    weight: 0.65,
    edgeType: "prerequisite",
    mechanismFa: "تکثیر و فرانچایز نیازمند وضوح مدل کسب‌وکار و جایگاه رقابتی است.",
    sourceIds: ["S045", "S047"],
  },
  {
    from: "L1-K1",
    to: "L5-K3",
    weight: 0.60,
    edgeType: "prerequisite",
    mechanismFa: "برنامه‌ریزی ظرفیت زیرسیستم‌ها نیازمند افق رشد مشخص است.",
    sourceIds: ["S045", "S055"],
  },

  // --- اثرگذاری‌های L1-K2 (تفکیک حساب و انضباط مالی) ---
  {
    from: "L1-K2",
    to: "L4-K1",
    weight: 0.75,
    edgeType: "prerequisite",
    mechanismFa: "بدون تفکیک حساب شخصی و شرکت، اعداد مالی داشبورد مدیریتی مخدوش و غیرقابل‌اتکا خواهند بود.",
    sourceIds: ["S023", "S036"],
  },
  {
    from: "L1-K2",
    to: "L5-K2",
    weight: 0.90,
    edgeType: "prerequisite",
    mechanismFa: "محاسبهٔ دقیق بهای تمام‌شده و حاشیهٔ سود واحد (Unit Economics) مستقیماً به تفکیک هزینه‌ها و انضباط مالی وابسته است.",
    sourceIds: ["S023", "S036", "S045"],
  },
  {
    from: "L1-K2",
    to: "L5-K3",
    weight: 0.55,
    edgeType: "prerequisite",
    mechanismFa: "حفظ نقدینگی عملیاتی و عدم برداشت‌های پیش‌بینی‌نشده، پیش‌نیاز سرمایه‌گذاری در زیرساخت مقیاس‌پذیر است.",
    sourceIds: ["S023", "S036"],
  },

  // --- اثرگذاری‌های L2-K1 (نقشهٔ کلان زنجیرهٔ ارزش مشتری) ---
  {
    from: "L2-K1",
    to: "L2-K2",
    weight: 0.85,
    edgeType: "prerequisite",
    mechanismFa: "ابتدا باید نقشهٔ انتهابه‌انتهای مسیر مشتری (AS-IS) ترسیم شود تا مشخص گردد کدام گام‌ها نیاز به دستورالعمل گام‌به‌گام (SOP) دارند.",
    sourceIds: ["S025", "S039", "S052"],
  },
  {
    from: "L2-K1",
    to: "L2-K3",
    weight: 0.80,
    edgeType: "prerequisite",
    mechanismFa: "نقشهٔ زنجیرهٔ ارزش، مرزهای تحویل کار بین نقش‌ها و واحدها (White Space) را آشکار می‌کند.",
    sourceIds: ["S039", "S052", "S053"],
  },
  {
    from: "L2-K1",
    to: "L5-K1",
    weight: 0.70,
    edgeType: "prerequisite",
    mechanismFa: "نقشهٔ کلان ارزش، ستون فقرات کتابچهٔ عملیات تکثیر و فرانچایز است.",
    sourceIds: ["S046", "S047"],
  },
  {
    from: "L2-K1",
    to: "L5-K2",
    weight: 0.65,
    edgeType: "prerequisite",
    mechanismFa: "شفافیت گام‌های سفر مشتری امکان شناسایی گلوگاه‌های هزینه‌زا و کنترل زمان تحویل را فراهم می‌کند.",
    sourceIds: ["S045", "S053"],
  },

  // --- اثرگذاری‌های L2-K2 (تدوین دستورالعمل‌های اجرایی SOP) ---
  {
    from: "L2-K2",
    to: "L3-K1",
    weight: 0.80,
    edgeType: "prerequisite",
    mechanismFa: "بدون وجود دستورالعمل و استاندارد مکتوب، تفویض اختیار به پرسنل به هرج‌ومرج یا تصمیم‌های سلیقه‌ای منجر می‌شود.",
    sourceIds: ["S039", "S040", "S041"],
  },
  {
    from: "L2-K2",
    to: "L3-K2",
    weight: 0.90,
    edgeType: "prerequisite",
    mechanismFa: "SOPها و چک‌لیست‌ها محتوای پایه برای آموزش نیروهای جدید و سناریوهای اجرایی هستند.",
    sourceIds: ["S031", "S032", "S042"],
  },
  {
    from: "L2-K2",
    to: "L3-K3",
    weight: 0.75,
    edgeType: "prerequisite",
    mechanismFa: "مستند بودن روال‌های پرتکرار شرط لازم برای عدم توقف کار در غیاب مالک است.",
    sourceIds: ["S038", "S044"],
  },
  {
    from: "L2-K2",
    to: "L4-K3",
    weight: 0.65,
    edgeType: "prerequisite",
    mechanismFa: "به قول ایشیکاوا و دمینگ، جایی که استاندارد مکتوبی وجود ندارد، تحلیل انحراف و اصلاح سیستم (CAPA) ناممکن است.",
    sourceIds: ["S049", "S050"],
  },
  {
    from: "L2-K2",
    to: "L5-K1",
    weight: 0.90,
    edgeType: "prerequisite",
    mechanismFa: "هستهٔ قابل تکثیر (Arrow Core) در فرانچایز مستقیماً از تجمیع SOPهای آزموده‌شده ساخته می‌شود.",
    sourceIds: ["S046", "S047"],
  },
  {
    from: "L2-K2",
    to: "L5-K2",
    weight: 0.65,
    edgeType: "prerequisite",
    mechanismFa: "استانداردسازی روش انجام کار، واریانس زمان و ضایعات تحویل خدمت به هر مشتری جدید را کاهش می‌دهد.",
    sourceIds: ["S045", "S050"],
  },

  // --- اثرگذاری‌های L2-K3 (شفاف‌سازی مرز نقش‌ها و نقاط تحویل بین‌واحدی) ---
  {
    from: "L2-K3",
    to: "L3-K1",
    weight: 0.85,
    edgeType: "prerequisite",
    mechanismFa: "تعیین مالک واحد برای هر خروجی (Single-Point Accountability)، پیش‌نیاز اعطای حق تصمیم‌گیری است.",
    sourceIds: ["S040", "S041", "S052"],
  },
  {
    from: "L2-K3",
    to: "L3-K3",
    weight: 0.75,
    edgeType: "prerequisite",
    mechanismFa: "وقتی چک‌لیست تحویل کار بین نقش‌ها روشن باشد، افراد برای هماهنگی‌های روزمره نیازی به مداخلهٔ مالک ندارند.",
    sourceIds: ["S038", "S052"],
  },
  {
    from: "L2-K3",
    to: "L4-K2",
    weight: 0.70,
    edgeType: "prerequisite",
    mechanismFa: "مشخص بودن مالک هر خروجی باعث می‌شود جلسات هفتگی از بحث‌های مبهم به پیگیری دقیق مسئولیت‌ها تبدیل شود.",
    sourceIds: ["S029", "S052"],
  },
  {
    from: "L2-K3",
    to: "L5-K3",
    weight: 0.75,
    edgeType: "prerequisite",
    mechanismFa: "مرزبندی ماژولار نقش‌ها و واحدها امکان افزایش ظرفیت هر زیرسیستم را بدون فروپاشی هماهنگی فراهم می‌کند.",
    sourceIds: ["S045", "S052", "S055"],
  },

  // --- اثرگذاری‌های L3-K1 (تعیین حدود اختیارات تصمیم‌گیری پرسنل) ---
  {
    from: "L3-K1",
    to: "L1-K3",
    weight: 0.90,
    edgeType: "cybernetic_feedback",
    mechanismFa: "آزاد شدن واقعی زمان مالک از تلهٔ روزمرگی (L1-K3) مستقیماً معلولِ استقرار ماتریس حدود اختیارات و توقف مراجعات خرد (L3-K1) است.",
    sourceIds: ["S038", "S040", "S041"],
  },
  {
    from: "L3-K1",
    to: "L3-K3",
    weight: 0.90,
    edgeType: "prerequisite",
    mechanismFa: "موفقیت در آزمون مرخصی ۴ هفته‌ای بدون اعطای اختیار تصمیم‌گیری در چارچوب سقف‌های مشخص امکان‌پذیر نیست.",
    sourceIds: ["S038", "S041"],
  },
  {
    from: "L3-K1",
    to: "L5-K1",
    weight: 0.70,
    edgeType: "prerequisite",
    mechanismFa: "ادارهٔ شعبهٔ جدید توسط مدیر میانی نیازمند چارچوب اختیارات تصمیم‌گیری آزموده‌شده است.",
    sourceIds: ["S046", "S047"],
  },

  // --- اثرگذاری‌های L3-K2 (آموزش مبتنی بر سناریو و انتقال دانش) ---
  {
    from: "L3-K2",
    to: "L3-K3",
    weight: 0.85,
    edgeType: "prerequisite",
    mechanismFa: "تمرین سناریوهای پرتکرار و استثناها با تیم، وابستگی به حضور لحظه‌به‌لحظهٔ مالک را از بین می‌برد.",
    sourceIds: ["S031", "S032", "S044"],
  },
  {
    from: "L3-K2",
    to: "L1-K3",
    weight: 0.75,
    edgeType: "cybernetic_feedback",
    mechanismFa: "کاهش وابستگی نیروی جدید به آموزش شفاهی مالک، زمان رهبری را آزاد می‌کند.",
    sourceIds: ["S032", "S038"],
  },
  {
    from: "L3-K2",
    to: "L5-K1",
    weight: 0.80,
    edgeType: "prerequisite",
    mechanismFa: "سیستم آموزش تکرارپذیر یکی از ۴ ستون اصلی فرانچایز و تکثیر (IFA — S046) است.",
    sourceIds: ["S044", "S046", "S047"],
  },

  // --- اثرگذاری‌های L4-K1 (داشبورد شاخص‌های کلیدی عملکرد KPI) ---
  {
    from: "L4-K1",
    to: "L4-K2",
    weight: 0.85,
    edgeType: "prerequisite",
    mechanismFa: "جلسات هفتگی بدون داشبورد عددی به گفت‌وگوهای سلیقه‌ای و خاطره‌گویی تبدیل می‌شوند.",
    sourceIds: ["S028", "S029", "S043"],
  },
  {
    from: "L4-K1",
    to: "L4-K3",
    weight: 0.80,
    edgeType: "prerequisite",
    mechanismFa: "تشخیص زودهنگام انحراف و فعال شدن چرخهٔ حل مسئلهٔ A3 نیازمند پایش مستمر شاخص‌های پیش‌نگر و پس‌نگر است.",
    sourceIds: ["S043", "S048", "S051"],
  },
  {
    from: "L4-K1",
    to: "L3-K3",
    weight: 0.65,
    edgeType: "prerequisite",
    mechanismFa: "وجود داشبورد کنترلی به مالک اجازه می‌دهد در زمان غیاب فیزیکی، سلامت سیستم را از راه دور رصد کند.",
    sourceIds: ["S028", "S043"],
  },
  {
    from: "L4-K1",
    to: "L5-K2",
    weight: 0.75,
    edgeType: "prerequisite",
    mechanismFa: "پایش مستمر اقتصاد واحد نیازمند رصد هفتگی شاخص‌های هزینهٔ جذب، زمان تحویل و حاشیهٔ سود است.",
    sourceIds: ["S023", "S028", "S045"],
  },

  // --- اثرگذاری‌های L4-K2 (ریتم جلسات منضبط هفتگی) ---
  {
    from: "L4-K2",
    to: "L4-K3",
    weight: 0.75,
    edgeType: "prerequisite",
    mechanismFa: "ریتم جلسات هفتگی، ظرف زمانی ثابتی برای مرور برگه‌های A3 و پیگیری بسته شدن اقدامات اصلاحی ایجاد می‌کند.",
    sourceIds: ["S029", "S048", "S051"],
  },
  {
    from: "L4-K2",
    to: "L3-K3",
    weight: 0.60,
    edgeType: "prerequisite",
    mechanismFa: "جلسات هماهنگی منظم تیمی، هم‌راستایی افقی واحدها را بدون نیاز به دخالت روزانهٔ مالک حفظ می‌کند.",
    sourceIds: ["S029", "S052"],
  },

  // --- اثرگذاری‌های L4-K3 (سیستم بازخورد، حل مسئلهٔ A3 و اصلاح باگ‌های فرآیندی) ---
  {
    from: "L4-K3",
    to: "L2-K2",
    weight: 0.75,
    edgeType: "cybernetic_feedback",
    mechanismFa: "حلقهٔ بازخورد PDSA/A3 تضمین می‌کند که هر خطای ریشه‌یابی‌شده به به‌روزرسانی دستورالعمل‌ها (SOP) منجر شود و اسناد زنده بمانند.",
    sourceIds: ["S022", "S049", "S050", "S051"],
  },
  {
    from: "L4-K3",
    to: "L5-K2",
    weight: 0.70,
    edgeType: "prerequisite",
    mechanismFa: "حذف سیستماتیک علل ریشه‌ای دوباره‌کاری و خطا، هزینهٔ نهایی تحویل خدمت در مقیاس بالا را مهار می‌کند.",
    sourceIds: ["S049", "S053", "S054"],
  },
  {
    from: "L4-K3",
    to: "L5-K3",
    weight: 0.65,
    edgeType: "prerequisite",
    mechanismFa: "نگهداری پیشگیرانه و رفع ریشه‌ای باگ‌ها، پایداری زیرساخت فنی و عملیاتی را در زمان رشد تضمین می‌کند.",
    sourceIds: ["S049", "S054"],
  },

  // --- اثرگذاری‌های متقابل در لایهٔ ۵ و لایهٔ ۱ ---
  {
    from: "L1-K3",
    to: "L5-K1",
    weight: 0.85,
    edgeType: "prerequisite",
    mechanismFa: "تا زمانی که عملیات شعبهٔ فعلی به حضور فیزیکی مالک وابسته است، تکثیر شعبهٔ جدید فقط بحران را دو برابر می‌کند.",
    sourceIds: ["S038", "S045", "S046"],
  },
  {
    from: "L3-K3",
    to: "L5-K1",
    weight: 0.85,
    edgeType: "prerequisite",
    mechanismFa: "موفقیت در آزمون غیاب ۴ هفته‌ای مالک، آزمون نهایی آمادگی سیستم برای تکثیر و فرانچایز است.",
    sourceIds: ["S045", "S046", "S047"],
  },
  {
    from: "L5-K3",
    to: "L5-K2",
    weight: 0.75,
    edgeType: "prerequisite",
    mechanismFa: "ظرفیت ماژولار زیرسیستم‌ها و اتوماسیون مانع از جهش هزینه‌های سربار به ازای هر مشتری جدید می‌شود.",
    sourceIds: ["S045", "S047"],
  },
  {
    from: "L5-K2",
    to: "L5-K1",
    weight: 0.85,
    edgeType: "prerequisite",
    mechanismFa: "تکثیر مدلی که اقتصاد واحد (Unit Economics) آن زیان‌ده یا ناپایدار است، سرعت زیان‌دهی را چندبرابر می‌کند.",
    sourceIds: ["S023", "S045", "S046", "S047"],
  },
];

export const CAUSAL_KEYWORD_EDGES: CausalKeywordEdge[] = RAW_CAUSAL_EDGES.map((edge, idx) => ({
  id: `CE.${String(idx + 1).padStart(2, "0")}.${edge.from}_TO_${edge.to}`,
  fromKeywordId: edge.from,
  fromCanonicalCode: toCanonicalCode(edge.from),
  toKeywordId: edge.to,
  toCanonicalCode: toCanonicalCode(edge.to),
  weight: edge.weight,
  edgeType: edge.edgeType,
  mechanismFa: edge.mechanismFa,
  sourceIds: edge.sourceIds,
}));

const ORDERED_KEYWORD_IDS = [
  "L1-K1",
  "L1-K2",
  "L1-K3",
  "L2-K1",
  "L2-K2",
  "L2-K3",
  "L3-K1",
  "L3-K2",
  "L3-K3",
  "L4-K1",
  "L4-K2",
  "L4-K3",
  "L5-K1",
  "L5-K2",
  "L5-K3",
] as const;

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * حل‌کنندهٔ دقیق ماتریس اثرات کل DEMATEL:
 * T = X * (I - X)^(-1) = X + X^2 + X^3 + ... + X^k
 * از آنجا که شعاع طیفی ماتریس نرمال‌شده X اکیداً کمتر از ۱ است، سری توانی تا توان ۲۰ با دقت < 1e-12 همگراست.
 */
export function computeDematelTotalMatrix(): {
  keywordIds: readonly string[];
  directMatrix: number[][];
  normalizedMatrix: number[][];
  totalMatrix: number[][];
} {
  const n = ORDERED_KEYWORD_IDS.length;
  const idxMap = new Map<string, number>(ORDERED_KEYWORD_IDS.map((id, i) => [id, i] as const));

  const A: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  for (const edge of CAUSAL_KEYWORD_EDGES) {
    const i = idxMap.get(edge.fromKeywordId);
    const j = idxMap.get(edge.toKeywordId);
    if (i != null && j != null) {
      A[i]![j] = edge.weight;
    }
  }

  let maxRowSum = 0;
  let maxColSum = 0;
  for (let i = 0; i < n; i += 1) {
    const rowSum = A[i]!.reduce((s, v) => s + v, 0);
    if (rowSum > maxRowSum) maxRowSum = rowSum;
  }
  for (let j = 0; j < n; j += 1) {
    let colSum = 0;
    for (let i = 0; i < n; i += 1) colSum += A[i]![j]!;
    if (colSum > maxColSum) maxColSum = colSum;
  }

  // ضریب نرمال‌سازی استاندارد DEMATEL (با حاشیهٔ پایداری ۱.۰۵ برای تضمین شعاع طیفی < 1)
  const scale = Math.max(maxRowSum, maxColSum, 1) * 1.05;
  const X: number[][] = A.map((row) => row.map((val) => val / scale));

  // محاسبهٔ T = X + X^2 + ... + X^24
  const T: number[][] = X.map((row) => [...row]);
  let power: number[][] = X.map((row) => [...row]);

  const multiply = (M1: number[][], M2: number[][]): number[][] => {
    const out: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
    for (let i = 0; i < n; i += 1) {
      for (let k = 0; k < n; k += 1) {
        const mik = M1[i]![k]!;
        if (mik === 0) continue;
        for (let j = 0; j < n; j += 1) {
          out[i]![j]! += mik * M2[k]![j]!;
        }
      }
    }
    return out;
  };

  for (let step = 2; step <= 24; step += 1) {
    power = multiply(power, X);
    for (let i = 0; i < n; i += 1) {
      for (let j = 0; j < n; j += 1) {
        T[i]![j]! += power[i]![j]!;
      }
    }
  }

  return {
    keywordIds: ORDERED_KEYWORD_IDS,
    directMatrix: A,
    normalizedMatrix: X,
    totalMatrix: T,
  };
}

function micmacLabelFaOf(quadrant: MicmacQuadrant): string {
  switch (quadrant) {
    case "independent_driver":
      return "پیشران بنیادین / مؤثر مستقل (Independent Driver)";
    case "linkage_lever":
      return "اهرم پیوندی / گلوگاه میانی (Linkage Lever)";
    case "dependent_outcome":
      return "خروجی وابسته / متأثر نهایی (Dependent Outcome)";
    case "autonomous":
      return "موضعی (Autonomous)";
  }
}

/**
 * استخراج پروفایل علّی (مؤثرها، متأثرها، D_i، R_i، ربع MICMAC و سطح ISM) برای تمام ۱۵ کلیدواژه
 */
export function buildCanonicalKeywordCausalProfiles(
  keywordTitles?: Record<string, string>,
): Record<string, KeywordCausalProfile> {
  const { keywordIds, totalMatrix } = computeDematelTotalMatrix();
  const n = keywordIds.length;

  const D: number[] = Array(n).fill(0);
  const R: number[] = Array(n).fill(0);

  for (let i = 0; i < n; i += 1) {
    for (let j = 0; j < n; j += 1) {
      D[i]! += totalMatrix[i]![j]!;
      R[j]! += totalMatrix[i]![j]!;
    }
  }

  const meanD = D.reduce((s, v) => s + v, 0) / n;
  const meanR = R.reduce((s, v) => s + v, 0) / n;

  const profiles: Record<string, KeywordCausalProfile> = {};

  for (let i = 0; i < n; i += 1) {
    const id = keywordIds[i]!;
    const dVal = round2(D[i]!);
    const rVal = round2(R[i]!);
    const prominence = round2(dVal + rVal);
    const net = round2(dVal - rVal);
    const causalRole: "cause_driver" | "effect_symptom" =
      net >= 0 ? "cause_driver" : "effect_symptom";

    let micmacQuadrant: MicmacQuadrant;
    if (dVal >= meanD && rVal < meanR) {
      micmacQuadrant = "independent_driver";
    } else if (dVal >= meanD && rVal >= meanR) {
      micmacQuadrant = "linkage_lever";
    } else if (dVal < meanD && rVal >= meanR) {
      micmacQuadrant = "dependent_outcome";
    } else {
      micmacQuadrant = net >= 0 ? "independent_driver" : "dependent_outcome";
    }

    const directInfluencers = CAUSAL_KEYWORD_EDGES.filter((e) => e.toKeywordId === id).map(
      (e) => ({
        keywordId: e.fromKeywordId,
        canonicalCode: e.fromCanonicalCode,
        weight: e.weight,
        edgeType: e.edgeType,
        mechanismFa: e.mechanismFa,
      }),
    );

    const directInfluenced = CAUSAL_KEYWORD_EDGES.filter((e) => e.fromKeywordId === id).map(
      (e) => ({
        keywordId: e.toKeywordId,
        canonicalCode: e.toCanonicalCode,
        weight: e.weight,
        edgeType: e.edgeType,
        mechanismFa: e.mechanismFa,
      }),
    );

    const layerNum = id.slice(1, 2);
    profiles[id] = {
      keywordId: id,
      canonicalCode: toCanonicalCode(id),
      layerCanonicalCode: `LYR.L${layerNum}`,
      titleFa: keywordTitles?.[id] ?? id,
      drivingPower: dVal,
      dependencePower: rVal,
      prominence,
      netCauseEffect: net,
      causalRole,
      causalRoleLabelFa:
        causalRole === "cause_driver"
          ? "مؤثر خالص / علت ریشه‌ای (Net Influencer)"
          : "متأثر خالص / معلول و نشانه (Net Influenced)",
      micmacQuadrant,
      micmacLabelFa: micmacLabelFaOf(micmacQuadrant),
      ismLevel: KEYWORD_ISM_LEVELS[id] ?? 3,
      directInfluencers,
      directInfluenced,
    };
  }

  return profiles;
}

/**
 * ۳. تحلیل علّی اختصاصی پاسخ‌دهنده (Respondent-Specific Influencer & Influenced Diagnosis):
 * ترکیب امتیاز واقعی کلیدواژه‌های فرد با ماتریس اثرات کل T برای استخراج:
 * - مؤثرهای بالادستیِ مسئولِ ایجاد هر گلوگاه
 * - متأثرهای پایین‌دستیِ در معرض تخریب
 * - هشدار تلهٔ معلول‌درمانی (Symptom-Treatment Trap)
 * - نقشهٔ راه ۳ موجی مداخله بر اساس توالی علّی (مؤثر ⟵ اهرم پیوندی ⟵ متأثر)
 */
export function buildRespondentCausalAnalysis(
  keywords: LayerKeyword[],
  _ctx?: BusinessContextProfile,
): RespondentCausalGraphSummary {
  const { keywordIds, directMatrix, totalMatrix } = computeDematelTotalMatrix();
  const idxMap = new Map<string, number>(keywordIds.map((id, i) => [id, i] as const));
  const kwMap = new Map<string, LayerKeyword>(keywords.map((kw) => [kw.id, kw] as const));

  const titleMap: Record<string, string> = {};
  for (const kw of keywords) titleMap[kw.id] = kw.titleFa;
  const baseProfiles = buildCanonicalKeywordCausalProfiles(titleMap);

  const edgeLookup = new Map<string, CausalKeywordEdge>();
  for (const edge of CAUSAL_KEYWORD_EDGES) {
    edgeLookup.set(`${edge.fromKeywordId}->${edge.toKeywordId}`, edge);
  }

  const nodes: RespondentKeywordCausalNode[] = keywordIds.map((id, idx) => {
    const kw = kwMap.get(id);
    const prof = baseProfiles[id]!;
    const score = kw?.score ?? 10;
    const bandId = kw?.bandId ?? (score < 10 ? "weak" : score < 15 ? "growing" : "strong");
    const selfDeficit = kw?.contextWeightedDeficit ?? Math.max(0, 20 - score);

    // الف) استخراج مؤثرهای بالادستی (Upstream Influencers) بر این گره
    const upstreamInfluencers: ActiveNodeCausalLink[] = [];
    for (let u = 0; u < keywordIds.length; u += 1) {
      if (u === idx) continue;
      const tVal = totalMatrix[u]![idx]!;
      const dVal = directMatrix[u]![idx]!;
      if (tVal <= 0.04 && dVal <= 0) continue;
      const upId = keywordIds[u]!;
      const upKw = kwMap.get(upId);
      const upScore = upKw?.score ?? 10;
      const upGap = Math.max(0, 20 - upScore);
      const edge = edgeLookup.get(`${upId}->${id}`);
      upstreamInfluencers.push({
        keywordId: upId,
        canonicalCode: toCanonicalCode(upId),
        titleFa: upKw?.titleFa ?? upId,
        score: upScore,
        directWeight: round2(dVal),
        totalEffectWeight: round2(tVal),
        propagatedDeficitImpact: round2(tVal * upGap),
        mechanismFa:
          edge?.mechanismFa ??
          `اثر علّی باواسطه از طریق زنجیرهٔ پیش‌نیازهای سیستم (${toCanonicalCode(upId)} ➔ ${toCanonicalCode(id)})`,
      });
    }
    upstreamInfluencers.sort(
      (a, b) =>
        b.propagatedDeficitImpact - a.propagatedDeficitImpact ||
        b.totalEffectWeight - a.totalEffectWeight,
    );

    // ب) استخراج متأثرهای پایین‌دستی (Downstream Influenced) از این گره
    const downstreamInfluenced: ActiveNodeCausalLink[] = [];
    const ownGap = Math.max(0, 20 - score);
    let downstreamCascadeLoad = 0;

    for (let v = 0; v < keywordIds.length; v += 1) {
      if (v === idx) continue;
      const tVal = totalMatrix[idx]![v]!;
      const dVal = directMatrix[idx]![v]!;
      if (tVal <= 0.04 && dVal <= 0) continue;
      const downId = keywordIds[v]!;
      const downKw = kwMap.get(downId);
      const downScore = downKw?.score ?? 10;
      const downGap = Math.max(0, 20 - downScore);
      const edge = edgeLookup.get(`${id}->${downId}`);
      const cascadeImpact = round2(tVal * ownGap);
      downstreamCascadeLoad += tVal * (downGap / 20);

      downstreamInfluenced.push({
        keywordId: downId,
        canonicalCode: toCanonicalCode(downId),
        titleFa: downKw?.titleFa ?? downId,
        score: downScore,
        directWeight: round2(dVal),
        totalEffectWeight: round2(tVal),
        propagatedDeficitImpact: cascadeImpact,
        mechanismFa:
          edge?.mechanismFa ??
          `سرایت باواسطهٔ کسری عملکرد در شبکهٔ علّی (${toCanonicalCode(id)} ➔ ${toCanonicalCode(downId)})`,
      });
    }
    downstreamInfluenced.sort(
      (a, b) => b.totalEffectWeight - a.totalEffectWeight || a.score - b.score,
    );

    // ج) محاسبهٔ امتیاز اهرم ریشه‌ای (Root-Cause Leverage Score)
    // گره‌ای که خودش ضعیف است و هم‌زمان مؤثرِ چندین گره ضعیف پایین‌دستی است بالاترین امتیاز اهرم را می‌گیرد.
    const rootCauseLeverageScore = round2(
      selfDeficit * (1 + 0.65 * downstreamCascadeLoad + (prof.causalRole === "cause_driver" ? 0.2 : 0)),
    );

    return {
      keywordId: id,
      canonicalCode: prof.canonicalCode,
      titleFa: kw?.titleFa ?? prof.titleFa,
      score,
      bandId,
      drivingPower: prof.drivingPower,
      dependencePower: prof.dependencePower,
      netCauseEffect: prof.netCauseEffect,
      causalRole: prof.causalRole,
      causalRoleLabelFa: prof.causalRoleLabelFa,
      micmacQuadrant: prof.micmacQuadrant,
      micmacLabelFa: prof.micmacLabelFa,
      ismLevel: prof.ismLevel,
      rootCauseLeverageScore,
      upstreamInfluencers: upstreamInfluencers.slice(0, 4),
      downstreamInfluenced: downstreamInfluenced.slice(0, 4),
    };
  });

  // تعیین اصلی‌ترین مؤثر ریشه‌ای نیازمند مداخله
  const sortedByLeverage = [...nodes].sort(
    (a, b) => b.rootCauseLeverageScore - a.rootCauseLeverageScore || a.ismLevel - b.ismLevel,
  );
  const primaryRootCauseDriver = sortedByLeverage[0]!;

  // تشخیص تلهٔ معلول‌درمانی (Symptom-Treatment Trap):
  // اگر کم‌امتیازترین کلیدواژهٔ فرد یک متأثر پایین‌دستی (effect_symptom / ISM Level 4..5) باشد
  // در حالی که مؤثرهای بالادستی‌اش هم ضعیف‌اند، هشدار صریح بده!
  const lowestRawNode = [...nodes].sort((a, b) => a.score - b.score)[0]!;
  let symptomTrapWarningFa: string | null = null;
  if (
    lowestRawNode &&
    lowestRawNode.score < 12 &&
    lowestRawNode.causalRole === "effect_symptom"
  ) {
    const weakUpstream = lowestRawNode.upstreamInfluencers.filter((u) => u.score < 12);
    if (weakUpstream.length > 0) {
      const upNames = weakUpstream
        .slice(0, 2)
        .map((u) => `«${u.titleFa} [${u.canonicalCode}]» (${u.score}/۲۰)`)
        .join(" و ");
      symptomTrapWarningFa = `هشدار تلهٔ معلول‌درمانی (Symptom-Treatment Trap): کلیدواژهٔ «${lowestRawNode.titleFa} [${lowestRawNode.canonicalCode}]» (نمرهٔ ${lowestRawNode.score}/۲۰) یک «متأثر پایین‌دستی» در سطح ${lowestRawNode.ismLevel} است؛ تلاش برای اصلاح مستقیم آن بدون اصلاح پیش‌نیازهای مؤثر بالادستی یعنی ${upNames} پایدار نخواهد ماند.`;
    }
  }

  // ساخت نقشهٔ راه ۳ موجی مداخله بر اساس سطوح علّی ISM و ربع‌های MICMAC
  const actionableNodes = nodes.filter((n) => n.score < 15);
  const pool = actionableNodes.length > 0 ? actionableNodes : nodes;

  const wave1Candidates = pool
    .filter((n) => n.ismLevel <= 2 && n.causalRole === "cause_driver")
    .sort((a, b) => b.rootCauseLeverageScore - a.rootCauseLeverageScore);

  const wave2Candidates = pool
    .filter(
      (n) =>
        !wave1Candidates.some((w) => w.keywordId === n.keywordId) &&
        (n.micmacQuadrant === "linkage_lever" || n.ismLevel === 2 || n.ismLevel === 3),
    )
    .sort((a, b) => b.rootCauseLeverageScore - a.rootCauseLeverageScore);

  const wave3Candidates = pool
    .filter(
      (n) =>
        !wave1Candidates.some((w) => w.keywordId === n.keywordId) &&
        !wave2Candidates.some((w) => w.keywordId === n.keywordId),
    )
    .sort((a, b) => b.rootCauseLeverageScore - a.rootCauseLeverageScore);

  const mapWaveItem = (node: RespondentKeywordCausalNode) => {
    const kw = kwMap.get(node.keywordId);
    return {
      keywordId: node.keywordId,
      canonicalCode: node.canonicalCode,
      titleFa: node.titleFa,
      score: node.score,
      micmacLabelFa: node.micmacLabelFa,
      rootCauseLeverageScore: node.rootCauseLeverageScore,
      actionStepFa: kw?.actionStepFa ?? node.titleFa,
      unlockedDownstreamTitlesFa: node.downstreamInfluenced
        .slice(0, 3)
        .map((d) => `${d.titleFa} [${d.canonicalCode}]`),
    };
  };

  const interventionWaves: CausalInterventionWave[] = [
    {
      waveNumber: 1,
      titleFa: "موج ۱: اصلاح مؤثرهای ریشه‌ای و پیشران‌های بنیادین (ISM Levels 1–2)",
      rationaleFa:
        "این گره‌ها بیشترین توان اثرگذاری علّی (Driving Power) را بر کل شبکه دارند؛ اصلاح آن‌ها شرط لازم برای باز شدن قفل لایه‌های بعدی است.",
      keywords: wave1Candidates.slice(0, 2).map(mapWaveItem),
    },
    {
      waveNumber: 2,
      titleFa: "موج ۲: استقرار اهرم‌های پیوندی، تفویض اختیار و پایش (ISM Levels 2–3)",
      rationaleFa:
        "این گره‌ها نقش رلهٔ میانی (Linkage Levers) را دارند و تصمیم‌های راهبردی و SOPها را به جریان اجرای روزمره و داشبورد کنترلی متصل می‌کنند.",
      keywords: wave2Candidates.slice(0, 2).map(mapWaveItem),
    },
    {
      waveNumber: 3,
      titleFa: "موج ۳: تثبیت متأثرهای نهایی، رهایی مالک و مقیاس‌پذیری (ISM Levels 4–5)",
      rationaleFa:
        "این دستاوردها خروجی‌های وابستهٔ سیستم‌اند که پس از استقرار موج ۱ و ۲ به‌صورت پایدار و بدون بازگشت به عقب محقق می‌شوند.",
      keywords: wave3Candidates.slice(0, 2).map(mapWaveItem),
    },
  ].filter((w) => w.keywords.length > 0) as CausalInterventionWave[];

  return {
    codingVersion: CODING_STANDARD_VERSION,
    primaryRootCauseDriver,
    symptomTrapWarningFa,
    interventionWaves,
    nodes,
  };
}
