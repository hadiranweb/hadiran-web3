/**
 * مرحلهٔ ۶ (Slice 6): پروتکل درگاه‌های بین‌دامنه‌ای (DomainBridgePort) و کالیبراسیون پرسوناهای مصنوعی.
 * پشتوانهٔ علمی:
 * - نظریهٔ رده‌های بالای مدیریتی (Upper Echelons Theory — Hambrick & Mason, 1984; Hambrick, 2007)
 * - رابطهٔ کانون کنترل مدیرعامل با تمرکزگرایی و ساختار سازمان (Miller, Kets de Vries & Toulouse, 1982; Boone et al., 2000)
 * - نظریهٔ خودتعیین‌گری و رهبری توانمندساز (Hardré & Reeve, 2009 — S042; Zhang et al., 2017 — S041)
 */

import type { GateBandId, GateView } from "@/lib/analyzers/gate";
import { buildCasioAuthoredPack } from "./authored-pack";
import { buildCasioReport, type CasioReport } from "./report";

export type CasioDomainPortOutput = {
  domainSlug: "casio-ss";
  version: string;
  totalScore: number;
  maturityId: string;
  bottleneckLayerId: string;
  keywordScores: Record<string, number>;
  weakKeywordIds: string[];
  activatedConceptIds: string[];
  activatedSourceIds: string[];
  teamSize: string;
};

export type MindsetDomainPortOutput = {
  domainSlug: "mindset-gate";
  version: string;
  bandId: GateBandId;
  total: number;
  dimensions: {
    control: number;
    agency: number;
    problem: number;
  };
};

export type InterDomainBridgeInsight = {
  id: string;
  titleFa: string;
  fromMindsetDimension: "control" | "agency" | "problem" | "sjt";
  toCasioKeywords: string[];
  diagnosisFa: string;
  interventionSequenceFa: string;
  sourceIds: string[];
};

export type SyntheticArchetypeSpec = {
  id: string;
  titleFa: string;
  descriptionFa: string;
  answers: Record<string, number | string>;
  expectedBottleneckLayerId: string;
  expectedTopKeywordIds: string[];
  expectedPatternIds: string[];
};

/**
 * استخراج درگاه خروجی استاندارد از گزارش عارضه‌یابی کسب‌وکار (casio-ss)
 */
export function toCasioDomainPortOutput(report: CasioReport): CasioDomainPortOutput {
  const keywordScores: Record<string, number> = {};
  const weakKeywordIds: string[] = [];

  for (const layer of report.layers) {
    for (const kw of layer.keywords) {
      const s = kw.score ?? 0;
      keywordScores[kw.id] = s;
      if (kw.bandId === "weak") {
        weakKeywordIds.push(kw.id);
      }
    }
  }

  return {
    domainSlug: "casio-ss",
    version: report.instrumentVersion,
    totalScore: report.total,
    maturityId: report.maturity.id,
    bottleneckLayerId: report.bottleneck.id,
    keywordScores,
    weakKeywordIds,
    activatedConceptIds: (report.ontology?.activatedConcepts ?? []).map((c) => c.id),
    activatedSourceIds: (report.ontology?.activatedSources ?? []).map((s) => s.id),
    teamSize: report.contextProfile?.teamSize ?? "6-20",
  };
}

/**
 * استخراج درگاه خروجی استاندارد از نتیجهٔ آزمون مستقل الگوی ذهنی (mindset-gate)
 */
export function toMindsetDomainPortOutput(
  outcome: GateView,
  version = "mindset-gate-1.0.0",
): MindsetDomainPortOutput {
  const byId = new Map(outcome.dimensions.map((d) => [d.id, d.score] as const));
  return {
    domainSlug: "mindset-gate",
    version,
    bandId: outcome.bandId,
    total: outcome.total ?? 5,
    dimensions: {
      control: byId.get("gate-control") ?? 5,
      agency: byId.get("gate-agency") ?? 5,
      problem: byId.get("gate-problem") ?? 5,
    },
  };
}

/**
 * موتور حل‌کنندهٔ یال‌های پل بین‌دامنه‌ای (Inter-Domain Bridge Resolver):
 * بدون ادغام سؤالات دو آزمون، بردار خروجی مستقل «الگوی ذهنی» و «عارضه‌یابی کسب‌وکار» را
 * به هم متصل کرده و ترتیب بهینهٔ مداخله را استخراج می‌کند.
 */
export function resolveInterDomainBridge(
  casioPort: CasioDomainPortOutput,
  mindsetPort: MindsetDomainPortOutput,
): InterDomainBridgeInsight[] {
  const insights: InterDomainBridgeInsight[] = [];
  const kw = casioPort.keywordScores;
  const { control, agency, problem } = mindsetPort.dimensions;

  const isDelegationWeak = (kw["L1-K3"] ?? 20) < 10 || (kw["L3-K1"] ?? 20) < 10;
  const isArchitectureWeak = (kw["L2-K2"] ?? 20) < 10 || (kw["L2-K3"] ?? 20) < 10;
  const isRcaWeak = (kw["L4-K3"] ?? 20) < 10;
  const isStrategyOrKpiWeak = (kw["L1-K1"] ?? 20) < 10 || (kw["L4-K1"] ?? 20) < 10;

  // ۱. مانع روان‌شناختی در تفویض اختیار (Upper Echelons Centralization Trap — Miller et al., 1982; S038, S041)
  if (isDelegationWeak && control < 5.5) {
    insights.push({
      id: "bridge_psychological_delegation_barrier",
      titleFa: "تداخل نیاز به کنترل شخصی با ساختار تفویض اختیار (Centralization Trap)",
      fromMindsetDimension: "control",
      toCasioKeywords: ["L1-K3", "L3-K1", "L3-K3"],
      diagnosisFa:
        "ضعف در کلیدواژه‌های «تلهٔ زمان مالک (L1-K3)» و «تعیین اختیارات پرسنل (L3-K1)» هم‌زمان با نمرهٔ پایین در بُعد «آمادگی واگذاری کنترل» نشان می‌دهد که نوشتن صرفِ دستورالعمل (SOP) کافی نیست؛ زیرا در اولین خطای تیم، مالک دوباره تصمیم‌گیری را پس می‌گیرد (تفویض معکوس).",
      interventionSequenceFa:
        "گام ۱: اجرای پروتکل «تفویض تدریجی ۳ سطحی» (تصمیم‌های سبز بدون هماهنگی، زرد با اطلاع پسینی، قرمز با تأیید پیشینی — S041) روی ۱ تصمیم کم‌ریسک؛ گام ۲: تثبیت چک‌لیست تحویل کار (L2-K3).",
      sourceIds: ["S038", "S040", "S041", "S042"],
    });
  }

  // ۲. آمادگی ذهنی بالا همراه با خلأ ابزاری و معماری (High Readiness, Structural Gap)
  if ((isDelegationWeak || isArchitectureWeak) && control >= 6.5 && agency >= 6.5) {
    insights.push({
      id: "bridge_high_readiness_architectural_gap",
      titleFa: "آمادگی ذهنی بالا برای سیستم‌سازی همراه با خلأ صرفاً ابزاری",
      fromMindsetDimension: "control",
      toCasioKeywords: ["L2-K2", "L2-K3", "L3-K1"],
      diagnosisFa:
        "ارزیابی الگوی ذهنی نشان می‌دهد که شما از نظر روان‌شناختی آمادهٔ واگذاری و پذیرش سیستم هستید؛ بنابراین گلوگاه فعلی در لایهٔ ۲ و ۳ صرفاً ناشی از نبودِ ابزارهای کالبدی (SOP و چک‌لیست تحویل) است.",
      interventionSequenceFa:
        "می‌توانید بدون نیاز به مداخلات تدریجیِ تغییر نگرش، مستقیماً وارد اسپرینت ۱۴ روزهٔ استخراج ۵ دستورالعمل اصلی (L2-K2) و ماتریس حدود اختیارات (L3-K1) شوید.",
      sourceIds: ["S039", "S041", "S052"],
    });
  }

  // ۳. سوگیری مقصرانگاری فردی در برابر تحلیل ریشه‌ای سیستمی (Person-Blame Bias vs Systemic RCA)
  if (isRcaWeak && problem < 5.5) {
    insights.push({
      id: "bridge_blame_attribution_vs_rca",
      titleFa: "سوگیری مقصرانگاری فردی در برابر حل مسئلهٔ سیستمی (Deming 94/6 Rule)",
      fromMindsetDimension: "problem",
      toCasioKeywords: ["L4-K3", "L2-K2"],
      diagnosisFa:
        "ترکیب ضعف در «سیستم بازخورد و اصلاح باگ‌های فرآیندی (L4-K3)» با نمرهٔ پایین در «رویکرد حل مسئلهٔ سیستمی» نشان‌دهندهٔ تمرکز بر یافتن مقصر فردی هنگام بروز خطا است که باعث پنهان‌کاری تیم و تکرار خطاها می‌شود (S049, S054).",
      interventionSequenceFa:
        "قانون «ممنوعیت سرزنش فرد در جلسهٔ بررسی خطا» را اعلام کرده و فرم ۱ صفحه‌ای A3 (سؤال از نقص در فرآیند، آموزش یا چک‌لیست — S051) را جایگزین واکنش شفاهی کنید.",
      sourceIds: ["S049", "S050", "S051", "S054"],
    });
  }

  // ۴. واکنش‌زدگی محیطی و فرسایش عاملیت راهبردی (External Locus Strategic Drift — Rotter, 1966; Boone et al., 2000)
  if (isStrategyOrKpiWeak && agency < 5.5) {
    insights.push({
      id: "bridge_external_locus_strategic_drift",
      titleFa: "واکنش‌زدگی محیطی و تضعیف عاملیت راهبردی (External Locus Drift)",
      fromMindsetDimension: "agency",
      toCasioKeywords: ["L1-K1", "L4-K1"],
      diagnosisFa:
        "هم‌زمانی ضعف در «شفافیت اهداف راهبردی (L1-K1)» و «داشبورد شاخص‌ها (L4-K1)» با نمرهٔ پایین در «عاملیت درونی» نشان می‌دهد که نوسان‌های محیطی باعث رها کردن برنامه‌ریزی و مدیریت روزمره‌محور شده است.",
      interventionSequenceFa:
        "به‌جای تمرکز بر متغیرهای غیرقابل‌کنترل بازار، ۳ شاخص پیش‌نگرِ کاملاً در کنترل تیم (Leading KPIs — S028) تعریف کرده و هر هفته پایش کنید.",
      sourceIds: ["S028", "S036", "S048"],
    });
  }

  return insights;
}

/**
 * ۵ پرسونای مصنوعی استاندارد (Synthetic Archetypes) برای کالیبراسیون و آزمون حساسیت گراف چندبه‌چند
 */
export const SYNTHETIC_ARCHETYPES: SyntheticArchetypeSpec[] = [
  {
    id: "archetype_founder_trap",
    titleFa: "پرسونای ۱: سازمان قفل‌شده در تلهٔ بنیان‌گذار (Founder Bottleneck)",
    descriptionFa: "کسب‌وکار ۶ تا ۲۰ نفره که مالک درگیر تمام تصمیم‌های خرد است و لایهٔ جاری‌سازی و شالوده ضعیف است.",
    answers: {
      "BIZ.1": "تله بنیان‌گذار",
      "BIZ.2": "service",
      "BIZ.3": "خدمات تخصصی",
      "BIZ.4": "6-20",
      "BIZ.5": "3-5",
      "BIZ.6": "3-5",
      "FL.L1.Q1": 1,
      "FL.L1.Q2": 9, // reverse -> 1
      "FL.L1.Q3": 6,
      "FL.L1.Q4": 7,
      "FL.L2.Q1": 5,
      "FL.L2.Q2": 5,
      "FL.L2.Q3": 5,
      "FL.L2.Q4": 4,
      "FL.L3.Q1": 1,
      "FL.L3.Q2": 9, // reverse -> 1
      "FL.L3.Q3": 3,
      "FL.L3.Q4": 2,
      "FL.L4.Q1": 5,
      "FL.L4.Q2": 5,
      "FL.L4.Q3": 5,
      "FL.L4.Q4": 5,
      "FL.L5.Q1": 5,
      "FL.L5.Q2": 5,
      "FL.L5.Q3": 5,
      "FL.L5.Q4": 5,
    },
    expectedBottleneckLayerId: "layer-flow",
    expectedTopKeywordIds: ["L3-K1", "L3-K3", "L1-K3"],
    expectedPatternIds: ["context_greiner_autonomy_crisis"],
  },
  {
    id: "archetype_paper_bureaucracy",
    titleFa: "پرسونای ۲: بروکراسی کاغذی (Policy-Practice Decoupling)",
    descriptionFa: "معماری و مستندسازی بسیار قوی (لایهٔ ۲ بالا)، اما جاری‌سازی و پایبندی عملی بسیار ضعیف (لایهٔ ۳ پایین).",
    answers: {
      "BIZ.1": "بروکراسی کاغذی",
      "BIZ.2": "product",
      "BIZ.3": "تولید صنعتی",
      "BIZ.4": "21-50",
      "BIZ.5": "5-10",
      "BIZ.6": "5-10",
      "FL.L1.Q1": 7,
      "FL.L1.Q2": 3,
      "FL.L1.Q3": 8,
      "FL.L1.Q4": 8,
      "FL.L2.Q1": 9,
      "FL.L2.Q2": 9,
      "FL.L2.Q3": 1, // reverse -> 9
      "FL.L2.Q4": 9,
      "FL.L3.Q1": 2,
      "FL.L3.Q2": 8, // reverse -> 2
      "FL.L3.Q3": 2,
      "FL.L3.Q4": 2,
      "FL.L4.Q1": 6,
      "FL.L4.Q2": 6,
      "FL.L4.Q3": 4,
      "FL.L4.Q4": 6,
      "FL.L5.Q1": 6,
      "FL.L5.Q2": 6,
      "FL.L5.Q3": 4,
      "FL.L5.Q4": 6,
    },
    expectedBottleneckLayerId: "layer-flow",
    expectedTopKeywordIds: ["L3-K1", "L3-K2", "L3-K3"],
    expectedPatternIds: ["written_not_executed"],
  },
  {
    id: "archetype_means_ends_decoupled",
    titleFa: "پرسونای ۳: انفکاک وسیله از هدف (Means-Ends Decoupling)",
    descriptionFa: "پایش و جلسات منظم (لایهٔ ۴ قوی)، اما شالودهٔ راهبردی/مالی یا مقیاس‌پذیری بسیار ضعیف (لایهٔ ۱ و ۵ ضعیف).",
    answers: {
      "BIZ.1": "پایش بی‌مقصد",
      "BIZ.2": "digital",
      "BIZ.3": "پلتفرم آنلاین",
      "BIZ.4": "21-50",
      "BIZ.5": "3-5",
      "BIZ.6": "3-5",
      "FL.L1.Q1": 2,
      "FL.L1.Q2": 8, // reverse -> 2
      "FL.L1.Q3": 2,
      "FL.L1.Q4": 2,
      "FL.L2.Q1": 6,
      "FL.L2.Q2": 6,
      "FL.L2.Q3": 4,
      "FL.L2.Q4": 6,
      "FL.L3.Q1": 6,
      "FL.L3.Q2": 4,
      "FL.L3.Q3": 6,
      "FL.L3.Q4": 6,
      "FL.L4.Q1": 9,
      "FL.L4.Q2": 9,
      "FL.L4.Q3": 1, // reverse -> 9
      "FL.L4.Q4": 9,
      "FL.L5.Q1": 2,
      "FL.L5.Q2": 2,
      "FL.L5.Q3": 8, // reverse -> 2
      "FL.L5.Q4": 1,
    },
    expectedBottleneckLayerId: "layer-scale",
    expectedTopKeywordIds: ["L5-K2", "L1-K1", "L5-K1"],
    expectedPatternIds: ["means_ends_decoupling"],
  },
  {
    id: "archetype_solopreneur_c1_c9",
    titleFa: "پرسونای ۴: متخصص مستقل / سازمان تک‌نفره (Solopreneur C1–C9)",
    descriptionFa: "کسب‌وکار تک‌نفره با اختلاط حساب مالی و نبود استاندارد تحویل خدمت.",
    answers: {
      "BIZ.1": "استودیو تک‌نفره",
      "BIZ.2": "service",
      "BIZ.3": "مشاوره تخصصی",
      "BIZ.4": "solo",
      "BIZ.5": "1-3",
      "BIZ.6": "1-3",
      "FL.L1.Q1": 2,
      "FL.L1.Q2": 8, // reverse -> 2
      "FL.L1.Q3": 4,
      "FL.L1.Q4": 1,
      "FL.L2.Q1": 2,
      "FL.L2.Q2": 2,
      "FL.L2.Q3": 8,
      "FL.L2.Q4": 3,
      "FL.L3.Q1": 2,
      "FL.L3.Q2": 8,
      "FL.L3.Q3": 2,
      "FL.L3.Q4": 2,
      "FL.L4.Q1": 3,
      "FL.L4.Q2": 3,
      "FL.L4.Q3": 7,
      "FL.L4.Q4": 3,
      "FL.L5.Q1": 3,
      "FL.L5.Q2": 3,
      "FL.L5.Q3": 7,
      "FL.L5.Q4": 2,
    },
    expectedBottleneckLayerId: "layer-flow",
    expectedTopKeywordIds: ["L3-K3", "L1-K2", "L1-K3"],
    expectedPatternIds: ["context_solopreneur_c1_c9"],
  },
];

export type ArchetypeCalibrationResult = {
  archetypeId: string;
  passed: boolean;
  actualBottleneckLayerId: string;
  actualPatternIds: string[];
  topWeakKeywordIds: string[];
};

/**
 * اجرای خودکار کالیبراسیون روی پرسوناهای مصنوعی برای تضمین صحت تفکیک‌پذیری گراف
 */
export function runArchetypeCalibrationSuite(): ArchetypeCalibrationResult[] {
  const pack = buildCasioAuthoredPack();
  return SYNTHETIC_ARCHETYPES.map((spec) => {
    const report = buildCasioReport(pack, spec.answers, null);
    const actualPatternIds = report.patterns.map((p) => p.id);
    const allKws = report.layers
      .flatMap((l) => l.keywords)
      .sort((a, b) => (b.contextWeightedDeficit ?? 0) - (a.contextWeightedDeficit ?? 0));
    const topWeakKeywordIds = allKws.slice(0, 5).map((k) => k.id);

    const hasExpectedPatterns = spec.expectedPatternIds.every((pid) =>
      actualPatternIds.includes(pid),
    );
    const hasExpectedKeyword = spec.expectedTopKeywordIds.some((kid) =>
      topWeakKeywordIds.includes(kid),
    );
    const passed =
      report.bottleneck.id === spec.expectedBottleneckLayerId &&
      hasExpectedPatterns &&
      hasExpectedKeyword;

    return {
      archetypeId: spec.id,
      passed,
      actualBottleneckLayerId: report.bottleneck.id,
      actualPatternIds,
      topWeakKeywordIds,
    };
  });
}
