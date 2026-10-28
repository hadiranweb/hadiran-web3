/**
 * مرحلهٔ ۴ (Slice 4): تانسور تعدیل‌گر زمینهٔ کسب‌وکار (Context Modulation Tensor - BIZ.2..BIZ.6).
 * پشتوانهٔ علمی:
 * - حاکمیت مرحله‌ای SMEها در ۴ فاز رشد (IFC / World Bank, 2019 — S036)
 * - منحنی مراحل رشد و ۵ بحران گذار سازمانی (Greiner, 1972/1998; Churchill & Lewis, 1983)
 * - معماری ۹ فرایند هسته‌ای سازمان تک‌نفره (فرایندهای-سازمان-تک‌نفره C1–C9 در Research Vaults)
 * - ماتریس حجم-تنوع در عملیات خدماتی، تولیدی، بازرگانی و دیجیتال (Hayes & Wheelwright, 1979; Silvestro, 1999)
 * - نظریهٔ لَختی ساختاری و تصلب روال‌ها بر حسب سن و اندازهٔ سازمان (Hannan & Freeman, 1984; Leonard-Barton, 1992; Gilbert, 2005)
 */

import type { LayerKeyword } from "./interpretation";

export type BusinessTypeCode = "service" | "product" | "trade" | "digital" | "other";
export type TeamSizeCode = "solo" | "2-5" | "6-20" | "21-50" | "50+";
export type TenureCode = "lt1" | "1-3" | "3-5" | "5-10" | "10+";

export type BusinessContextProfile = {
  businessName: string | null;
  businessType: BusinessTypeCode;
  domainFa: string | null;
  teamSize: TeamSizeCode;
  managerTenure: TenureCode;
  firmAge: TenureCode;
  growthStageTitleFa: string;
  growthStageCrisisFa: string;
};

const VALID_TYPES = new Set<BusinessTypeCode>(["service", "product", "trade", "digital", "other"]);
const VALID_SIZES = new Set<TeamSizeCode>(["solo", "2-5", "6-20", "21-50", "50+"]);
const VALID_TENURES = new Set<TenureCode>(["lt1", "1-3", "3-5", "5-10", "10+"]);

const STAGE_BY_SIZE: Record<TeamSizeCode, { titleFa: string; crisisFa: string }> = {
  solo: {
    titleFa: "مرحلهٔ ۱: سازمان تک‌نفره / متخصص مستقل (Solopreneur C1–C9)",
    crisisFa: "بحران ظرفیت شناختی و قفل شدن درآمد به ساعت کاری شخصی مالک",
  },
  "2-5": {
    titleFa: "مرحلهٔ ۲: تیم هستهٔ اولیه و بقای عملیاتی (Churchill & Lewis Stage II — Survival)",
    crisisFa: "بحران رهبری و استانداردسازی اولیه (گذر از دستور شفاهی به ۵ روال مکتوب اصلی)",
  },
  "6-20": {
    titleFa: "مرحلهٔ ۳: شکل‌گیری نقش‌های تخصصی (Greiner Phase 2 — Direction)",
    crisisFa: "بحران خودمختاری و تفویض اختیار (نیاز به ماتریس حدود اختیارات و رهایی مدیر از تصمیم‌های خرد)",
  },
  "21-50": {
    titleFa: "مرحلهٔ ۴: سازمان چندواحدی و لایهٔ میانی (Greiner Phase 3 — Delegation / IFC Stage 3)",
    crisisFa: "بحران کنترل و فضای خالی بین واحدها (نیاز به داشبورد KPI، مدیریت تحویل بین‌واحدی و حل مسئلهٔ A3)",
  },
  "50+": {
    titleFa: "مرحلهٔ ۵: سازمان مقیاس‌یافته و هماهنگی ساختاری (Greiner Phase 4 — Coordination / IFC Stage 4)",
    crisisFa: "بحران بروکراسی و انفکاک وسیله از هدف (نیاز به هم‌خوانی راهبردی، پکیج تکثیر و زیرسیستم‌های ماژولار)",
  },
};

export type SoloCoreProcess = {
  id: string;
  canonicalCode: string;
  titleFa: string;
  linkedKeywords: string[];
};

export const SOLO_CORE_PROCESSES: SoloCoreProcess[] = [
  { id: "C1", canonicalCode: "PRC.C1", titleFa: "شفافیت مقصد، پیشنهاد ارزش و پکیج‌سازی خدمت", linkedKeywords: ["L1-K1", "L2-K1", "L5-K2"] },
  { id: "C2", canonicalCode: "PRC.C2", titleFa: "جذب سرنخ و بازاریابی تکرارپذیر", linkedKeywords: ["L2-K1", "L4-K1"] },
  { id: "C3", canonicalCode: "PRC.C3", titleFa: "صلاحیت‌سنجی مشتری، پیشنهاد قیمت و قرارداد", linkedKeywords: ["L2-K3", "L5-K2"] },
  { id: "C4", canonicalCode: "PRC.C4", titleFa: "آنبوردینگ و دریافت ورودی‌های استاندارد مشتری", linkedKeywords: ["L2-K2", "L2-K3"] },
  { id: "C5", canonicalCode: "PRC.C5", titleFa: "اجرای هستهٔ کار با چک‌لیست و قالب‌های آماده", linkedKeywords: ["L2-K2", "L3-K2"] },
  { id: "C6", canonicalCode: "PRC.C6", titleFa: "کنترل کیفیت، تحویل نهایی و بازخورد مشتری", linkedKeywords: ["L2-K3", "L4-K3"] },
  { id: "C7", canonicalCode: "PRC.C7", titleFa: "تفکیک حساب، صدور صورت‌حساب و جریان نقد", linkedKeywords: ["L1-K2", "L5-K2"] },
  { id: "C8", canonicalCode: "PRC.C8", titleFa: "برون‌سپاری، اتوماسیون و رهایی از کارهای کم‌ارزش", linkedKeywords: ["L1-K3", "L3-K1", "L5-K3"] },
  { id: "C9", canonicalCode: "PRC.C9", titleFa: "مرور هفتگی شاخص‌ها و مستندسازی آموخته‌ها", linkedKeywords: ["L4-K1", "L4-K2", "L4-K3"] },
];

/**
 * ضرایب اولویت کلیدواژه‌ها بر اساس اندازهٔ تیم (BIZ.4).
 * اعداد > 1 نشان‌دهندهٔ اهرم حیاتی‌تر در آن مرحلهٔ رشد و اعداد < 1 نشان‌دهندهٔ اولویت ثانویه هستند.
 */
export const SIZE_WEIGHT_MATRIX: Record<TeamSizeCode, Record<string, number>> = {
  solo: {
    "L1-K1": 1.05,
    "L1-K2": 1.25,
    "L1-K3": 1.30,
    "L2-K1": 1.20,
    "L2-K2": 1.25,
    "L2-K3": 0.90,
    "L3-K1": 0.70,
    "L3-K2": 0.85,
    "L3-K3": 1.20,
    "L4-K1": 1.20,
    "L4-K2": 0.80,
    "L4-K3": 1.05,
    "L5-K1": 0.95,
    "L5-K2": 1.30,
    "L5-K3": 0.85,
  },
  "2-5": {
    "L1-K1": 1.05,
    "L1-K2": 1.25,
    "L1-K3": 1.25,
    "L2-K1": 1.15,
    "L2-K2": 1.25,
    "L2-K3": 1.10,
    "L3-K1": 1.10,
    "L3-K2": 1.15,
    "L3-K3": 1.05,
    "L4-K1": 1.10,
    "L4-K2": 1.05,
    "L4-K3": 1.00,
    "L5-K1": 0.95,
    "L5-K2": 1.20,
    "L5-K3": 0.95,
  },
  "6-20": {
    "L1-K1": 1.15,
    "L1-K2": 1.10,
    "L1-K3": 1.25,
    "L2-K1": 1.10,
    "L2-K2": 1.20,
    "L2-K3": 1.25,
    "L3-K1": 1.35,
    "L3-K2": 1.15,
    "L3-K3": 1.20,
    "L4-K1": 1.15,
    "L4-K2": 1.20,
    "L4-K3": 1.15,
    "L5-K1": 1.10,
    "L5-K2": 1.15,
    "L5-K3": 1.10,
  },
  "21-50": {
    "L1-K1": 1.25,
    "L1-K2": 1.05,
    "L1-K3": 1.15,
    "L2-K1": 1.15,
    "L2-K2": 1.15,
    "L2-K3": 1.30,
    "L3-K1": 1.25,
    "L3-K2": 1.15,
    "L3-K3": 1.20,
    "L4-K1": 1.30,
    "L4-K2": 1.25,
    "L4-K3": 1.25,
    "L5-K1": 1.20,
    "L5-K2": 1.15,
    "L5-K3": 1.25,
  },
  "50+": {
    "L1-K1": 1.30,
    "L1-K2": 1.00,
    "L1-K3": 1.10,
    "L2-K1": 1.15,
    "L2-K2": 1.10,
    "L2-K3": 1.30,
    "L3-K1": 1.25,
    "L3-K2": 1.15,
    "L3-K3": 1.20,
    "L4-K1": 1.30,
    "L4-K2": 1.20,
    "L4-K3": 1.30,
    "L5-K1": 1.30,
    "L5-K2": 1.20,
    "L5-K3": 1.30,
  },
};

/**
 * ضرایب تعدیل ثانویه بر اساس نوع کسب‌وکار (BIZ.2 — ماتریس Volume-Variety).
 */
export const TYPE_WEIGHT_MATRIX: Record<BusinessTypeCode, Record<string, number>> = {
  service: {
    "L2-K1": 1.10,
    "L3-K2": 1.10,
    "L5-K2": 1.10,
  },
  product: {
    "L2-K2": 1.10,
    "L2-K3": 1.15,
    "L4-K3": 1.15,
    "L5-K3": 1.10,
  },
  trade: {
    "L1-K2": 1.15,
    "L3-K1": 1.10,
    "L4-K1": 1.15,
  },
  digital: {
    "L2-K1": 1.10,
    "L4-K1": 1.15,
    "L4-K3": 1.10,
    "L5-K2": 1.15,
    "L5-K3": 1.10,
  },
  other: {},
};

export function parseBusinessContext(
  answers: Record<string, number | string>,
): BusinessContextProfile {
  const rawName = answers["BIZ.1"];
  const businessName = typeof rawName === "string" && rawName.trim() ? rawName.trim() : null;

  const rawType = answers["BIZ.2"];
  const businessType: BusinessTypeCode =
    typeof rawType === "string" && VALID_TYPES.has(rawType as BusinessTypeCode)
      ? (rawType as BusinessTypeCode)
      : "other";

  const rawDomain = answers["BIZ.3"];
  const domainFa = typeof rawDomain === "string" && rawDomain.trim() ? rawDomain.trim() : null;

  const rawSize = answers["BIZ.4"];
  const teamSize: TeamSizeCode =
    typeof rawSize === "string" && VALID_SIZES.has(rawSize as TeamSizeCode)
      ? (rawSize as TeamSizeCode)
      : "6-20";

  const rawManagerTenure = answers["BIZ.5"];
  const managerTenure: TenureCode =
    typeof rawManagerTenure === "string" && VALID_TENURES.has(rawManagerTenure as TenureCode)
      ? (rawManagerTenure as TenureCode)
      : "3-5";

  const rawFirmAge = answers["BIZ.6"];
  const firmAge: TenureCode =
    typeof rawFirmAge === "string" && VALID_TENURES.has(rawFirmAge as TenureCode)
      ? (rawFirmAge as TenureCode)
      : "3-5";

  const stage = STAGE_BY_SIZE[teamSize];

  return {
    businessName,
    businessType,
    domainFa,
    teamSize,
    managerTenure,
    firmAge,
    growthStageTitleFa: stage.titleFa,
    growthStageCrisisFa: stage.crisisFa,
  };
}

/**
 * محاسبهٔ ضریب اهمیت زمینه‌ای هر کلیدواژه بر اساس اندازهٔ تیم و نوع کسب‌وکار.
 */
/** The two modulation matrices. Defaults to the shipped ones; a published revision may override them. */
export type ContextTensors = {
  size: Record<TeamSizeCode, Record<string, number>>;
  type: Record<BusinessTypeCode, Record<string, number>>;
};

export const CODE_CONTEXT_TENSORS: ContextTensors = { size: SIZE_WEIGHT_MATRIX, type: TYPE_WEIGHT_MATRIX };

export function contextKeywordWeight(
  keywordId: string,
  ctx: BusinessContextProfile,
  tensors: ContextTensors = CODE_CONTEXT_TENSORS,
): number {
  const sizeW = tensors.size[ctx.teamSize]?.[keywordId] ?? 1.0;
  const typeW = tensors.type[ctx.businessType]?.[keywordId] ?? 1.0;
  return Math.round(sizeW * typeW * 1000) / 1000;
}

/**
 * شاخص شکاف وزنی زمینه‌مند (Context-Adjusted Deficit):
 * هرچه امتیاز کلیدواژه پایین‌تر و ضریب اهمیت زمینه‌ای آن در مرحلهٔ رشد فعلی بالاتر باشد،
 * اولویت مداخلهٔ آن در گزارش بالاتر قرار می‌گیرد.
 */
export function contextWeightedDeficit(
  score: number,
  keywordId: string,
  ctx: BusinessContextProfile,
  tensors: ContextTensors = CODE_CONTEXT_TENSORS,
): number {
  const gap = Math.max(0, 20 - score);
  return Math.round(gap * contextKeywordWeight(keywordId, ctx, tensors) * 100) / 100;
}

/**
 * بومی‌سازی متن تشخیص و اقدام پیشنهادی کلیدواژه‌ها متناسب با زمینه (به‌ویژه سازمان تک‌نفره C1–C9 در برابر تیم‌های بزرگ).
 */
export function contextualizeKeyword(
  keyword: LayerKeyword,
  ctx: BusinessContextProfile,
): LayerKeyword {
  if (ctx.teamSize !== "solo") {
    return keyword;
  }

  // بومی‌سازی اختصاصی برای سازمان تک‌نفره بر اساس سند «فرایندهای-سازمان-تک‌نفره.md (C1–C9)» در Research Vaults
  if (keyword.id === "L3-K1") {
    return {
      ...keyword,
      ownerRoleFa: "مالک (سازمان تک‌نفره)",
      asIsWeakFa:
        "در کسب‌وکار تک‌نفرهٔ شما قواعد ازپیش‌تعیین‌شده‌ای برای پذیرش/رد سفارش (C1)، قیمت‌گذاری و برون‌سپاری کارهای تکراری وجود ندارد و هر مورد نیازمند تصمیم‌گیری از صفر است.",
      toBeFa:
        "قواعد تصمیم‌گیری استاندارد برای غربال مشتری، چارچوب قیمت‌گذاری و واگذاری کارهای تکراری به فریلنسر یا ابزار خودکار.",
      actionStepFa:
        "تدوین قواعد تصمیم‌گیری استاندارد (چک‌لیست پذیرش سفارش C1 و واگذاری ۳ کار تکراری به ابزار یا همکار بیرونی)",
    };
  }

  if (keyword.id === "L3-K2") {
    return {
      ...keyword,
      ownerRoleFa: "مالک (سازمان تک‌نفره)",
      asIsWeakFa:
        "پاسخ‌گویی به مشتریان و مدیریت موقعیت‌های پرتکرار بدون قالب و پلی‌بوک آماده انجام می‌شود و بار شناختی بالایی به شما تحمیل می‌کند.",
      toBeFa:
        "پلی‌بوک سناریوهای پرتکرار مشتری و قالب‌های آمادهٔ تحویل خدمت که سرعت و یکنواختی کار شما را تضمین کند.",
      actionStepFa:
        "تدوین پلی‌بوک سناریوهای پرتکرار و قالب‌های آمادهٔ ارتباط و تحویل خدمت به مشتری",
    };
  }

  if (keyword.id === "L4-K2") {
    return {
      ...keyword,
      ownerRoleFa: "مالک (سازمان تک‌نفره)",
      asIsWeakFa:
        "ریتم ثابتی برای بازبینی هفتگی عملکرد، بررسی ظرفیت و اصلاح فرایندهای شخصی (C1–C9) وجود ندارد و برنامه‌ریزی صرفاً واکنشی است.",
      toBeFa:
        "جلسهٔ بازبینی شخصی هفتگی (Weekly Solo Ops Review) با دستورکار ثابت برای مرور داشبورد، ظرفیت و گلوگاه‌ها.",
      actionStepFa:
        "برقراری ریتم بازبینی شخصی هفتگی (۳۰ دقیقه زمان ثابت در تقویم برای مرور شاخص‌ها و اولویت‌های هفته)",
    };
  }

  return keyword;
}

/**
 * تشخیص الگوهای متقاطعِ «زمینه × نمرهٔ سیستم» (Context × Score Cross-Patterns)
 */
export function detectContextualPatterns(
  ctx: BusinessContextProfile,
  layerScores: Record<string, number>,
  totalScore: number,
): { id: string; meaningFa: string; actionFa: string }[] {
  const out: { id: string; meaningFa: string; actionFa: string }[] = [];

  const isOldFirm = ctx.firmAge === "5-10" || ctx.firmAge === "10+";
  const foundationScore = layerScores["layer-foundation"] ?? 0;
  const archScore = layerScores["layer-architecture"] ?? 0;
  const flowScore = layerScores["layer-flow"] ?? 0;
  const monitorScore = layerScores["layer-monitor"] ?? 0;

  // ۱. لَختی ساختاری و تصلب عادت‌ها در سازمان‌های باسابقه (Hannan & Freeman, 1984; Gilbert, 2005)
  if (isOldFirm && (totalScore < 55 || (foundationScore < 10 && archScore < 10))) {
    out.push({
      id: "context_structural_inertia",
      meaningFa:
        "لَختی ساختاری و قفل‌شدگی در عادت‌های غیررسمی (Structural Inertia & Routine Rigidity): با وجود سابقهٔ بالای کسب‌وکار، تکیهٔ طولانی‌مدت بر روش‌های شفاهی و فردمحور به عادت‌های رسوب‌کرده تبدیل شده است.",
      actionFa:
        "به‌جای تغییر ناگهانی کل سازمان، یک فرایند گلوگاهی را انتخاب کرده و با یک آزمون کوچک ۲ هفته‌ای (PDSA) و چک‌لیست تحویل کار (L2-K3) قفل عادت‌های قدیمی را بشکنید.",
    });
  }

  // ۲. الگوی ویژهٔ سازمان تک‌نفره (Solopreneur Operating Model C1–C9)
  if (ctx.teamSize === "solo" && totalScore < 75) {
    out.push({
      id: "context_solopreneur_c1_c9",
      meaningFa:
        "معماری سازمان تک‌نفره (Solopreneur Operating System C1–C9): در کسب‌وکار تک‌نفره، هدف از سیستم‌سازی ساختن چارت عریض و طویل نیست؛ بلکه کاهش بار شناختی، جداسازی حساب مالی و تبدیل خدمات سفارشی به پکیج تکرارپذیر است.",
      actionFa:
        "روی ۳ اهرم طلایی تمرکز کنید: تفکیک کامل حساب شخصی و کاری (L1-K2)، مستندسازی ۵ روال پرتکرار تحویل خدمت (L2-K2) و استانداردسازی اقتصاد واحد خدمت (L5-K2).",
    });
  }

  // ۳. بحران خودمختاری در تیم‌های ۶ تا ۲۰ نفر (Greiner Phase 2 -> 3)
  if (ctx.teamSize === "6-20" && flowScore < 12) {
    out.push({
      id: "context_greiner_autonomy_crisis",
      meaningFa:
        "بحران گذار به تفویض اختیار در تیم ۶ تا ۲۰ نفره (Greiner's Crisis of Autonomy): اندازهٔ تیم از ظرفیت مدیریت مستقیم یک نفر عبور کرده اما ساختار تصمیم‌گیری هنوز متمرکز است.",
      actionFa:
        "ماتریس حدود اختیارات مالی و عملیاتی پرسنل (L3-K1) و مالکیت خروجی‌ها (L2-K3) را مکتوب کنید تا مراجعات روزمره به مدیر متوقف شود.",
    });
  }

  // ۴. بحران فضای خالی بین واحدها و کنترل در سازمان‌های ۲۱ نفر به بالا (Rummler-Brache S052; Greiner Phase 3 -> 4)
  if ((ctx.teamSize === "21-50" || ctx.teamSize === "50+") && (archScore < 13 || monitorScore < 13)) {
    out.push({
      id: "context_whitespace_control_crisis",
      meaningFa:
        "اصطکاک در فضای خالی بین واحدها (Rummler-Brache White Space & Control Crisis): در سازمان بالای ۲۰ نفر، بیشترین هدررفت و خطا در نقاط تحویل کار بین واحدها و نبود داشبورد کنترلی مشترک رخ می‌دهد.",
      actionFa:
        "چک‌لیست‌های تحویل بین‌واحدی (L2-K3)، داشبورد هفتگی KPI (L4-K1) و رویهٔ حل مسئلهٔ بین‌واحدی A3 (L4-K3) را مستقر کنید.",
    });
  }

  return out;
}
