/**
 * آزمون مستقل «دروازه و ارزیابی الگوی ذهنی» (mindset-gate).
 * تفکیک‌شده از عارضه‌یابی کسب‌وکار (casio-ss) طبق قفل معماری جداسازی دامنه‌ها.
 * پشتوانهٔ نظری: Rotter (1966) Locus of Control, Bandura (1997) Self-Efficacy & Agency,
 * Lazarus & Folkman (1984) Problem-Focused Coping, Menold & Bogner (2016) GESIS 0-10 Scale.
 */

import {
  edgesFromScoredSections,
  type AnalyzerPack,
  type ScaleAnchors,
  type Section,
} from "@/lib/analyzers/pack";

export const MINDSET_INSTRUMENT_VERSION = "mindset-gate-1.0.0";

export const GATE_ANCHORS: ScaleAnchors = {
  0: "اصلاً / هرگز",
  5: "گاهی / تا حدی",
  10: "کاملاً / همیشه",
};

export const MINDSET_CONSENT_TITLE = "قبل از شروع ارزیابی الگوی ذهنی";
export const MINDSET_CONSENT_BODY = [
  "این ارزیابی کوتاه، الگوی ذهنی و شیوهٔ مواجههٔ شما با مسائل، موانع و تصمیم‌ها را در سه بُعد «منبع کنترل»، «فاعلیت و خودتنظیمی» و «تفکر مسئله‌محور» می‌سنجد.",
  "در این گزاره‌ها پاسخ درست یا غلط وجود ندارد؛ عددی را انتخاب کنید که به تجربه و رفتار واقعی شما در موقعیت‌های روزمره نزدیک‌تر است.",
  "نتیجهٔ این ارزیابی یک راهنمای شناختی است و به‌عنوان ماژول مستقل یا در کنار عارضه‌یابی کسب‌وکار قابل استفاده است.",
];

export const MINDSET_INTRO_SUMMARY =
  "ارزیابی مستقل الگوی ذهنی هادیران: ۱۲ گزاره در سه محور منبع کنترل، فاعلیت و خودتنظیمی، و تفکر مسئله‌محور روی مقیاس ۰ تا ۱۰.";

export const gateSections: Section[] = [
  {
    id: "gate-control",
    titleFa: "ارزیابی — منبع کنترل",
    introFa: "۱۲ گزاره؛ عدد نزدیک به تجربهٔ واقعی. درست یا غلط وجود ندارد.",
    items: [
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
    ],
  },
  {
    id: "gate-agency",
    titleFa: "ارزیابی — فاعلیت و خودتنظیمی",
    introFa: undefined,
    items: [
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
    ],
  },
  {
    id: "gate-problem",
    titleFa: "ارزیابی — تفکر مسئله‌محور",
    introFa: undefined,
    items: [
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
    ],
  },
];

const findings: AnalyzerPack["findings"] = [
  { id: "mindset", titleFa: "الگوی ذهنی", kind: "group" },
  { id: "gate-control", titleFa: "منبع کنترل", kind: "dimension", parentId: "mindset" },
  { id: "gate-agency", titleFa: "فاعلیت و خودتنظیمی", kind: "dimension", parentId: "mindset" },
  { id: "gate-problem", titleFa: "تفکر مسئله‌محور", kind: "dimension", parentId: "mindset" },
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
];

export const mindsetGatePack: AnalyzerPack = {
  slug: "mindset-gate",
  version: MINDSET_INSTRUMENT_VERSION,
  status: "draft",
  nameFa: "ارزیابی الگوی ذهنی",
  summaryFa: MINDSET_INTRO_SUMMARY,
  scale: { kind: "range-0-10", min: 0, max: 10 },
  consent: {
    titleFa: MINDSET_CONSENT_TITLE,
    bodyFa: MINDSET_CONSENT_BODY,
    acceptLabelFa: "خواندم و موافقم",
  },
  sections: gateSections,
  findings,
  keywords: [],
  edges: edgesFromScoredSections(gateSections),
  formulas,
  report: {
    hideGateScores: false,
    closingFa: "نتیجهٔ این ارزیابی یک راهنمای شناختی است، نه حکم قطعی دربارهٔ شخصیت شما.",
  },
};
