import {
  BOTTLENECK_AS_IS_LABEL_FA,
  KEYWORD_ACCENT_COLORS,
  KEYWORD_GRAPH_NOTE_FA,
  casioSummaryCopy,
} from "@/lib/analyzers/casio-ss/report-copy";
import { overallChartSvg, radarSvgHtml } from "@/lib/analyzers/document-radar-svg";
import { faNum, type InterpretationDocument } from "@/lib/analyzers/document-model";
import { canonicalizeTemplateId } from "@/lib/analyzers/document-templates";
import { renderMustache, stripUnsafeHtml } from "@/lib/analyzers/mustache";

export type DocumentLogos = {
  light: string;
  dark: string;
  seal: string;
};

export const DOCUMENT_PAGE_SIZES = ["A4", "A4 landscape"] as const;
export type DocumentPageSize = (typeof DOCUMENT_PAGE_SIZES)[number];

export type DocumentChrome = {
  html: string;
  css: string;
  logos: DocumentLogos;
  pageSize: DocumentPageSize;
  pageMargin: string;
};

export function normalizePageSize(value: unknown): DocumentPageSize {
  return value === "A4 landscape" ? "A4 landscape" : "A4";
}

export function normalizePageMargin(value: unknown): string {
  if (typeof value !== "string") return "0";
  const trimmed = value.trim().slice(0, 32);
  return trimmed || "0";
}

export type TemplateVariable = {
  token: string;
  hintFa: string;
  groupFa: string;
};

function emptyChrome(): DocumentChrome {
  return { html: "", css: "", logos: { light: "", dark: "", seal: "" }, pageSize: "A4", pageMargin: "0" };
}

export function parseChrome(raw: unknown): DocumentChrome {
  const next = emptyChrome();
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return next;
  const row = raw as Record<string, unknown>;
  if (typeof row.html === "string") next.html = row.html;
  if (typeof row.css === "string") next.css = row.css;
  next.pageSize = normalizePageSize(row.pageSize);
  next.pageMargin = normalizePageMargin(row.pageMargin);
  const logos = row.logos;
  if (logos && typeof logos === "object" && !Array.isArray(logos)) {
    const pack = logos as Record<string, unknown>;
    if (typeof pack.light === "string") next.logos.light = pack.light;
    if (typeof pack.dark === "string") next.logos.dark = pack.dark;
    if (typeof pack.seal === "string") next.logos.seal = pack.seal;
  }
  return next;
}

function whenFa(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("fa-IR");
}

function splitActions(text: string) {
  return text
    .split(/\n+|؛/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((title, index) => ({ title, indexFa: faNum(index + 1) }));
}

export function documentTemplateContext(doc: InterpretationDocument, chrome: DocumentChrome) {
  const layers = doc.layers.map((layer, index) => {
    const max = layer.scoreMax || 20;
    const ratio =
      layer.score != null && max > 0 ? Math.max(0, Math.min(100, Math.round((layer.score / max) * 100))) : 0;
    return {
      id: layer.id,
      titleFa: layer.titleFa,
      layer_name: layer.titleFa,
      constructFa: layer.constructFa,
      score: layer.score,
      scoreMax: layer.scoreMax,
      scoreFa: layer.scoreFa,
      scoreMaxFa: layer.scoreMaxFa,
      statusFa: layer.statusFa,
      asIsFa: layer.asIsFa,
      toBeFa: layer.toBeFa,
      as_is_text: layer.asIsFa,
      to_be_text: layer.toBeFa,
      actionsFa: layer.actionsFa,
      isBottleneck: layer.isBottleneck,
      indexFa: faNum(index + 1),
      ratio,
      actions: splitActions(layer.actionsFa),
      keywords: layer.keywords.map((keyword) => ({
        id: keyword.id,
        titleFa: keyword.titleFa,
        score: keyword.score,
        scoreFa: keyword.scoreFa,
        bandId: keyword.bandId,
        bandLabelFa: keyword.bandLabelFa,
        whyFa: keyword.whyFa,
        horizonFa: keyword.horizonFa,
        ownerRoleFa: keyword.ownerRoleFa,
        micmacLabelFa: keyword.micmacLabelFa,
        influencersFa: (keyword.influencersFa ?? []).map((titleFa) => ({ titleFa })),
        influencedFa: (keyword.influencedFa ?? []).map((titleFa) => ({ titleFa })),
        children: keyword.children.map((child) => ({ titleFa: child })),
      })),
    };
  });

  const radarPoints = layers.map((layer) => ({
    id: layer.id,
    labelFa: layer.titleFa,
    value: layer.score,
    max: layer.scoreMax || 20,
    bottleneck: layer.isBottleneck,
  }));
  const radarSvg = radarSvgHtml(radarPoints);
  const chartSvg = overallChartSvg(radarPoints);

  const bottleneckLayer = layers.find((layer) => layer.isBottleneck) ?? layers[0] ?? null;
  const keywordGraphGroups = (bottleneckLayer?.keywords ?? []).slice(0, 3).map((keyword, index) => ({
    id: keyword.id,
    titleFa: keyword.scoreFa ? `${keyword.titleFa} (${keyword.scoreFa}/۲۰)` : keyword.titleFa,
    scoreFa: keyword.scoreFa ?? "",
    bandLabelFa: keyword.bandLabelFa ?? "",
    childrenFa: keyword.children.map((child) => child.titleFa),
    accentColor: KEYWORD_ACCENT_COLORS[index % KEYWORD_ACCENT_COLORS.length],
  }));
  const bottleneckAsIsFa = bottleneckLayer?.asIsFa ?? "";
  const summary = casioSummaryCopy({
    personNameFa: doc.personNameFa,
    totalScore: doc.totalScore,
    totalFa: doc.totalFa ?? "—",
    totalMaxFa: faNum(doc.totalScoreMax ?? 100),
    bottleneckFa: doc.bottleneckFa ?? bottleneckLayer?.titleFa ?? "",
    bottleneckAsIsFa,
  });

  const a3sheet = doc.deepDive?.a3Sheet;
  const a3 = a3sheet
    ? {
        titleFa: a3sheet.titleFa,
        primaryKeywordTitleFa: a3sheet.primaryKeywordTitleFa,
        ownerRoleFa: a3sheet.ownerRoleFa,
        horizonFa: a3sheet.horizonFa,
        backgroundFa: a3sheet.backgroundFa,
        currentConditionFa: a3sheet.currentConditionFa,
        organizationRootFa: a3sheet.multiLevelRootCause.organizationRootFa,
        processRootFa: a3sheet.multiLevelRootCause.processRootFa,
        performerRootFa: a3sheet.multiLevelRootCause.performerRootFa,
        targetCondition30DayFa: a3sheet.targetCondition30DayFa,
        pdsaPlanFa: a3sheet.pdsaCard.planHypothesisFa,
        pdsaDoFa: a3sheet.pdsaCard.doSmallScaleFa,
        pdsaStudyFa: a3sheet.pdsaCard.studyMetricFa,
        pdsaActFa: a3sheet.pdsaCard.actDecisionRuleFa,
      }
    : null;
  const interventionWaves = (doc.causalGraph?.interventionWaves ?? []).map((wave) => ({
    waveNumber: wave.waveNumber,
    titleFa: wave.titleFa,
    rationaleFa: wave.rationaleFa,
    keywords: wave.keywords.map((kw) => ({ titleFa: kw.titleFa, canonicalCode: kw.canonicalCode })),
  }));

  return {
    packNameFa: doc.packNameFa,
    packSlug: doc.packSlug,
    version: doc.version,
    templateId: doc.templateId,
    personNameFa: doc.personNameFa,
    businessNameFa: doc.businessNameFa ?? "",
    publicCode: doc.publicCode ?? "",
    submittedAt: doc.submittedAt,
    submittedFa: whenFa(doc.submittedAt),
    totalScore: doc.totalScore,
    totalScoreMax: doc.totalScoreMax,
    totalFa: doc.totalFa ?? "—",
    totalMaxFa: faNum(doc.totalScoreMax ?? 100),
    maturityFa: doc.maturityFa ?? "",
    bottleneckId: doc.bottleneckId ?? "",
    bottleneckFa: doc.bottleneckFa ?? "",
    bottleneckScoreFa: doc.bottleneckScoreFa ?? "",
    closingFa: doc.closingFa,
    hasBusiness: Boolean(doc.businessNameFa),
    hasTotal: Boolean(doc.totalFa),
    hasBottleneck: Boolean(doc.bottleneckFa),
    hasLayers: layers.length > 0,
    hasRadar: layers.length >= 3,
    hasContext: doc.context.length > 0,
    hasPatterns: doc.patterns.length > 0,
    hasPublicCode: Boolean(doc.publicCode),
    hasSummary: summary.summaryParagraphsFa.length > 0,
    hasKeywordGraph: keywordGraphGroups.length > 0,
    hasQr: false,
    summaryTitleFa: summary.summaryTitleFa,
    summaryParagraphsFa: summary.summaryParagraphsFa,
    keywordGraphGroups,
    a3,
    hasA3: Boolean(a3),
    interventionWaves,
    hasInterventionWaves: interventionWaves.length > 0,
    symptomTrapWarningFa: doc.causalGraph?.symptomTrapWarningFa ?? "",
    hasSymptomTrap: Boolean(doc.causalGraph?.symptomTrapWarningFa),
    bottleneckAsIsLabelFa: BOTTLENECK_AS_IS_LABEL_FA,
    bottleneckAsIsFa,
    keywordGraphNoteFa: KEYWORD_GRAPH_NOTE_FA,
    contactFa: "",
    qrSvg: "",
    layers,
    context: doc.context,
    patterns: doc.patterns,
    scores: doc.scores,
    logos: chrome.logos,
    radarSvg,
    overallChartSvg: chartSvg,
    report: {
      cover_title: doc.packNameFa,
      total_score: doc.totalFa,
      total_score_max: faNum(doc.totalScoreMax ?? 100),
      maturity_label: doc.maturityFa,
      bottleneck_id: doc.bottleneckId,
      bottleneck_name: doc.bottleneckFa,
      bottleneck_score: doc.bottleneckScoreFa,
      person_name_snapshot: doc.personNameFa,
      business_name_snapshot: doc.businessNameFa,
      closing_fa: doc.closingFa,
      instrument_version: doc.version,
      report_date: whenFa(doc.submittedAt),
    },
    نام: doc.personNameFa,
    نمره_کل: doc.totalFa ?? "",
    بلوغ: doc.maturityFa ?? "",
    گلوگاه: doc.bottleneckFa ?? "",
    کسب_وکار: doc.businessNameFa ?? "",
  };
}

export function documentVariableCatalog(): TemplateVariable[] {
  return [
    { groupFa: "گزارش", token: "{{personNameFa}}", hintFa: "نام پاسخ‌دهنده" },
    { groupFa: "گزارش", token: "{{packNameFa}}", hintFa: "نام تفسیر" },
    { groupFa: "گزارش", token: "{{businessNameFa}}", hintFa: "نام کسب‌وکار" },
    { groupFa: "گزارش", token: "{{submittedFa}}", hintFa: "تاریخ ثبت" },
    { groupFa: "گزارش", token: "{{totalFa}}", hintFa: "نمرهٔ کل" },
    { groupFa: "گزارش", token: "{{totalMaxFa}}", hintFa: "سقف نمره" },
    { groupFa: "گزارش", token: "{{maturityFa}}", hintFa: "برچسب بلوغ" },
    { groupFa: "گزارش", token: "{{bottleneckFa}}", hintFa: "عنوان گلوگاه" },
    { groupFa: "گزارش", token: "{{bottleneckScoreFa}}", hintFa: "نمرهٔ گلوگاه" },
    { groupFa: "گزارش", token: "{{closingFa}}", hintFa: "یادداشت پایانی" },
    { groupFa: "گزارش", token: "{{version}}", hintFa: "نسخهٔ ابزار" },
    { groupFa: "گزارش", token: "{{publicCode}}", hintFa: "شناسهٔ نمایشی" },
    { groupFa: "جدول گزارش", token: "{{report.cover_title}}", hintFa: "cover_title" },
    { groupFa: "جدول گزارش", token: "{{report.person_name_snapshot}}", hintFa: "person_name_snapshot" },
    { groupFa: "جدول گزارش", token: "{{report.business_name_snapshot}}", hintFa: "business_name_snapshot" },
    { groupFa: "جدول گزارش", token: "{{report.total_score}}", hintFa: "total_score" },
    { groupFa: "جدول گزارش", token: "{{report.maturity_label}}", hintFa: "maturity_label" },
    { groupFa: "جدول گزارش", token: "{{report.bottleneck_name}}", hintFa: "bottleneck_name" },
    { groupFa: "جدول گزارش", token: "{{report.closing_fa}}", hintFa: "closing_fa" },
    { groupFa: "جدول گزارش", token: "{{report.report_date}}", hintFa: "report_date" },
    { groupFa: "لایه‌ها", token: "{{#layers}} … {{/layers}}", hintFa: "حلقهٔ analyzer_report_layers" },
    { groupFa: "لایه‌ها", token: "{{titleFa}}", hintFa: "نام لایه (داخل حلقه)" },
    { groupFa: "لایه‌ها", token: "{{layer_name}}", hintFa: "layer_name" },
    { groupFa: "لایه‌ها", token: "{{scoreFa}}", hintFa: "نمره" },
    { groupFa: "لایه‌ها", token: "{{statusFa}}", hintFa: "وضعیت" },
    { groupFa: "لایه‌ها", token: "{{asIsFa}}", hintFa: "وضعیت موجود" },
    { groupFa: "لایه‌ها", token: "{{toBeFa}}", hintFa: "وضعیت مطلوب" },
    { groupFa: "لایه‌ها", token: "{{constructFa}}", hintFa: "سازه" },
    { groupFa: "لایه‌ها", token: "{{ratio}}", hintFa: "درصد نوار ۰–۱۰۰" },
    { groupFa: "لایه‌ها", token: "{{#isBottleneck}} … {{/isBottleneck}}", hintFa: "فقط گلوگاه" },
    { groupFa: "اقدامات", token: "{{#actions}} … {{/actions}}", hintFa: "حلقهٔ analyzer_report_actions" },
    { groupFa: "اقدامات", token: "{{title}}", hintFa: "متن اقدام (داخل حلقه)" },
    { groupFa: "زمینه", token: "{{#context}} … {{/context}}", hintFa: "context jsonb" },
    { groupFa: "زمینه", token: "{{labelFa}} / {{valueFa}}", hintFa: "برچسب و مقدار" },
    { groupFa: "الگوها", token: "{{#patterns}} … {{/patterns}}", hintFa: "patterns jsonb" },
    { groupFa: "الگوها", token: "{{meaningFa}} / {{actionFa}}", hintFa: "معنا و اقدام" },
    { groupFa: "لوگو", token: "{{{logos.light}}}", hintFa: "SVG جلد (بدون escape)" },
    { groupFa: "لوگو", token: "{{{logos.dark}}}", hintFa: "SVG روی زمینه روشن" },
    { groupFa: "لوگو", token: "{{{logos.seal}}}", hintFa: "SVG مهر پانوشت" },
    { groupFa: "نمودار", token: "{{{radarSvg}}}", hintFa: "نمودار چندوجهی لایه‌ها" },
    { groupFa: "نمودار", token: "{{{overallChartSvg}}}", hintFa: "نمودار حلقه‌ای جلد" },
    { groupFa: "خلاصه", token: "{{summaryTitleFa}}", hintFa: "عنوان خلاصه بر اساس گلوگاه" },
    { groupFa: "خلاصه", token: "{{#summaryParagraphsFa}} … {{/summaryParagraphsFa}}", hintFa: "پاراگراف‌های بازهٔ نمره" },
    { groupFa: "کلیدواژه", token: "{{#keywordGraphGroups}} … {{/keywordGraphGroups}}", hintFa: "شبکهٔ کلیدواژهٔ گلوگاه" },
    { groupFa: "کلیدواژه", token: "{{#keywords}} … {{/keywords}}", hintFa: "حلقهٔ کلیدواژه‌های هر لایه (داخل حلقهٔ لایه‌ها)" },
    { groupFa: "کلیدواژه", token: "{{scoreFa}} / {{bandLabelFa}}", hintFa: "نمره و باند کلیدواژه (داخل حلقهٔ کلیدواژه‌ها)" },
    { groupFa: "کلیدواژه", token: "{{whyFa}} / {{horizonFa}} / {{ownerRoleFa}}", hintFa: "چرایی، افق و مسئول اقدام کلیدواژه" },
    { groupFa: "کلیدواژه", token: "{{micmacLabelFa}}", hintFa: "ربع علّی MICMAC کلیدواژه" },
    { groupFa: "کلیدواژه", token: "{{#influencersFa}} / {{#influencedFa}}", hintFa: "مؤثرها و متأثرهای کلیدواژه (داخل حلقه)" },
    { groupFa: "گراف علّی", token: "{{#interventionWaves}} … {{/interventionWaves}}", hintFa: "موج‌های مداخلهٔ ریشه‌ای (با {{titleFa}} و {{#keywords}})" },
    { groupFa: "گراف علّی", token: "{{symptomTrapWarningFa}}", hintFa: "هشدار تلهٔ معلول‌درمانی" },
    { groupFa: "برگهٔ A3", token: "{{a3.backgroundFa}} / {{a3.currentConditionFa}}", hintFa: "برگهٔ حل مسئلهٔ A3: پیشینه و وضعیت فعلی" },
    { groupFa: "برگهٔ A3", token: "{{a3.organizationRootFa}} / {{a3.processRootFa}} / {{a3.performerRootFa}}", hintFa: "ریشهٔ سه‌سطحی A3" },
    { groupFa: "برگهٔ A3", token: "{{a3.targetCondition30DayFa}}", hintFa: "هدف ۳۰روزهٔ A3" },
    { groupFa: "برگهٔ A3", token: "{{a3.pdsaPlanFa}} / {{a3.pdsaDoFa}} / {{a3.pdsaStudyFa}} / {{a3.pdsaActFa}}", hintFa: "کارت آزمون PDSA" },
    { groupFa: "کلیدواژه", token: "{{bottleneckAsIsFa}}", hintFa: "وضعیت موجودِ مرجع گلوگاه" },
    { groupFa: "صفحه", token: '<section class="doc-page">', hintFa: "شروع یک برگ A4" },
    { groupFa: "صفحه", token: "</section>", hintFa: "پایان برگ" },
    { groupFa: "صفحه", token: '<div class="doc-break"></div>', hintFa: "قطع صفحه در میانه" },
    { groupFa: "نام‌های فارسی", token: "{{نام}}", hintFa: "alias نام" },
    { groupFa: "نام‌های فارسی", token: "{{نمره_کل}}", hintFa: "alias نمره" },
    { groupFa: "نام‌های فارسی", token: "{{بلوغ}}", hintFa: "alias بلوغ" },
    { groupFa: "نام‌های فارسی", token: "{{گلوگاه}}", hintFa: "alias گلوگاه" },
    { groupFa: "نام‌های فارسی", token: "{{کسب_وکار}}", hintFa: "alias کسب‌وکار" },
  ];
}

export function renderChromeDocument(chrome: DocumentChrome, doc: InterpretationDocument) {
  const ctx = documentTemplateContext(doc, chrome);
  const html = stripUnsafeHtml(renderMustache(chrome.html, ctx));
  const css = renderMustache(chrome.css, ctx);
  const layout = canonicalizeTemplateId(doc.templateId) === "casio-ss" ? "doc-casio" : "doc-hadiran";
  return {
    html,
    css,
    className: `doc-root ${layout}`,
    pageSize: chrome.pageSize,
    pageMargin: chrome.pageMargin,
  };
}

export function sampleInterpretationDocument(templateId: string): InterpretationDocument {
  return {
    packNameFa: "عارضه‌یابی پنج‌لایه",
    packSlug: "casio-ss",
    version: "پیش‌نمایش",
    templateId,
    personNameFa: "نمونهٔ پیش‌نمایش",
    businessNameFa: "کسب‌وکار نمونه",
    publicCode: "12345678",
    submittedAt: new Date().toISOString(),
    context: [
      { labelFa: "نوع کسب‌وکار", valueFa: "خدماتی" },
      { labelFa: "تعداد پرسنل", valueFa: "۱۲" },
    ],
    totalScore: 64,
    totalScoreMax: 100,
    totalFa: "۶۴",
    maturityFa: "در حال شکل‌گیری",
    bottleneckId: "layer-flow",
    bottleneckFa: "جاری‌سازی",
    bottleneckScore: 8,
    bottleneckScoreFa: "۸",
    layers: [
      {
        id: "layer-foundation",
        titleFa: "بنیان و رهبری",
        constructFa: "",
        score: 14,
        scoreMax: 20,
        scoreFa: "۱۴",
        scoreMaxFa: "۲۰",
        statusFa: "در حال بلوغ",
        asIsFa: "هدف مکتوب یک‌صفحه‌ای نیست.",
        toBeFa: "هدف یک‌صفحه‌ای با مالک مشخص.",
        actionsFa: "تدوین هدف استراتژیک یک‌صفحه‌ای",
        isBottleneck: false,
        keywords: [],
      },
      {
        id: "layer-architecture",
        titleFa: "معماری و طراحی",
        constructFa: "",
        score: 12,
        scoreMax: 20,
        scoreFa: "۱۲",
        scoreMaxFa: "۲۰",
        statusFa: "در حال شکل‌گیری",
        asIsFa: "زنجیرهٔ ارزش روی کاغذ نیست.",
        toBeFa: "نقشهٔ زنجیره ارزش مشتری.",
        actionsFa: "نقشه‌برداری زنجیره ارزش مشتری",
        isBottleneck: false,
        keywords: [],
      },
      {
        id: "layer-flow",
        titleFa: "جاری‌سازی",
        constructFa: "",
        score: 8,
        scoreMax: 20,
        scoreFa: "۸",
        scoreMaxFa: "۲۰",
        statusFa: "نوپا",
        asIsFa: "اختیار تصمیم روی میز مالک می‌ماند.",
        toBeFa: "اختیار مالی و عملیاتی مکتوب است.",
        actionsFa: "تعیین اختیارات تصمیم‌گیری",
        isBottleneck: true,
        keywords: [
          {
            id: "L3-K1",
            titleFa: "تعیین اختیارات تصمیم‌گیری",
            children: ["حدود اختیار مالی", "حدود اختیار عملیاتی", "تفویض نتیجه به‌جای تکلیف"],
          },
          {
            id: "L3-K2",
            titleFa: "آموزش مبتنی بر سناریو",
            children: ["سناریوهای پرتکرار", "آزمون مرخصی کوتاه‌مدت"],
          },
          {
            id: "L3-K3",
            titleFa: "استقلال تیم در غیاب مالک",
            children: ["پایبندی به دستورالعمل", "کاهش تفویض معکوس"],
          },
        ],
      },
      {
        id: "layer-monitor",
        titleFa: "نگهداشت و پایش",
        constructFa: "",
        score: 15,
        scoreMax: 20,
        scoreFa: "۱۵",
        scoreMaxFa: "۲۰",
        statusFa: "در حال بلوغ",
        asIsFa: "داشبورد هفتگی ناقص است.",
        toBeFa: "داشبورد عددی هفتگی.",
        actionsFa: "استقرار داشبورد عددی هفتگی",
        isBottleneck: false,
        keywords: [],
      },
      {
        id: "layer-scale",
        titleFa: "توسعه و مقیاس‌پذیری",
        constructFa: "",
        score: 15,
        scoreMax: 20,
        scoreFa: "۱۵",
        scoreMaxFa: "۲۰",
        statusFa: "در حال بلوغ",
        asIsFa: "پکیج عملیاتی استاندارد نیست.",
        toBeFa: "پکیج قابل تکرار.",
        actionsFa: "استانداردسازی پکیج عملیاتی",
        isBottleneck: false,
        keywords: [],
      },
    ],
    scores: [],
    patterns: [{ meaningFa: "گلوگاه در جاری‌سازی است.", actionFa: "اختیار را مکتوب کنید." }],
    closingFa: "نتیجهٔ این ارزیابی یک راهنمای کلی است، نه حکم قطعی.",
  };
}
