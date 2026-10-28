/**
 * مرحلهٔ ۳ (Slice 3): گراف هستی‌شناسی تشخیصی (Ontology Graph) متصل به Research Vaults.
 * پیوند چندبه‌چند میان ۱۵ کلیدواژه و ۷۵ زیرکلیدواژهٔ کاسیو با:
 * - ۳۹ گرهٔ مفهومی در Research Vaults
 * - ۵۵ منبع علمی (S001–S055)
 * - ماتریس ۹ خانه‌ای و ۳ سطح عملکرد Rummler & Brache (1995/2012 — S052)
 * - مدل هم‌خوانی سازمانی Nadler & Tushman (1980 — S055)
 */

import type { LayerKeyword, RummlerLevel } from "./interpretation";

export type VaultConceptNode = {
  id: string;
  titleFa: string;
  layerFamily: "governance" | "architecture" | "implementation" | "monitoring" | "scaling" | "methodology";
  summaryFa: string;
  sourceIds: string[];
};

export type ResearchSourceNode = {
  id: string;
  shortCitation: string;
  titleFa: string;
  coreTakeawayFa: string;
};

export type RummlerNeed = "goals" | "design" | "management";

export type KeywordOntologyEntry = {
  keywordId: string;
  rummlerLevel: RummlerLevel;
  rummlerNeed: RummlerNeed;
  rummlerCellLabelFa: string;
  nadlerPairFa: string;
  vaultConceptIds: string[];
  sourceIds: string[];
};

export type RummlerLevelSummary = {
  level: RummlerLevel;
  titleFa: string;
  labelFa: string;
  meanScore: number;
  avgScore: number;
  weakestKeywordId: string;
  weakestKeywordTitleFa: string;
  diagnosisFa: string;
};

export type OntologyDiagnosis = {
  dominantRummlerLevel: RummlerLevelSummary;
  rummlerBreakdown: RummlerLevelSummary[];
  primaryNadlerDisconnectFa: string;
  activatedConcepts: VaultConceptNode[];
  activatedSources: ResearchSourceNode[];
};

export type OntologyDiagnosisSummary = OntologyDiagnosis;

export const VAULT_CONCEPTS: Record<string, VaultConceptNode> = {
  "حاکمیت سازمانی": {
    id: "concept-governance",
    titleFa: "حاکمیت سازمانی",
    layerFamily: "governance",
    summaryFa: "تعیین جهت، ساختار تصمیم‌گیری، مرز مالی مالک و کسب‌وکار و سازوکار پاسخ‌گویی متناسب با مرحلهٔ رشد.",
    sourceIds: ["S036", "S037", "S038"],
  },
  "هم‌راستایی و انسجام": {
    id: "concept-alignment",
    titleFa: "هم‌راستایی و انسجام",
    layerFamily: "governance",
    summaryFa: "هم‌جهت کردن اهداف راهبردی، شاخص‌های واحدها و تصمیم‌های روزمره حول یک مقصد مکتوب.",
    sourceIds: ["S036", "S052", "S055"],
  },
  "زمینه": {
    id: "concept-context",
    titleFa: "زمینه",
    layerFamily: "methodology",
    summaryFa: "تناسب طراحی سیستم و حاکمیت با اندازهٔ تیم، مرحلهٔ رشد، صنعت و قدمت سازمان.",
    sourceIds: ["S036", "S040", "S055"],
  },
  "پایداری و ریسک": {
    id: "concept-sustainability-risk",
    titleFa: "پایداری و ریسک",
    layerFamily: "governance",
    summaryFa: "حفاظت از جریان نقد، انضباط مالی و جلوگیری از وابستگی حیات سازمان به یک فرد.",
    sourceIds: ["S036", "S023", "S045"],
  },
  "تفویض اختیار": {
    id: "concept-delegation",
    titleFa: "تفویض اختیار",
    layerFamily: "implementation",
    summaryFa: "انتقال ساختاریافتهٔ حق تصمیم‌گیری و مالکیت نتیجه (نه صرفاً واگذاری تکلیف) همراه با حدود اختیار روشن.",
    sourceIds: ["S038", "S040", "S041", "S042"],
  },
  "خودمختاری": {
    id: "concept-autonomy",
    titleFa: "خودمختاری",
    layerFamily: "implementation",
    summaryFa: "توانایی و فضای عمل تیم برای تصمیم‌گیری مستقل در چارچوب استانداردها بدون ارجاع معکوس به مدیر.",
    sourceIds: ["S040", "S041", "S042"],
  },
  "مدیریت تغییر": {
    id: "concept-change-management",
    titleFa: "مدیریت تغییر",
    layerFamily: "implementation",
    summaryFa: "همراه‌سازی شناختی و رفتاری افراد در گذار از عادت‌های فردی به روال‌های سیستمی (ADKAR / SDT).",
    sourceIds: ["S015", "S018", "S042"],
  },
  "مدیریت فرایند کسب‌وکار": {
    id: "concept-bpm",
    titleFa: "مدیریت فرایند کسب‌وکار",
    layerFamily: "architecture",
    summaryFa: "دید افقی و انتهابه‌انتها به جریان خلق ارزش برای مشتری در سراسر مرزهای سازمانی.",
    sourceIds: ["S007", "S039", "S052"],
  },
  "کشف فرایند": {
    id: "concept-process-discovery",
    titleFa: "کشف فرایند",
    layerFamily: "architecture",
    summaryFa: "استخراج وضعیت واقعی اجرای کار (AS-IS) و دانش ضمنی مجریان پیش از استانداردسازی یا اتوماسیون.",
    sourceIds: ["S010", "S030", "S034", "S039"],
  },
  "طراحی سیستم": {
    id: "concept-system-design",
    titleFa: "طراحی سیستم",
    layerFamily: "architecture",
    summaryFa: "معماری اجزا، ورودی‌ها، خروجی‌ها و نقاط تحویل کار به‌گونه‌ای که خطای انسانی به حداقل برسد.",
    sourceIds: ["S039", "S052", "S055"],
  },
  "مستندسازی": {
    id: "concept-documentation",
    titleFa: "مستندسازی",
    layerFamily: "architecture",
    summaryFa: "تبدیل دانش شفاهی و پراکنده به دارایی مکتوب، قابل آموزش و قابل بازنگری.",
    sourceIds: ["S010", "S029", "S034"],
  },
  "روش اجرای کار (SOP)": {
    id: "concept-sop",
    titleFa: "روش اجرای کار (SOP)",
    layerFamily: "architecture",
    summaryFa: "دستورالعمل گام‌به‌گام، چک‌لیست و معیار پذیرش برای اجرای یکنواخت کارهای پرتکرار.",
    sourceIds: ["S012", "S039", "S046", "S050"],
  },
  "استانداردسازی": {
    id: "concept-standardization",
    titleFa: "استانداردسازی",
    layerFamily: "architecture",
    summaryFa: "تثبیت بهترین روش فعلی اجرای کار به‌عنوان خط پایهٔ کیفیت و بهبود مستمر.",
    sourceIds: ["S048", "S049", "S050"],
  },
  "مدیریت فضای خالی": {
    id: "concept-whitespace",
    titleFa: "مدیریت فضای خالی نمودار سازمانی",
    layerFamily: "architecture",
    summaryFa: "مدیریت نقاط تحویل کار (Handoffs) در مرز بین نقش‌ها و واحدها که بیشترین هدررفت در آن رخ می‌دهد.",
    sourceIds: ["S052"],
  },
  "جاری‌سازی": {
    id: "concept-implementation",
    titleFa: "جاری‌سازی",
    layerFamily: "implementation",
    summaryFa: "تبدیل فرآیندهای مکتوب به رفتار روزمرهٔ پایدار و جلوگیری از انفکاک سیاست از عمل.",
    sourceIds: ["S015", "S031", "S042"],
  },
  "یادگیری و انتقال": {
    id: "concept-learning-transfer",
    titleFa: "یادگیری و انتقال به کار",
    layerFamily: "implementation",
    summaryFa: "آموزش مبتنی بر سناریو و اطمینان از به کارگیری واقعی آموخته‌ها در موقعیت‌های شغلی.",
    sourceIds: ["S031", "S042"],
  },
  "تکرارپذیری": {
    id: "concept-repeatability",
    titleFa: "تکرارپذیری",
    layerFamily: "implementation",
    summaryFa: "قابلیت اجرای کار با کیفیت قابل پیش‌بینی توسط افراد واجد شرایط دیگر و در غیاب مالک.",
    sourceIds: ["S028", "S039", "S046"],
  },
  "پایش": {
    id: "concept-monitoring",
    titleFa: "پایش",
    layerFamily: "monitoring",
    summaryFa: "رصد منظم وضعیت سیستم با شاخص‌های پیش‌نگر و پس‌نگر برای تشخیص زودهنگام انحراف.",
    sourceIds: ["S039", "S043", "S049", "S050"],
  },
  "شاخص کلیدی عملکرد (KPI)": {
    id: "concept-kpi",
    titleFa: "شاخص کلیدی عملکرد (KPI)",
    layerFamily: "monitoring",
    summaryFa: "سنجه‌های کمیِ متصل به اهداف راهبردی و خروجی فرآیندها به همراه آستانهٔ هشدار روشن.",
    sourceIds: ["S039", "S043", "S052"],
  },
  "بهبود مستمر": {
    id: "concept-continuous-improvement",
    titleFa: "بهبود مستمر (PDSA / PDCA)",
    layerFamily: "monitoring",
    summaryFa: "چرخهٔ علمی آزمون تغییرات کوچک، سنجش اثر و استانداردسازی اصلاحات.",
    sourceIds: ["S022", "S043", "S049"],
  },
  "حل مسئله و A3": {
    id: "concept-a3-problem-solving",
    titleFa: "حل مسئله و A3",
    layerFamily: "monitoring",
    summaryFa: "چارچوب یک‌صفحه‌ای تعریف مسئله، شواهد، ریشه‌یابی چندعاملی، اقدام متقابل و پیگیری نتیجه.",
    sourceIds: ["S044", "S048", "S050", "S051"],
  },
  "تحلیل علت ریشه‌ای": {
    id: "concept-rca",
    titleFa: "تحلیل علت ریشه‌ای (RCA)",
    layerFamily: "monitoring",
    summaryFa: "کالبدشکافی علل سیستمی و فرآیندی خطاها به‌جای توقف در مقصرانگاری فردی یا علت واحد سطحی.",
    sourceIds: ["S051", "S053", "S054"],
  },
  "مقیاس‌پذیری": {
    id: "concept-scalability",
    titleFa: "مقیاس‌پذیری",
    layerFamily: "scaling",
    summaryFa: "توانایی افزایش چندبرابری خروجی و درآمد بدون افزایش خطی در هزینه، خطا و ساعت کاری مالک.",
    sourceIds: ["S036", "S045", "S046"],
  },
  "فرانچایز و تکثیر": {
    id: "concept-franchise-replication",
    titleFa: "فرانچایز و تکثیر (Arrow Core)",
    layerFamily: "scaling",
    summaryFa: "بسته‌بندی هستهٔ استاندارد عملیات و انتقال دانش برای تکثیر شعب یا خطوط جدید بدون حضور مالک.",
    sourceIds: ["S045", "S046", "S047"],
  },
  "اقتصاد واحد": {
    id: "concept-unit-economics",
    titleFa: "اقتصاد واحد (Unit Economics)",
    layerFamily: "scaling",
    summaryFa: "پایداری حاشیهٔ سود مشارکت و کنترل زمان و هزینهٔ نهایی تحویل خدمت به ازای هر مشتری جدید.",
    sourceIds: ["S023", "S045"],
  },
};

export const RESEARCH_SOURCES: Record<string, ResearchSourceNode> = {
  S001: {
    id: "S001",
    shortCitation: "Rotter (1966) — Psychological Monographs",
    titleFa: "کانون کنترل درونی و بیرونی در تصمیم‌گیری",
    coreTakeawayFa: "نسبت دادن نتایج به تصمیم‌ها و سیستم قابل‌کنترل (به‌جای شانس و عوامل بیرونی) پیش‌شرط اقدام اصلاحی است.",
  },
  S002: {
    id: "S002",
    shortCitation: "Bandura (1997) — Self-Efficacy: The Exercise of Control",
    titleFa: "خودکارآمدی و عاملیت در حل مسائل پیچیده",
    coreTakeawayFa: "باور مبتنی بر شواهد به توانایی بازطراحی سیستم، پشتکار مدیر را در برابر موانع اجرایی حفظ می‌کند.",
  },
  S003: {
    id: "S003",
    shortCitation: "Dweck (2006) — Mindset: The New Psychology of Success",
    titleFa: "ذهنیت رشد در برابر ذهنیت ثابت در رهبری سازمان",
    coreTakeawayFa: "نگاه به خطاها به‌عنوان دادهٔ یادگیری و اصلاح فرایند، سازمان را از فرهنگ پنهان‌کاری و مقصرانگاری رها می‌سازد.",
  },
  S004: {
    id: "S004",
    shortCitation: "Weiner (1985) — Attribution Theory",
    titleFa: "نظریهٔ اسناد علّی در تحلیل شکست و موفقیت",
    coreTakeawayFa: "اسناد شکست به عوامل پایدار و غیرقابل‌کنترل، چرخهٔ حل مسئلهٔ ریشه‌ای را متوقف می‌کند.",
  },
  S005: {
    id: "S005",
    shortCitation: "D'Zurilla & Nezu (2007) — Problem-Solving Therapy",
    titleFa: "جهت‌گیری سازنده در برابر اجتنابی نسبت به مسئله",
    coreTakeawayFa: "تعریف دقیق مسئله، تولید گزینه‌های راه‌حل و ارزیابی سیستماتیک نتایج، جایگزین واکنش شتاب‌زده و هیجانی است.",
  },
  S006: {
    id: "S006",
    shortCitation: "Kahneman (2011) — Thinking, Fast and Slow",
    titleFa: "سیستم ۱ و سیستم ۲ در قضاوت و تصمیم‌گیری مدیریتی",
    coreTakeawayFa: "تصمیم‌های راهبردی و تشخیصی نیازمند کند کردن قضاوت شهودی و اتکا به چک‌لیست و دادهٔ پایه است.",
  },
  S007: {
    id: "S007",
    shortCitation: "Edmondson (1999) — Administrative Science Quarterly",
    titleFa: "امنیت روانی و یادگیری تیمی در سازمان",
    coreTakeawayFa: "بدون امنیت روانی برای گزارش زودهنگام خطا و باگ فرآیندی، هیچ داشبورد و چرخهٔ اصلاحی دادهٔ واقعی دریافت نمی‌کند.",
  },
  S008: {
    id: "S008",
    shortCitation: "Argyris (1977/1991) — HBR Double-Loop Learning",
    titleFa: "یادگیری تک‌حلقه‌ای و دوحلقه‌ای در سازمان",
    coreTakeawayFa: "اصلاح پایدار نیازمند زیر سؤال بردن مفروضات و طراحی سیستم (حلقهٔ دوم) است، نه صرفاً وصله‌پینهٔ علائم.",
  },
  S009: {
    id: "S009",
    shortCitation: "Simon (1947/1997) — Administrative Behavior",
    titleFa: "عقلانیت محدود و معماری مقدمات تصمیم در سازمان",
    coreTakeawayFa: "سازمان با طراحی رویه‌ها، کانال‌های اطلاعاتی و حدود اختیار، بار شناختی تصمیم‌گیری فردی را مهار می‌کند.",
  },
  S010: {
    id: "S010",
    shortCitation: "Mintzberg (1979/1983) — Structuring of Organizations",
    titleFa: "مکانیزم‌های پنج‌گانهٔ هماهنگی و طراحی ساختار سازمانی",
    coreTakeawayFa: "گذار از نظارت مستقیم مالک به استانداردسازی فرایند کار و مهارت‌ها، شرط عبور از سقف رشد کارگاهی است.",
  },
  S011: {
    id: "S011",
    shortCitation: "Greiner (1972/1998) — HBR Evolution and Revolution",
    titleFa: "پنج مرحلهٔ رشد سازمان و بحران‌های گذار",
    coreTakeawayFa: "هر مرحلهٔ رشد با یک بحران ساختاری (رهبری، خودمختاری، کنترل، بوروکراسی) پایان می‌یابد که با ابزار مرحلهٔ قبل حل نمی‌شود.",
  },
  S012: {
    id: "S012",
    shortCitation: "Churchill & Lewis (1983) — HBR Five Stages of Small Business Growth",
    titleFa: "پنج مرحلهٔ بلوغ کسب‌وکارهای کوچک و جدایی مالک از عملیات",
    coreTakeawayFa: "شاخص اصلی بلوغ SME، کاهش وابستگی عملیات روزمره به حضور شخص بنیان‌گذار و استقرار سیستم‌های مدیریتی است.",
  },
  S013: {
    id: "S013",
    shortCitation: "Gerber (1986/2001) — The E-Myth Revisited",
    titleFa: "کار روی کسب‌وکار در برابر کار در درون کسب‌وکار",
    coreTakeawayFa: "تا زمانی که مالک در نقش تکنسینِ مجری قفل شده باشد، معماری سیستم و توسعهٔ کسب‌وکار شکل نمی‌گیرد.",
  },
  S014: {
    id: "S014",
    shortCitation: "Hammer (2007) — HBR The Process Audit (PEMM)",
    titleFa: "ممیزی بلوغ فرایند و توانمندسازهای سازمانی (PEMM)",
    coreTakeawayFa: "پایداری فرایندها وابسته به ۵ توانمندساز (طراحی، مجریان، مالک فرایند، زیرساخت و سنجه‌ها) و ۴ قابلیت سازمانی است.",
  },
  S015: {
    id: "S015",
    shortCitation: "Bromley & Powell (2012) — Academy of Management Annals",
    titleFa: "از سیاست تا عمل: انفکاک سیاست از اجرا و انفکاک وسیله از هدف",
    coreTakeawayFa: "نوشتن SOP بدون جاری‌سازی (انفکاک سیاست-عمل) یا اجرای تشریفاتی بدون خلق ارزش (انفکاک وسیله-هدف) دو آفت اصلی سیستم‌سازی‌اند.",
  },
  S016: {
    id: "S016",
    shortCitation: "Gawande (2009) — The Checklist Manifesto",
    titleFa: "مهار خطاهای پیچیده با چک‌لیست‌های نقاط بحرانی و تحویل کار",
    coreTakeawayFa: "چک‌لیست‌های کوتاه در نقاط گلوگاهی و تحویل بین‌واحدی، خطای فراموشی و ناهماهنگی را به حداقل می‌رسانند.",
  },
  S017: {
    id: "S017",
    shortCitation: "de la Torre (2011); Ma & de la Torre (2016) — G-DINA / pG-DINA",
    titleFa: "مدل‌های تشخیص شناختی و ماتریس Q چندارزشی",
    coreTakeawayFa: "هر گویهٔ تشخیصی می‌تواند با وزن‌های متفاوت به چندین مهارت/کلیدواژهٔ پنهان در ماتریس Q متصل شود.",
  },
  S018: {
    id: "S018",
    shortCitation: "Fontela & Gabus (1976); Duperrin & Godet (1973) — DEMATEL & MICMAC",
    titleFa: "تحلیل ماتریس اثرات کل علّی (DEMATEL) و طبقه‌بندی پیشران-وابسته (MICMAC)",
    coreTakeawayFa: "تفکیک گره‌های «مؤثر ریشه‌ای» ($D-R > 0$) از «متأثر وابسته» ($D-R < 0$) از تلهٔ معلول‌درمانی جلوگیری می‌کند.",
  },
  S019: {
    id: "S019",
    shortCitation: "Warfield (1974) — Interpretive Structural Modeling (ISM)",
    titleFa: "مدلسازی ساختاری تفسیری و سلسله‌مراتب پیش‌نیازها",
    coreTakeawayFa: "مرتب‌سازی سطوح علّی نشان می‌دهد کدام قابلیت‌های پایه در قاعدهٔ هرم باید پیش از خروجی‌های رأس هرم اصلاح شوند.",
  },
  S020: {
    id: "S020",
    shortCitation: "Kosko (1986); Osoba & Kosko (2019) — Fuzzy Cognitive Maps (FCM)",
    titleFa: "نگاشت‌های شناختی فازی و حلقه‌های بازخورد علّی در سیستم‌ها",
    coreTakeawayFa: "در سیستم‌های واقعی کسب‌وکار، حلقه‌های بازخورد سایبرنتیک (مانند پایش و اصلاح استانداردها) به اندازهٔ پیش‌نیازهای خطی اهمیت دارند.",
  },
  S021: {
    id: "S021",
    shortCitation: "Hambrick & Mason (1984); Miller et al. (1982) — Upper Echelons",
    titleFa: "نظریهٔ رده‌های عالی و اثر الگوی ذهنی مدیر بر ساختار سازمان",
    coreTakeawayFa: "ساختار اجرایی، میزان تفویض اختیار و افق برنامه‌ریزی سازمان بازتاب مستقیم الگوی شناختی و کانون کنترل مدیر ارشد است.",
  },
  S022: {
    id: "S022",
    shortCitation: "Taylor et al. (2014) — BMJ Quality & Safety",
    titleFa: "مرور سیستماتیک کاربرد چرخهٔ PDSA",
    coreTakeawayFa: "اصلاح پایدار نیازمند آزمون‌های کوچک، فرضیهٔ روشن و بازبینی مستمر در چرخهٔ PDSA است.",
  },
  S023: {
    id: "S023",
    shortCitation: "Measure Twice, Cut Once (2025) — Strategic Entrepreneurship",
    titleFa: "اقتصاد واحد، انضباط مالی و مقیاس‌پذیری پایدار",
    coreTakeawayFa: "شتاب‌دهی به رشد پیش از اثبات سودآوری واحد و تفکیک حساب‌های مالی، ریسک فروپاشی نقدینگی را افزایش می‌دهد.",
  },
  S024: {
    id: "S024",
    shortCitation: "Jensen & Meckling (1976); Fama & Jensen (1983)",
    titleFa: "تفکیک تصمیم‌سازی از کنترل و مدیریت حقوق تصمیم‌گیری",
    coreTakeawayFa: "تخصیص حق تصمیم به کسانی که دانش عملیاتی دارند همراه با پایش خروجی، کارایی سازمان را افزایش می‌دهد.",
  },
  S025: {
    id: "S025",
    shortCitation: "Dumas et al. (2018) — Fundamentals of BPM",
    titleFa: "مبانی مدیریت فرایندهای کسب‌وکار و زنجیرهٔ ارزش",
    coreTakeawayFa: "معماری فرایند باید از نقشهٔ کلان زنجیرهٔ ارزش مشتری آغاز شده و به روال‌های اجرایی بشکند.",
  },
  S026: {
    id: "S026",
    shortCitation: "Galbraith (1973/2014) — Designing Organizations (Star Model)",
    titleFa: "مدل ستاره‌ای طراحی سازمان و ظرفیت پردازش اطلاعات",
    coreTakeawayFa: "هرچه عدم‌قطعیت کار بیشتر باشد، نیاز به استانداردسازی رابط‌ها، قوانین تصمیم‌گیری و شاخص‌های نتیجه بیشتر است.",
  },
  S027: {
    id: "S027",
    shortCitation: "Baldwin & Clark (2000) — Design Rules: The Power of Modularity",
    titleFa: "معماری ماژولار و استقلال زیرسیستم‌های سازمانی",
    coreTakeawayFa: "تعریف مرز و پروتکل تبادل روشن میان زیرسیستم‌ها امکان رشد و ارتقای هر بخش را بدون اختلال در کل سیستم فراهم می‌کند.",
  },
  S028: {
    id: "S028",
    shortCitation: "Kaplan & Norton (1996) — Balanced Scorecard",
    titleFa: "داشبورد متوازن شاخص‌های پیش‌نگر و پس‌نگر",
    coreTakeawayFa: "پایش صرفِ نتایج مالی گذشته بدون شاخص‌های پیش‌نگر فرآیندی، امکان مداخلهٔ به‌موقع را از مدیر می‌گیرد.",
  },
  S029: {
    id: "S029",
    shortCitation: "Lencioni (2004/2012) — Organizational Health & Cadence",
    titleFa: "ریتم جلسات عملیاتی و هم‌راستایی تیم مدیریتی",
    coreTakeawayFa: "جلسات هفتگی کوتاه، داده‌محور و دارای مصوبهٔ پیگیری‌شونده، ستون فقرات هماهنگی اجرایی است.",
  },
  S030: {
    id: "S030",
    shortCitation: "Brown, Power & Gore (2025) — Organizational Research Methods",
    titleFa: "تحلیل شناختی وظیفه (CTA) برای استخراج دانش خبره",
    coreTakeawayFa: "برای مستندسازی کارهای کلیدی باید تصمیم‌ها، نشانه‌ها و استثناهای ذهنی مجریان را استخراج کرد.",
  },
  S031: {
    id: "S031",
    shortCitation: "CDC (2024) — Measuring Training Effectiveness",
    titleFa: "سنجش اثربخشی آموزش و انتقال یادگیری به کار",
    coreTakeawayFa: "آموزش زمانی اثربخش است که به تغییر رفتار واقعی در محیط کار منجر شود، نه صرفاً برگزاری جلسهٔ آموزشی.",
  },
  S032: {
    id: "S032",
    shortCitation: "Nonaka & Takeuchi (1995) — Knowledge-Creating Company",
    titleFa: "تبدیل دانش ضمنی فردی به دانش صریح سازمانی (SECI)",
    coreTakeawayFa: "بدون برونی‌سازی دانش ضمنی افراد کلیدی در قالب سناریو و چک‌لیست، سازمان گروگان حافظهٔ افراد می‌ماند.",
  },
  S033: {
    id: "S033",
    shortCitation: "Hackman & Oldham (1976) — Job Characteristics Model",
    titleFa: "طراحی شغل، شفافیت بازخورد و مالکیت نتیجه",
    coreTakeawayFa: "ایجاد هویت وظیفه، خودمختاری چارچوب‌دار و بازخورد مستقیم از کار، انگیزهٔ درونی و کیفیت اجرا را ارتقا می‌دهد.",
  },
  S034: {
    id: "S034",
    shortCitation: "Hannan & Freeman (1984); Gilbert (2005) — Structural Inertia",
    titleFa: "لَختی ساختاری و انجماد روال‌ها در سازمان‌های باسابقه",
    coreTakeawayFa: "با افزایش سن سازمان، عادت‌های نانوشته به مانع تغییر تبدیل می‌شوند مگر آنکه چرخهٔ بازنگری مستمر فعال باشد.",
  },
  S035: {
    id: "S035",
    shortCitation: "Hayes & Wheelwright (1979); Silvestro (1999) — Process Matrix",
    titleFa: "ماتریس حجم-تنوع در طراحی سیستم‌های تولیدی و خدماتی",
    coreTakeawayFa: "کسب‌وکارهای سفارشی به چک‌لیست تحویل و مرزبندی دامنه و کسب‌وکارهای پرتکرار به استانداردسازی زمان و هزینهٔ واحد نیاز دارند.",
  },
  S036: {
    id: "S036",
    shortCitation: "IFC / World Bank (2019) — Ryabota et al.",
    titleFa: "حاکمیت برای پایداری و رشد SMEها در ۴ مرحله",
    coreTakeawayFa: "ابزارهای حاکمیتی، تفکیک مالی و ساختار تصمیم‌گیری باید دقیقاً متناسب با مرحلهٔ رشد و اندازهٔ سازمان طراحی شوند.",
  },
  S037: {
    id: "S037",
    shortCitation: "Brunninge, Nordqvist & Wiklund (2007) — Small Business Economics",
    titleFa: "حاکمیت شرکتی و تغییر راهبردی در SMEها",
    coreTakeawayFa: "تمرکز بیش از حد مالکیت و مدیریت در یک شخص، توان بازآرایی راهبردی را محدود می‌کند.",
  },
  S038: {
    id: "S038",
    shortCitation: "Ahmadi et al. (2022)",
    titleFa: "مدیریت بار شناختی و بازطراحی نقش مدیر در کسب‌وکارهای در حال رشد",
    coreTakeawayFa: "رهایی مدیر از تلهٔ عملیاتی نیازمند بازطراحی مرز نقش‌ها و کاهش بار تصمیم‌های خرد روزمره است.",
  },
  S039: {
    id: "S039",
    shortCitation: "Teixeira et al. (2024) — BPM Case Study",
    titleFa: "بهینه‌سازی فرایند کسب‌وکار با روش‌شناسی BPM",
    coreTakeawayFa: "کشف دقیق فرایند موجود (AS-IS) و حذف گلوگاه‌های تحویل کار باید پیش از اتوماسیون انجام شود.",
  },
  S040: {
    id: "S040",
    shortCitation: "Theurer et al. (2018)",
    titleFa: "طراحی کار زمینه‌مند و خودمختاری کارکنان",
    coreTakeawayFa: "خودمختاری زمانی به عملکرد بالا منجر می‌شود که با شفافیت نقش و چارچوب تصمیم‌گیری همراه باشد.",
  },
  S041: {
    id: "S041",
    shortCitation: "Zhang et al. (2017)",
    titleFa: "رهبری توانمندساز، تفویض اختیار و عملکرد تیم",
    coreTakeawayFa: "تفویض اختیار مؤثر نیازمند انتقال هم‌زمان مسئولیت و حدود روشن تصمیم‌گیری است.",
  },
  S042: {
    id: "S042",
    shortCitation: "Hardré & Reeve (2009) — SDT in Organizations",
    titleFa: "پشتیبانی از خودمختاری و درگیری شغلی کارکنان",
    coreTakeawayFa: "درک چرایی استانداردها و تمرین سناریومحور، پایبندی درونی تیم به روال‌ها را جایگزین کنترل پلیسی می‌کند.",
  },
  S043: {
    id: "S043",
    shortCitation: "Peças et al. (2021) — PDCA 4.0",
    titleFa: "ارتقای چرخهٔ PDCA با پایش داده‌محور",
    coreTakeawayFa: "اتصال داشبورد شاخص‌های کلیدی به ریتم بازبینی هفتگی، حلقهٔ پایش و اصلاح را کوتاه می‌کند.",
  },
  S044: {
    id: "S044",
    shortCitation: "Argote & Ingram (2000) — Knowledge Transfer in Organizations",
    titleFa: "انتقال دانش در تعاملات کاری و تداوم عملیاتی",
    coreTakeawayFa: "ذخیرهٔ دانش در روال‌ها و ابزارها (به‌جای حافظهٔ یک فرد) شرط تداوم کار در غیاب افراد کلیدی است.",
  },
  S045: {
    id: "S045",
    shortCitation: "Belingheri & Lechner (2023)",
    titleFa: "گذار از استارتاپ به اسکیل‌آپ",
    coreTakeawayFa: "مقیاس‌پذیری نیازمند استانداردسازی عملیات، اقتصاد واحد مثبت و زیرساخت ماژولار پیش از شتاب‌دهی به فروش است.",
  },
  S046: {
    id: "S046",
    shortCitation: "International Franchise Association (IFA)",
    titleFa: "چهار ستون تکثیر و فرانچایز موفق",
    coreTakeawayFa: "کتابچهٔ عملیات استاندارد، سیستم آموزش، کنترل کیفیت و اقتصاد واحد، چهار ستون تکثیر بدون حضور مالک‌اند.",
  },
  S047: {
    id: "S047",
    shortCitation: "Winter & Szulanski (2001); Ringov et al. (2026) — Replication Strategy",
    titleFa: "استراتژی تکثیر و استخراج هستهٔ استاندارد (Arrow Core)",
    coreTakeawayFa: "تکثیر موفق نیازمند جداسازی «هستهٔ تکرارپذیر ارزش» از بداهه‌پردازی‌های محلی پیش از افتتاح شعب جدید است.",
  },
  S048: {
    id: "S048",
    shortCitation: "Rother (2009) — Toyota Kata",
    titleFa: "کاتاهای بهبود و مربی‌گری روزمره در پایش فرآیند",
    coreTakeawayFa: "پایش مستمر فاصلهٔ وضعیت موجود تا وضعیت هدف در گام‌های کوتاه، بهبود را به عادت سازمانی تبدیل می‌کند.",
  },
  S049: {
    id: "S049",
    shortCitation: "Deming (1986/1993) — Out of the Crisis",
    titleFa: "مدیریت سیستمی کیفیت و قاعدهٔ خطای سیستم در برابر فرد",
    coreTakeawayFa: "بیش از ۹۰٪ خطاهای تکرارشونده ریشه در طراحی سیستم و فرآیند دارند، نه کم‌کاری فردی.",
  },
  S050: {
    id: "S050",
    shortCitation: "Ishikawa (1985) — Guide to Quality Control",
    titleFa: "راهنمای کنترل کیفیت و استانداردسازی فرایند",
    coreTakeawayFa: "استانداردی که در عمل بازبینی و هنگام بروز خطا اصلاح نشود، تنها یک سند تشریفاتی است.",
  },
  S051: {
    id: "S051",
    shortCitation: "Shook (2008) — Managing to Learn (A3)",
    titleFa: "مدیریت برای یادگیری: فرایند حل مسئلهٔ A3",
    coreTakeawayFa: "برگهٔ A3 ابزاری برای گفت‌وگوی علمی، تعریف شکاف قابل اندازه‌گیری و مالکیت حل مسئله است.",
  },
  S052: {
    id: "S052",
    shortCitation: "Rummler & Brache (1995/2012) — Improving Performance",
    titleFa: "بهبود عملکرد: مدیریت فضای خالی نمودار سازمانی",
    coreTakeawayFa: "عملکرد باید در ۳ سطح «سازمان»، «فرایند (فضای خالی بین واحدها)» و «شغل/مجری» هم‌راستا شود.",
  },
  S053: {
    id: "S053",
    shortCitation: "Womack & Jones (1996/2003) — Lean Thinking",
    titleFa: "تفکر ناب، جریان ارزش و حذف هدررفت در نقاط تحویل",
    coreTakeawayFa: "شناسایی جریان ارزش از دید مشتری و حذف توقف‌ها در مرز واحدها، زمان تحویل و خطای دوباره‌کاری را به حداقل می‌رساند.",
  },
  S054: {
    id: "S054",
    shortCitation: "Peerally et al. (2017) — BMJ Quality & Safety",
    titleFa: "نقد تحلیل علت ریشه‌ای تک‌عاملی و تشریفاتی",
    coreTakeawayFa: "تحلیل علت ریشه‌ای نباید در یافتن یک مقصر یا یک علت سطحی متوقف شود؛ باید موانع سیستمی اصلاح شوند.",
  },
  S055: {
    id: "S055",
    shortCitation: "Nadler & Tushman (1980) — Organizational Dynamics",
    titleFa: "مدل هم‌خوانی سازمانی (Congruence Model)",
    coreTakeawayFa: "ریشهٔ افت عملکرد، عدم هم‌خوانی میان چهار رکن «کار»، «افراد»، «ساختار رسمی» و «فرهنگ غیررسمی» است.",
  },
};

const RUMMLER_TITLES_FA: Record<RummlerLevel, string> = {
  organization: "سطح ۱: کلان سازمان، راهبرد و مدل اقتصادی (Organization Level)",
  process_whitespace: "سطح ۲: فرایندهای افقی و فضای خالی بین نقش‌ها (Process & White Space Level)",
  job_performer: "سطح ۳: شغل، مجری و حدود اختیار (Job / Performer Level)",
};

export const KEYWORD_ONTOLOGY: KeywordOntologyEntry[] = [
  {
    keywordId: "L1-K1",
    rummlerLevel: "organization",
    rummlerNeed: "goals",
    rummlerCellLabelFa: "سطح سازمان × اهداف راهبردی (Organization Goals)",
    nadlerPairFa: "هم‌خوانی راهبرد کلان با کار و ساختار رسمی (Strategy ↔ Task & Formal Organization)",
    vaultConceptIds: ["حاکمیت سازمانی", "هم‌راستایی و انسجام", "زمینه"],
    sourceIds: ["S036", "S052", "S055"],
  },
  {
    keywordId: "L1-K2",
    rummlerLevel: "organization",
    rummlerNeed: "management",
    rummlerCellLabelFa: "سطح سازمان × مدیریت منابع و انضباط مالی (Organization Management)",
    nadlerPairFa: "هم‌خوانی ساختار رسمی با رفتار غیررسمی مالک (Formal Organization ↔ Informal Culture)",
    vaultConceptIds: ["حاکمیت سازمانی", "پایداری و ریسک", "پایش"],
    sourceIds: ["S036", "S037", "S023"],
  },
  {
    keywordId: "L1-K3",
    rummlerLevel: "organization",
    rummlerNeed: "design",
    rummlerCellLabelFa: "سطح سازمان × طراحی نقش رهبری و گلوگاه مالک (Organization Design)",
    nadlerPairFa: "هم‌خوانی نقش مالک با ساختار توزیع کار (Individual/Founder ↔ Task & Formal Structure)",
    vaultConceptIds: ["حاکمیت سازمانی", "تفویض اختیار", "خودمختاری"],
    sourceIds: ["S038", "S040", "S041", "S042"],
  },
  {
    keywordId: "L2-K1",
    rummlerLevel: "process_whitespace",
    rummlerNeed: "design",
    rummlerCellLabelFa: "سطح فرایند × طراحی زنجیرهٔ ارزش افقی (Process Design)",
    nadlerPairFa: "هم‌خوانی جریان کار با ساختار واحدها (Task Flow ↔ Formal Structure)",
    vaultConceptIds: ["مدیریت فرایند کسب‌وکار", "کشف فرایند", "طراحی سیستم"],
    sourceIds: ["S025", "S039", "S052", "S053"],
  },
  {
    keywordId: "L2-K2",
    rummlerLevel: "process_whitespace",
    rummlerNeed: "goals",
    rummlerCellLabelFa: "سطح فرایند × استاندارد و دستورالعمل‌های اجرایی (Process Standards)",
    nadlerPairFa: "هم‌خوانی الزامات کار با ابزار و روال مکتوب (Task ↔ Formal Procedures)",
    vaultConceptIds: ["استانداردسازی", "مستندسازی", "روش اجرای کار (SOP)"],
    sourceIds: ["S025", "S032", "S039", "S049"],
  },
  {
    keywordId: "L2-K3",
    rummlerLevel: "process_whitespace",
    rummlerNeed: "management",
    rummlerCellLabelFa: "سطح فرایند × مدیریت فضای خالی و نقاط تحویل (White Space Management)",
    nadlerPairFa: "هم‌خوانی مرز نقش‌ها با تحویل کار بین‌واحدی (Formal Role Boundaries ↔ Inter-Unit Handoffs)",
    vaultConceptIds: ["مدیریت فضای خالی", "طراحی سیستم", "هم‌راستایی و انسجام"],
    sourceIds: ["S039", "S052", "S055"],
  },
  {
    keywordId: "L3-K1",
    rummlerLevel: "job_performer",
    rummlerNeed: "goals",
    rummlerCellLabelFa: "سطح شغل/مجری × شفافیت اختیارات و انتظارات تصمیم (Job Specifications & Decision Rights)",
    nadlerPairFa: "هم‌خوانی اختیارات فرد با پیچیدگی کار (Individual Authority ↔ Task Requirements)",
    vaultConceptIds: ["تفویض اختیار", "خودمختاری", "جاری‌سازی"],
    sourceIds: ["S038", "S040", "S041", "S042"],
  },
  {
    keywordId: "L3-K2",
    rummlerLevel: "job_performer",
    rummlerNeed: "design",
    rummlerCellLabelFa: "سطح شغل/مجری × توانمندسازی و انتقال دانش ضمنی (Performer Capacity & Scenario Training)",
    nadlerPairFa: "هم‌خوانی مهارت و آمادگی فرد با سناریوهای واقعی کار (Individual Skills ↔ Task Complexity)",
    vaultConceptIds: ["یادگیری و انتقال", "مستندسازی", "مدیریت تغییر"],
    sourceIds: ["S032", "S043", "S044"],
  },
  {
    keywordId: "L3-K3",
    rummlerLevel: "process_whitespace",
    rummlerNeed: "management",
    rummlerCellLabelFa: "سطح فرایند/شغل × پایداری جریان کار بدون حضور مالک (Operational Continuity)",
    nadlerPairFa: "هم‌خوانی هنجارهای غیررسمی تیم با روال‌های رسمی در غیاب مدیر (Informal Norms ↔ Formal Systems)",
    vaultConceptIds: ["پایداری و ریسک", "خودمختاری", "تکرارپذیری"],
    sourceIds: ["S038", "S041", "S044"],
  },
  {
    keywordId: "L4-K1",
    rummlerLevel: "organization",
    rummlerNeed: "management",
    rummlerCellLabelFa: "سطح سازمان/فرایند × سنجش و داشبورد شاخص‌ها (Performance Measurement)",
    nadlerPairFa: "هم‌خوانی سیستم کنترلی رسمی با خروجی‌های راهبردی (Formal Control Systems ↔ Strategy)",
    vaultConceptIds: ["پایش", "شاخص کلیدی عملکرد (KPI)", "هم‌راستایی و انسجام"],
    sourceIds: ["S028", "S048", "S052"],
  },
  {
    keywordId: "L4-K2",
    rummlerLevel: "process_whitespace",
    rummlerNeed: "management",
    rummlerCellLabelFa: "سطح فرایند × ریتم بازبینی و جلسات هماهنگی (Process Review Cadence)",
    nadlerPairFa: "هم‌خوانی تعاملات تیمی با شاخص‌های رسمی (Informal Communication ↔ Formal Review)",
    vaultConceptIds: ["پایش", "هم‌راستایی و انسجام", "بهبود مستمر"],
    sourceIds: ["S029", "S048", "S050"],
  },
  {
    keywordId: "L4-K3",
    rummlerLevel: "process_whitespace",
    rummlerNeed: "design",
    rummlerCellLabelFa: "سطح فرایند × حل مسئلهٔ ریشه‌ای و پیشگیری سیستمی (Systemic RCA & A3 CAPA)",
    nadlerPairFa: "هم‌خوانی فرهنگ یادگیری با اصلاح ساختار فرایند (Informal Blame-Free Culture ↔ Formal Process Redesign)",
    vaultConceptIds: ["حل مسئله و A3", "تحلیل علت ریشه‌ای", "بهبود مستمر"],
    sourceIds: ["S049", "S050", "S051", "S054"],
  },
  {
    keywordId: "L5-K1",
    rummlerLevel: "organization",
    rummlerNeed: "design",
    rummlerCellLabelFa: "سطح سازمان × بسته‌بندی هستهٔ دانش برای تکثیر (Replication Arrow Core)",
    nadlerPairFa: "هم‌خوانی مدل کسب‌وکار با قابلیت تکثیر در محیط جدید (Strategy ↔ Organizational Architecture)",
    vaultConceptIds: ["مقیاس‌پذیری", "فرانچایز و تکثیر", "تکرارپذیری"],
    sourceIds: ["S045", "S046", "S047"],
  },
  {
    keywordId: "L5-K2",
    rummlerLevel: "organization",
    rummlerNeed: "goals",
    rummlerCellLabelFa: "سطح سازمان × اقتصاد واحد و کنترل هزینهٔ نهایی (Unit Economics & Marginal Cost)",
    nadlerPairFa: "هم‌خوانی رشد حجم فروش با ظرفیت و سودآوری واحد (Growth Strategy ↔ Operational Economics)",
    vaultConceptIds: ["مقیاس‌پذیری", "اقتصاد واحد", "پایداری و ریسک"],
    sourceIds: ["S022", "S045", "S046", "S047"],
  },
  {
    keywordId: "L5-K3",
    rummlerLevel: "organization",
    rummlerNeed: "design",
    rummlerCellLabelFa: "سطح سازمان × معماری ماژولار و ظرفیت زیرسیستم‌ها (Modular Subsystem Capacity)",
    nadlerPairFa: "هم‌خوانی زیرساخت فنی و انسانی با تقاضای مقیاس‌پذیر (Formal Infrastructure ↔ Task Volume)",
    vaultConceptIds: ["مقیاس‌پذیری", "طراحی سیستم", "پایداری و ریسک"],
    sourceIds: ["S045", "S047", "S052", "S055"],
  },
];

const KEYWORD_ONTOLOGY_MAP = new Map<string, KeywordOntologyEntry>(
  KEYWORD_ONTOLOGY.map((entry) => [entry.keywordId, entry] as const),
);

export function getKeywordOntology(keywordId: string): KeywordOntologyEntry | undefined {
  return KEYWORD_ONTOLOGY_MAP.get(keywordId);
}

const RUMMLER_DIAGNOSIS_FA: Record<RummlerLevel, string> = {
  organization:
    "گلوگاه اصلی در سطح کلان سازمان (جهت‌گیری راهبردی، تفکیک مالی، آزادسازی زمان مالک یا اقتصاد واحد) قرار دارد؛ بدون اصلاح این سطح، بهینه‌سازی‌های جزئی در پایین هرم اثر پایداری نخواهد داشت (S036, S052).",
  process_whitespace:
    "گلوگاه اصلی در سطح فرایندهای افقی و «فضای خالی بین نقش‌ها» (نقاط تحویل کار، SOPها، جلسات هماهنگی و چرخهٔ اصلاح باگ‌ها) است؛ مسائل به جای حل شدن در جریان کار، به مدیر ارجاع می‌شوند (S039, S052).",
  job_performer:
    "گلوگاه اصلی در سطح شغل و مجری (شفافیت حدود اختیار تصمیم‌گیری و آموزش سناریومحور) است؛ تیم به دلیل ابهام در اختیارات یا تمرین نکردن سناریوها دچار توقف و تفویض معکوس می‌شود (S040, S042, S052).",
};

/**
 * تحلیل هستی‌شناختی زیرگراف فعال‌شدهٔ کاربر بر اساس امتیاز واقعی ۱۵ کلیدواژه.
 */
/**
 * Where the ontology nodes live. Defaults to the shipped maps; a published database revision
 * supplies its own, so retagging a keyword is not a code change.
 */
export type OntologyGraphResolvers = {
  ontology(keywordId: string): KeywordOntologyEntry | undefined;
  conceptFor(label: string): VaultConceptNode | undefined;
  sourceFor(id: string): ResearchSourceNode | undefined;
};

export const CODE_ONTOLOGY_RESOLVERS: OntologyGraphResolvers = {
  ontology: (keywordId) => KEYWORD_ONTOLOGY_MAP.get(keywordId),
  conceptFor: (label) => VAULT_CONCEPTS[label],
  sourceFor: (id) => RESEARCH_SOURCES[id],
};

export function buildOntologyDiagnosis(
  keywords: LayerKeyword[],
  resolvers: OntologyGraphResolvers = CODE_ONTOLOGY_RESOLVERS,
): OntologyDiagnosis {
  const byLevel = new Map<RummlerLevel, LayerKeyword[]>();
  for (const level of ["organization", "process_whitespace", "job_performer"] as RummlerLevel[]) {
    byLevel.set(level, []);
  }
  for (const kw of keywords) {
    const level = kw.rummlerLevel ?? "process_whitespace";
    byLevel.get(level)!.push(kw);
  }

  const rummlerBreakdown: RummlerLevelSummary[] = (
    ["organization", "process_whitespace", "job_performer"] as RummlerLevel[]
  ).map((level) => {
    const list = byLevel.get(level) ?? [];
    const sorted = [...list].sort((a, b) => (a.score ?? 0) - (b.score ?? 0));
    const mean =
      list.length > 0
        ? Math.round((list.reduce((sum, kw) => sum + (kw.score ?? 0), 0) / list.length) * 10) / 10
        : 0;
    const weakest = sorted[0];
    return {
      level,
      titleFa: RUMMLER_TITLES_FA[level],
      labelFa: RUMMLER_TITLES_FA[level],
      meanScore: mean,
      avgScore: mean,
      weakestKeywordId: weakest?.id ?? "",
      weakestKeywordTitleFa: weakest?.titleFa ?? "",
      diagnosisFa: RUMMLER_DIAGNOSIS_FA[level],
    };
  });

  const dominantRummlerLevel = [...rummlerBreakdown].sort((a, b) => a.meanScore - b.meanScore)[0]!;

  const weakestKeywords = [...keywords].sort((a, b) => (a.score ?? 0) - (b.score ?? 0)).slice(0, 4);
  const primaryNadlerDisconnectFa =
    weakestKeywords[0]?.nadlerPairFa ?? "هم‌خوانی ساختار رسمی و اجرای روزمره (Formal Structure ↔ Task)";

  const conceptNames = new Set<string>();
  const sourceIds = new Set<string>();
  for (const kw of weakestKeywords) {
    const onto = resolvers.ontology(kw.id);
    for (const c of kw.vaultConceptsFa ?? onto?.vaultConceptIds ?? []) conceptNames.add(c);
    for (const s of kw.sourceIds ?? onto?.sourceIds ?? []) sourceIds.add(s);
  }

  const activatedConcepts: VaultConceptNode[] = [];
  for (const name of conceptNames) {
    const node = resolvers.conceptFor(name);
    if (node) activatedConcepts.push(node);
  }

  const activatedSources: ResearchSourceNode[] = [];
  for (const id of sourceIds) {
    const src = resolvers.sourceFor(id);
    if (src) activatedSources.push(src);
  }

  return {
    dominantRummlerLevel,
    rummlerBreakdown,
    primaryNadlerDisconnectFa,
    activatedConcepts: activatedConcepts.slice(0, 6),
    activatedSources: activatedSources.slice(0, 6),
  };
}
