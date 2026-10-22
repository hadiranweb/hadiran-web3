/**
 * ماتریس تفسیر و گراف چندبه‌چند عارضه‌یابی کسب‌وکار (casio-ss v2.0).
 * مبتنی بر:
 * - ۵۵ منبع علمی سیستم‌سازی و عارضه‌یابی در Research Vaults (S001–S055)
 * - مدل‌های تشخیص شناختی چندارزشی و ماتریس Q (de la Torre, 2011; Ma & de la Torre, 2016/2020)
 * - چارچوب سه سطح عملکرد و فضای خالی (Rummler & Brache, 1995/2012 — S052)
 * - مدل هم‌خوانی سازمانی (Nadler & Tushman, 1980 — S055)
 * - نظریهٔ انفکاک سیاست-عمل و وسیله-هدف (Bromley & Powell, 2012)
 * - استراتژی تکثیر و اقتصاد واحد (Winter & Szulanski, 2001; Ringov et al., 2026 — S045–S047)
 * - تفکر A3 و نقد تحلیل علت ریشه‌ای تک‌عاملی (Shook, 2008 — S051; Peerally et al., 2017 — S054)
 */

export const INTERPRETATION_VERSION = "five-layer-interpretation-2.0.0";

export type RummlerLevel = "organization" | "process_whitespace" | "job_performer";

export type SubKeywordDef = {
  id: string;
  titleFa: string;
  weights: { item: string; weight: number }[];
};

export type ScoredSubKeyword = {
  id: string;
  canonicalCode?: string;
  titleFa: string;
  score: number;
  bandId: "weak" | "growing" | "strong";
};

export type LayerKeyword = {
  id: string;
  canonicalCode?: string;
  titleFa: string;
  children: string[];
  questionIds: string[];
  /** امتیاز واقعی محاسبه‌شده از پاسخ‌های فرد در مقیاس ۰ تا ۲۰ */
  score?: number;
  /** باند عملکردی کلیدواژه: weak (<10) | growing (10..15) | strong (>=15) */
  bandId?: "weak" | "growing" | "strong";
  bandLabelFa?: string;
  /** فراداده‌های اجرایی از actions.yaml و گراف پژوهش */
  ownerRoleFa?: string;
  horizonFa?: "کوتاه‌مدت" | "میان‌مدت";
  whyFa?: string;
  asIsWeakFa?: string;
  asIsGrowingFa?: string;
  asIsStrongFa?: string;
  toBeFa?: string;
  actionStepFa?: string;
  rummlerLevel?: RummlerLevel;
  rummlerNeed?: "goals" | "design" | "management";
  rummlerCellLabelFa?: string;
  nadlerPairFa?: string;
  vaultConceptsFa?: string[];
  sourceIds?: string[];
  contextWeight?: number;
  contextWeightedDeficit?: number;
  /** فراداده‌های گراف علّی مؤثرها و متأثرها (DEMATEL + ISM + MICMAC) */
  ismLevel?: 1 | 2 | 3 | 4 | 5;
  causalRole?: "cause_driver" | "effect_symptom";
  causalRoleLabelFa?: string;
  micmacQuadrant?: "independent_driver" | "linkage_lever" | "dependent_outcome" | "autonomous";
  micmacLabelFa?: string;
  drivingPower?: number;
  dependencePower?: number;
  netCauseEffect?: number;
  rootCauseLeverageScore?: number;
  influencersFa?: string[];
  influencedFa?: string[];
  subKeywords?: SubKeywordDef[];
  scoredSubKeywords?: ScoredSubKeyword[];
};

export type LayerCopy = {
  yamlKey: string;
  findingId: string;
  titleFa: string;
  constructFa: string;
  asIsFa: string;
  toBeFa: string;
  actionsFa: string;
  keywords: LayerKeyword[];
};

export type LayerBand = {
  id: string;
  labelFa: string;
  meaningFa: string;
  min: number;
  max: number;
  maxInclusive: boolean;
};

export type CrossPattern = {
  id: string;
  meaningFa: string;
  actionFa: string;
  when: { strong: string | null; weak: string | null; alsoWeak: string | null; weakAny: string[] };
};

export const layerBands: LayerBand[] = [
  {
    id: "weak",
    labelFa: "ضعف (گلوگاه بالقوه)",
    meaningFa: "لایه عملاً برقرار نیست و به‌احتمال زیاد گلوگاه فعلی کل سیستم است.",
    min: 0,
    max: 10,
    maxInclusive: false,
  },
  {
    id: "growing",
    labelFa: "در حال رشد",
    meaningFa: "اسکلت لایه وجود دارد اما ناپایدار است؛ با اقدام‌های مشخص قابل تثبیت است.",
    min: 10,
    max: 15,
    maxInclusive: false,
  },
  {
    id: "strong",
    labelFa: "قوی",
    meaningFa: "لایه برقرار است؛ تمرکز بر تثبیت و انتقال الگو به لایه‌های ضعیف‌تر.",
    min: 15,
    max: 20,
    maxInclusive: true,
  },
];

export const layerCopy: LayerCopy[] = [
  {
    yamlKey: "governance",
    findingId: "layer-foundation",
    titleFa: "بنیان و رهبری",
    constructFa: "میزان جداسازی نقش مالک از اجرا، شفافیت استراتژی مکتوب و انضباط مرز مالی مالک و شرکت",
    asIsFa: "تله متخصص؛ بنیان‌گذار درگیر کارهای اجرایی است و اهداف کلان مکتوب نیست.",
    toBeFa: "جداسازی نقش مالک از اپراتور؛ شفافیت استراتژی و تعیین سهم اهداف فصلی.",
    actionsFa: "تدوین هدف استراتژیک ۱ صفحه‌ای، اصلاح برداشت‌های مالی، آزادسازی زمان مالک برای نقش طراحی.",
    keywords: [
      {
        id: "L1-K1",
        titleFa: "تدوین هدف استراتژیک ۱ صفحه‌ای",
        ownerRoleFa: "مالک کسب‌وکار",
        horizonFa: "کوتاه‌مدت",
        whyFa: "وقتی مقصد و اولویت‌های فصلی روی یک صفحه شفاف نباشد، هر تصمیم روزمره دوباره به مالک برمی‌گردد و واحدها در جهت‌های متناقض حرکت می‌کنند (S036, S052).",
        asIsWeakFa: "اهداف کوتاه‌مدت و سالانه صرفاً در ذهن مالک است و خط‌کش روشنی برای اولویت‌بندی تصمیم‌ها وجود ندارد.",
        asIsGrowingFa: "اهداف کلی مطرح شده‌اند اما هنوز به شاخص‌های کمیِ فصلی و تعهد مشترک بین نفرات کلیدی تبدیل نشده‌اند.",
        asIsStrongFa: "مقصد راهبردی و اهداف فصلی مکتوب و تسهیم شده و معیار تصمیم‌گیری تیم روشن است.",
        toBeFa: "سند استراتژیک ۱ صفحه‌ای شامل ۳ اولویت فصلی و نتایج کلیدی قابل سنجش که مبنای تصمیم‌گیری هفتگی تیم باشد.",
        actionStepFa: "تدوین هدف استراتژیک ۱ صفحه‌ای (تعیین ۳ اولویت فصلی و تسهیم مکتوب با نفرات کلیدی)",
        rummlerLevel: "organization",
        nadlerPairFa: "هم‌خوانی راهبرد و ساختار رسمی (Strategy ↔ Formal Structure)",
        vaultConceptsFa: ["حاکمیت سازمانی", "هم‌راستایی و انسجام", "زمینه", "پایش"],
        sourceIds: ["S036", "S037", "S052", "S055"],
        children: [
          "چشم‌انداز و رسالت",
          "اولویت‌ها و انتخاب‌های راهبردی",
          "اهداف سالانه و فصلی",
          "معیارهای موفقیت و نتایج کلیدی",
          "تسهیم و هم‌سویی اهداف با مدیران و شرکا",
        ],
        subKeywords: [
          { id: "L1-K1-S1", titleFa: "چشم‌انداز و رسالت", weights: [{ item: "FL.L1.Q3", weight: 0.8 }, { item: "FL.L1.Q1", weight: 0.2 }] },
          { id: "L1-K1-S2", titleFa: "اولویت‌ها و انتخاب‌های راهبردی", weights: [{ item: "FL.L1.Q3", weight: 0.7 }, { item: "FL.L1.Q2", weight: 0.3 }] },
          { id: "L1-K1-S3", titleFa: "اهداف سالانه و فصلی", weights: [{ item: "FL.L1.Q3", weight: 0.85 }, { item: "FL.L4.Q1", weight: 0.15 }] },
          { id: "L1-K1-S4", titleFa: "معیارهای موفقیت و نتایج کلیدی", weights: [{ item: "FL.L1.Q3", weight: 0.6 }, { item: "FL.L4.Q1", weight: 0.4 }] },
          { id: "L1-K1-S5", titleFa: "تسهیم و هم‌سویی اهداف با مدیران و شرکا", weights: [{ item: "FL.L1.Q3", weight: 0.7 }, { item: "FL.L4.Q2", weight: 0.3 }] },
        ],
        questionIds: ["FL.L1.Q3", "FL.L1.Q1", "FL.L1.Q2", "FL.L4.Q1", "FL.L5.Q2"],
      },
      {
        id: "L1-K2",
        titleFa: "اصلاح برداشت‌های مالی",
        ownerRoleFa: "مالک کسب‌وکار",
        horizonFa: "کوتاه‌مدت",
        whyFa: "اختلاط حساب شخصی و شرکت، تصویر سودآوری واقعی و بهای تمام‌شده را مخدوش کرده و امکان بودجه‌بندی و رشد پایدار را از بین می‌برد (S036 IFC).",
        asIsWeakFa: "مرز حساب‌های شخصی مالک و خزانهٔ کسب‌وکار مخدوش است و برداشت‌ها خارج از قاعدهٔ حقوق و سود مصوب انجام می‌شود.",
        asIsGrowingFa: "تفکیک اولیهٔ حساب‌ها شروع شده اما هنوز برخی هزینه‌ها و برداشت‌های شخصی با جریان نقد عملیاتی تداخل دارد.",
        asIsStrongFa: "حساب‌های مالی شرکت و برداشت‌های شخصی مالک کاملاً تفکیک شده و انضباط مالی برقرار است.",
        toBeFa: "تفکیک ۱۰۰٪ حساب بانکی شرکت از حساب شخصی و تعریف حقوق ثابت و قاعدهٔ برداشت سود دوره‌ای برای مالک.",
        actionStepFa: "اصلاح برداشت‌های مالی (جداسازی کامل حساب شرکت از جیب مالک و تعیین حقوق ثابت ماهانه)",
        rummlerLevel: "organization",
        nadlerPairFa: "هم‌خوانی ساختار رسمی و رفتار غیررسمی (Formal Structure ↔ Informal Culture)",
        vaultConceptsFa: ["حاکمیت سازمانی", "پایداری و ریسک", "مقیاس‌پذیری"],
        sourceIds: ["S036", "S023", "S045"],
        children: [
          "تفکیک حساب‌های شخصی و کسب‌وکار",
          "حقوق، برداشت و توزیع سود مالک",
          "هزینه‌های مرتبط با مالک و نرمال‌سازی سود",
          "سودآوری عملیاتی در برابر موجودی نقد",
          "جریان نقدی و سرمایه در گردش",
        ],
        subKeywords: [
          { id: "L1-K2-S1", titleFa: "تفکیک حساب‌های شخصی و کسب‌وکار", weights: [{ item: "FL.L1.Q4", weight: 0.9 }, { item: "FL.L1.Q1", weight: 0.1 }] },
          { id: "L1-K2-S2", titleFa: "حقوق، برداشت و توزیع سود مالک", weights: [{ item: "FL.L1.Q4", weight: 0.85 }, { item: "FL.L1.Q3", weight: 0.15 }] },
          { id: "L1-K2-S3", titleFa: "هزینه‌های مرتبط با مالک و نرمال‌سازی سود", weights: [{ item: "FL.L1.Q4", weight: 0.75 }, { item: "FL.L5.Q4", weight: 0.25 }] },
          { id: "L1-K2-S4", titleFa: "سودآوری عملیاتی در برابر موجودی نقد", weights: [{ item: "FL.L1.Q4", weight: 0.6 }, { item: "FL.L4.Q1", weight: 0.4 }] },
          { id: "L1-K2-S5", titleFa: "جریان نقدی و سرمایه در گردش", weights: [{ item: "FL.L1.Q4", weight: 0.65 }, { item: "FL.L5.Q4", weight: 0.35 }] },
        ],
        questionIds: ["FL.L1.Q4", "FL.L4.Q1", "FL.L5.Q4"],
      },
      {
        id: "L1-K3",
        titleFa: "آزادسازی زمان مالک برای نقش طراحی",
        ownerRoleFa: "مالک کسب‌وکار",
        horizonFa: "میان‌مدت",
        whyFa: "تا زمانی که مالک درگیر اجرای فنی روزمره است (تلهٔ متخصص)، ظرفیت شناختی برای معماری سیستم، کنترل کیفیت و توسعه باقی نمی‌ماند (S037, S038, S041).",
        asIsWeakFa: "تلهٔ متخصص و وابستگی شدید به شخص مالک؛ بخش عمدهٔ زمان هفتگی صرف کارهای اجرایی روزمره و آتش‌نشانی می‌شود.",
        asIsGrowingFa: "بخشی از کارهای اجرایی واگذار شده اما مالک هنوز گلوگاهِ تصمیم‌گیری‌های عملیاتی و حل مسائل روزمره است.",
        asIsStrongFa: "زمان مالک از اجرای روزمره آزاد شده و بر راهبری، معماری سیستم و توسعه متمرکز است.",
        toBeFa: "تفکیک کامل نقش مالک/معمار از مجری روزمره و کاهش وابستگی عملیاتی به حضور فیزیکی مالک.",
        actionStepFa: "آزادسازی زمان مالک برای نقش طراحی (ممیزی زمان هفتگی و واگذاری ۳ فعالیت اجرایی پرتکرار)",
        rummlerLevel: "organization",
        nadlerPairFa: "هم‌خوانی نقش فرد و ماهیت کار (People ↔ Task)",
        vaultConceptsFa: ["حاکمیت سازمانی", "تفویض اختیار", "خودمختاری", "مدیریت تغییر"],
        sourceIds: ["S037", "S038", "S040", "S041"],
        children: [
          "ممیزی زمان مالک",
          "تفکیک نقش مالک، مدیر و اپراتور",
          "کاهش وابستگی عملیاتی به مالک",
          "واگذاری فعالیت‌های روزمره",
          "تداوم کسب‌وکار در غیاب مالک",
        ],
        subKeywords: [
          { id: "L1-K3-S1", titleFa: "ممیزی زمان مالک", weights: [{ item: "FL.L1.Q2", weight: 0.8 }, { item: "FL.L5.Q3", weight: 0.2 }] },
          { id: "L1-K3-S2", titleFa: "تفکیک نقش مالک، مدیر و اپراتور", weights: [{ item: "FL.L1.Q2", weight: 0.6 }, { item: "FL.L1.Q1", weight: 0.4 }] },
          { id: "L1-K3-S3", titleFa: "کاهش وابستگی عملیاتی به مالک", weights: [{ item: "FL.L1.Q1", weight: 0.7 }, { item: "FL.L5.Q3", weight: 0.3 }] },
          { id: "L1-K3-S4", titleFa: "واگذاری فعالیت‌های روزمره", weights: [{ item: "FL.L1.Q2", weight: 0.65 }, { item: "FL.L3.Q2", weight: 0.35 }] },
          { id: "L1-K3-S5", titleFa: "تداوم کسب‌وکار در غیاب مالک", weights: [{ item: "FL.L1.Q1", weight: 0.55 }, { item: "FL.L3.Q1", weight: 0.45 }] },
        ],
        questionIds: ["FL.L1.Q1", "FL.L1.Q2", "FL.L3.Q1", "FL.L3.Q2", "FL.L5.Q3"],
      },
    ],
  },
  {
    yamlKey: "architecture",
    findingId: "layer-architecture",
    titleFa: "معماری و طراحی",
    constructFa: "میزان مکتوب بودن زنجیرهٔ ارزش مشتری، پوشش SOPهای گام‌به‌گام و شفافیت مرز مسئولیت‌ها در فضای خالی نمودار سازمانی",
    asIsFa: "وابستگی به دانش ذهنی افراد؛ خطاهای تکراری به دلیل نبود SOPهای ۱-۲-۳.",
    toBeFa: "فرآیندهای استاندارد مکتوب در مسیر حیاتی مشتری (Critical Flow) و چک‌لیست‌ها.",
    actionsFa: "نقشه‌برداری زنجیره ارزش مشتری، استخراج ۵ فرآیند کلیدی با مصاحبه از مجریان، تدوین چک‌لیست‌های تحویل کار.",
    keywords: [
      {
        id: "L2-K1",
        titleFa: "نقشه‌برداری زنجیره ارزش مشتری",
        ownerRoleFa: "مالک کسب‌وکار / مدیر عملیات",
        horizonFa: "کوتاه‌مدت",
        whyFa: "بدون دید افقی از جریان خلق ارزش برای مشتری، واحدها جزیره‌ای کار می‌کنند و گلوگاه‌ها در مرز بین واحدها پنهان می‌مانند (Rummler-Brache S052, S039).",
        asIsWeakFa: "مسیر سفر مشتری از جذب تا تحویل و پس از فروش روی نقشهٔ واحدی ترسیم نشده و نقاط تحویل بین افراد مبهم است.",
        asIsGrowingFa: "بخش‌هایی از مسیر مشتری یادداشت شده اما هنوز یک فلوچارت سرتاسری با ورودی و خروجی استاندارد بین مراحل وجود ندارد.",
        asIsStrongFa: "نقشهٔ انتهابه‌انتهای سفر مشتری و نقاط تحویل کار بین بخش‌ها به‌طور شفاف ترسیم و مستند شده است.",
        toBeFa: "نقشهٔ شفاف جریان ارزش مشتری (از سرنخ تا تحویل و پشتیبانی) با تعریف دقیق ورودی، خروجی و زمان استاندارد هر ایستگاه.",
        actionStepFa: "نقشه‌برداری زنجیره ارزش مشتری (ترسیم فلوچارت انتهابه‌انتهای مسیر مشتری و نقاط تحویل)",
        rummlerLevel: "process_whitespace",
        nadlerPairFa: "هم‌خوانی کار و ساختار رسمی (Task ↔ Formal Structure)",
        vaultConceptsFa: ["مدیریت فرایند کسب‌وکار", "کشف فرایند", "طراحی سیستم", "ارزش"],
        sourceIds: ["S039", "S052", "S008"],
        children: [
          "نقشه سفر مشتری",
          "جریان انتهابه‌انتهای جذب تا تحویل",
          "نقاط تماس و تحویل بین‌نقشی",
          "ورودی‌ها، خروجی‌ها و ارزش مشتری",
          "گلوگاه‌ها، انتظار و دوباره‌کاری",
        ],
        subKeywords: [
          { id: "L2-K1-S1", titleFa: "نقشه سفر مشتری", weights: [{ item: "FL.L2.Q1", weight: 0.85 }, { item: "FL.L5.Q4", weight: 0.15 }] },
          { id: "L2-K1-S2", titleFa: "جریان انتهابه‌انتهای جذب تا تحویل", weights: [{ item: "FL.L2.Q1", weight: 0.75 }, { item: "FL.L2.Q2", weight: 0.25 }] },
          { id: "L2-K1-S3", titleFa: "نقاط تماس و تحویل بین‌نقشی", weights: [{ item: "FL.L2.Q1", weight: 0.55 }, { item: "FL.L2.Q4", weight: 0.45 }] },
          { id: "L2-K1-S4", titleFa: "ورودی‌ها، خروجی‌ها و ارزش مشتری", weights: [{ item: "FL.L2.Q1", weight: 0.6 }, { item: "FL.L2.Q4", weight: 0.4 }] },
          { id: "L2-K1-S5", titleFa: "گلوگاه‌ها، انتظار و دوباره‌کاری", weights: [{ item: "FL.L2.Q1", weight: 0.5 }, { item: "FL.L5.Q4", weight: 0.5 }] },
        ],
        questionIds: ["FL.L2.Q1", "FL.L2.Q4", "FL.L5.Q4"],
      },
      {
        id: "L2-K2",
        titleFa: "استخراج ۵ فرآیند کلیدی با مصاحبه از مجریان",
        ownerRoleFa: "مدیر عملیات / سرپرست تیم",
        horizonFa: "کوتاه‌مدت",
        whyFa: "وقتی دانش کار فقط در سینهٔ افراد باسابقه باشد (Tacit Knowledge)، با غیبت یا خروج آن‌ها کیفیت فرو می‌ریزد و جذب نیروی جدید هفته‌ها زمان می‌برد (S030 CTA, S034 NASA, S039).",
        asIsWeakFa: "دانش اجرای کارها شفاهی و قائم به اشخاص است؛ کارهای روتین دستورالعمل گام‌به‌گام ندارند و آموزش نیروی جدید کاملاً وابسته به مجریان قبلی است.",
        asIsGrowingFa: "بخشی از روال‌های اصلی مکتوب شده اما هنوز استثناها و فوت‌وفن‌های عملیاتی در ذهن افراد باقی مانده است.",
        asIsStrongFa: "فرآیندهای کلیدی از ذهن مجریان استخراج و به دستورالعمل‌های گام‌به‌گام و قابل انتقال تبدیل شده‌اند.",
        toBeFa: "مستندسازی وضعیت واقعی (AS-IS) و تدوین SOPهای کاربردی برای ۵ فرآیند پرتکرار به‌طوری که نیروی جدید مستقلاً کار را یاد بگیرد.",
        actionStepFa: "استخراج ۵ فرآیند کلیدی با مصاحبه از مجریان (تبدیل تجربهٔ شفاهی به دستورالعمل گام‌به‌گام)",
        rummlerLevel: "process_whitespace",
        nadlerPairFa: "هم‌خوانی کار و دانش افراد (Task ↔ People)",
        vaultConceptsFa: ["کشف فرایند", "مستندسازی", "روش اجرای کار (SOP)", "تکرارپذیری"],
        sourceIds: ["S039", "S010", "S030", "S034"],
        children: [
          "اولویت‌بندی فرآیندهای حیاتی",
          "مصاحبه و مشاهده مجریان",
          "استخراج دانش ضمنی",
          "مرزبندی فرآیند با SIPOC",
          "مدل‌سازی وضعیت موجود (As-Is)",
        ],
        subKeywords: [
          { id: "L2-K2-S1", titleFa: "اولویت‌بندی فرآیندهای حیاتی", weights: [{ item: "FL.L2.Q1", weight: 0.5 }, { item: "FL.L2.Q2", weight: 0.5 }] },
          { id: "L2-K2-S2", titleFa: "مصاحبه و مشاهده مجریان", weights: [{ item: "FL.L2.Q2", weight: 0.6 }, { item: "FL.L2.Q3", weight: 0.4 }] },
          { id: "L2-K2-S3", titleFa: "استخراج دانش ضمنی", weights: [{ item: "FL.L2.Q3", weight: 0.75 }, { item: "FL.L2.Q2", weight: 0.25 }] },
          { id: "L2-K2-S4", titleFa: "مرزبندی فرآیند با SIPOC", weights: [{ item: "FL.L2.Q1", weight: 0.45 }, { item: "FL.L2.Q2", weight: 0.55 }] },
          { id: "L2-K2-S5", titleFa: "مدل‌سازی وضعیت موجود (As-Is)", weights: [{ item: "FL.L2.Q2", weight: 0.7 }, { item: "FL.L3.Q3", weight: 0.3 }] },
        ],
        questionIds: ["FL.L2.Q1", "FL.L2.Q2", "FL.L2.Q3", "FL.L3.Q3", "FL.L3.Q4"],
      },
      {
        id: "L2-K3",
        titleFa: "تدوین چک‌لیست‌های تحویل کار",
        ownerRoleFa: "سرپرست تیم / مالک فرآیند",
        horizonFa: "کوتاه‌مدت",
        whyFa: "بیشترین خطاها و اصطکاک‌ها در «فضای خالی بین نقش‌ها» و زمان تحویل کار از یک نفر به نفر بعدی رخ می‌دهد؛ چک‌لیست تحویل و مالکیت روشنِ خروجی جلوی پاس‌کاری را می‌گیرد (S052, S050).",
        asIsWeakFa: "مرز وظایف و مسئولیت نهایی خروجی‌ها شناور است و نبود چک‌لیست تحویل کار باعث دوباره‌کاری و پاس‌کاری خطاها می‌شود.",
        asIsGrowingFa: "مسئولیت‌های کلی مشخص است اما معیار پذیرش خروجی کامل (Definition of Done) و چک‌لیست کنترل کیفیت در نقاط تحویل کامل نیست.",
        asIsStrongFa: "برای هر خروجی یک مسئول نهایی مشخص و چک‌لیست تحویل و کنترل کیفیت استاندارد برقرار است.",
        toBeFa: "تعریف مالک واحد برای هر خروجی (RACI) به‌همراه چک‌لیست تحویل کار و معیار پذیرش شفاف در تمام ایستگاه‌های کلیدی.",
        actionStepFa: "تدوین چک‌لیست‌های تحویل کار و شفاف‌سازی مالک نهایی هر خروجی (RACI)",
        rummlerLevel: "process_whitespace",
        nadlerPairFa: "هم‌خوانی ساختار رسمی و کار (Formal Structure ↔ Task)",
        vaultConceptsFa: ["استانداردسازی", "روش اجرای کار (SOP)", "کیفیت", "مدیریت فضای خالی"],
        sourceIds: ["S039", "S050", "S052"],
        children: [
          "SOPهای گام‌به‌گام",
          "چک‌لیست تحویل و کنترل کیفیت",
          "معیار پذیرش و تعریف خروجی کامل",
          "مالک فرایند و مسئولیت‌ها (RACI)",
          "نسخه‌بندی و بازنگری اسناد",
        ],
        subKeywords: [
          { id: "L2-K3-S1", titleFa: "SOPهای گام‌به‌گام", weights: [{ item: "FL.L2.Q2", weight: 0.75 }, { item: "FL.L2.Q3", weight: 0.25 }] },
          { id: "L2-K3-S2", titleFa: "چک‌لیست تحویل و کنترل کیفیت", weights: [{ item: "FL.L2.Q2", weight: 0.5 }, { item: "FL.L2.Q4", weight: 0.5 }] },
          { id: "L2-K3-S3", titleFa: "معیار پذیرش و تعریف خروجی کامل", weights: [{ item: "FL.L2.Q4", weight: 0.7 }, { item: "FL.L3.Q2", weight: 0.3 }] },
          { id: "L2-K3-S4", titleFa: "مالک فرایند و مسئولیت‌ها (RACI)", weights: [{ item: "FL.L2.Q4", weight: 0.85 }, { item: "FL.L1.Q2", weight: 0.15 }] },
          { id: "L2-K3-S5", titleFa: "نسخه‌بندی و بازنگری اسناد", weights: [{ item: "FL.L2.Q2", weight: 0.5 }, { item: "FL.L4.Q3", weight: 0.5 }] },
        ],
        questionIds: ["FL.L2.Q2", "FL.L2.Q3", "FL.L2.Q4", "FL.L3.Q2", "FL.L4.Q3"],
      },
    ],
  },
  {
    yamlKey: "implementation",
    findingId: "layer-flow",
    titleFa: "جاری‌سازی",
    constructFa: "میزان استقلال تصمیم‌گیری تیم، پایبندی عملی به استانداردها (جلوگیری از انفکاک سیاست-عمل) و پایداری عملیات در غیاب مدیر",
    asIsFa: "تله تصمیم‌گیری؛ پرسنل منتظر تأیید مدیر هستند و تفویض معکوس رخ می‌دهد.",
    toBeFa: "تیم خودمختار؛ تفویض مسئولیت «نتیجه نهایی» (Outcome) به جای تکلیف روزمره.",
    actionsFa: "تعیین اختیارات تصمیم‌گیری مالی و عملیاتی پرسنل، آموزش مبتنی بر سناریو، ارزیابی آزمون مرخصی کوتاه‌مدت.",
    keywords: [
      {
        id: "L3-K1",
        titleFa: "تعیین اختیارات تصمیم‌گیری مالی و عملیاتی پرسنل",
        ownerRoleFa: "مالک کسب‌وکار / مدیر داخلی",
        horizonFa: "کوتاه‌مدت",
        whyFa: "واگذاریِ کار بدون واگذاریِ اختیار تصمیم‌گیری (Task vs. Judgment Delegation)، باعث ارجاع معکوس ده‌ها سؤال خرد در روز به مدیر و قفل شدن سرعت اجرا می‌شود (S040, S041).",
        asIsWeakFa: "تلهٔ تصمیم‌گیری و تفویض معکوس؛ کارکنان برای تصمیم‌های خرد و روزمره مکرراً به مدیر مراجعه می‌کنند و حدود اختیارات مکتوب نیست.",
        asIsGrowingFa: "اختیارات اولیه به شکل شفاهی داده شده اما به دلیل نبود سقف‌های مالی/عملیاتی روشن و قواعد استثنا، در موارد حساس تردید و توقف رخ می‌دهد.",
        asIsStrongFa: "ماتریس اختیارات تصمیم‌گیری مالی و عملیاتی پرسنل شفاف است و تیم بدون مراجعات خرد روزمره تصمیم می‌گیرد.",
        toBeFa: "ماتریس مکتوب حدود اختیارات (سقف مالی، عملیاتی و قاعدهٔ ارجاع استثناها) که مالکیت نتیجه را به تیم منتقل کند.",
        actionStepFa: "تعیین اختیارات تصمیم‌گیری مالی و عملیاتی پرسنل (تدوین جدول سقف اختیار و قاعدهٔ ارجاع استثنا)",
        rummlerLevel: "job_performer",
        nadlerPairFa: "هم‌خوانی ساختار رسمی و افراد (Formal Structure ↔ People)",
        vaultConceptsFa: ["تفویض اختیار", "خودمختاری", "حاکمیت سازمانی", "جاری‌سازی"],
        sourceIds: ["S040", "S041", "S042"],
        children: [
          "حدود اختیار تصمیم‌گیری",
          "آستانه‌های مالی و عملیاتی",
          "نقش تصمیم‌گیر، مجری و پاسخ‌گو",
          "مالکیت نتیجه (Outcome Ownership)",
          "قواعد ارجاع و مدیریت استثنا",
        ],
        subKeywords: [
          { id: "L3-K1-S1", titleFa: "حدود اختیار تصمیم‌گیری", weights: [{ item: "FL.L3.Q2", weight: 0.65 }, { item: "FL.L1.Q2", weight: 0.35 }] },
          { id: "L3-K1-S2", titleFa: "آستانه‌های مالی و عملیاتی", weights: [{ item: "FL.L3.Q2", weight: 0.7 }, { item: "FL.L3.Q1", weight: 0.3 }] },
          { id: "L3-K1-S3", titleFa: "نقش تصمیم‌گیر، مجری و پاسخ‌گو", weights: [{ item: "FL.L2.Q4", weight: 0.5 }, { item: "FL.L3.Q2", weight: 0.5 }] },
          { id: "L3-K1-S4", titleFa: "مالکیت نتیجه (Outcome Ownership)", weights: [{ item: "FL.L3.Q1", weight: 0.55 }, { item: "FL.L3.Q3", weight: 0.45 }] },
          { id: "L3-K1-S5", titleFa: "قواعد ارجاع و مدیریت استثنا", weights: [{ item: "FL.L3.Q2", weight: 0.6 }, { item: "FL.L3.Q4", weight: 0.4 }] },
        ],
        questionIds: ["FL.L3.Q1", "FL.L3.Q2", "FL.L3.Q3", "FL.L3.Q4", "FL.L1.Q2", "FL.L2.Q4"],
      },
      {
        id: "L3-K2",
        titleFa: "آموزش مبتنی بر سناریو",
        ownerRoleFa: "مدیر عملیات / سرپرست تیم",
        horizonFa: "میان‌مدت",
        whyFa: "صرفِ نوشتن SOP بدون تمرین موقعیت‌های واقعی و استثناها به «انفکاک سیاست از عمل» (مستندات دکوریِ بایگانی‌شده) منجر می‌شود (Bromley & Powell 2012, S031 CDC, S042).",
        asIsWeakFa: "فرآیندها و آموزش‌ها در عمل روزمره جاری نشده‌اند و کارها به روش‌های سلیقه‌ای و قدیمی انجام می‌شود (انفکاک سند از عمل).",
        asIsGrowingFa: "تیم در شرایط عادی تا حدی طبق روال عمل می‌کند اما در مواجهه با موارد استثنایی یا فشار کاری به عادت‌های سلیقه‌ای برمی‌گردد.",
        asIsStrongFa: "دستورالعمل‌ها و آموزش‌ها از طریق تمرین سناریوهای واقعی در رفتار روزمرهٔ تیم نهادینه و جاری شده‌اند.",
        toBeFa: "پایبندی مستمر تیم به استانداردها از طریق آموزش سناریومحور (موارد پرتکرار و بحرانی) و سنجش انتقال یادگیری به محیط کار.",
        actionStepFa: "آموزش مبتنی بر سناریو (تمرین ۱۰ موقعیت پرتکرار و استثنایی شغل و ممیزی اجرای SOP در عمل)",
        rummlerLevel: "job_performer",
        nadlerPairFa: "هم‌خوانی افراد و فرهنگ کاری (People ↔ Informal Culture)",
        vaultConceptsFa: ["جاری‌سازی", "یادگیری و انتقال", "مدیریت تغییر", "پذیرش"],
        sourceIds: ["S042", "S015", "S031"],
        children: [
          "سناریوهای پرتکرار شغلی",
          "سناریوهای استثنایی و بحرانی",
          "تمرین و شبیه‌سازی تصمیم",
          "آموزش نقش‌محور و ورود کارکنان",
          "سنجش شایستگی و بازخورد",
        ],
        subKeywords: [
          { id: "L3-K2-S1", titleFa: "سناریوهای پرتکرار شغلی", weights: [{ item: "FL.L3.Q3", weight: 0.6 }, { item: "FL.L3.Q4", weight: 0.4 }] },
          { id: "L3-K2-S2", titleFa: "سناریوهای استثنایی و بحرانی", weights: [{ item: "FL.L3.Q2", weight: 0.55 }, { item: "FL.L3.Q4", weight: 0.45 }] },
          { id: "L3-K2-S3", titleFa: "تمرین و شبیه‌سازی تصمیم", weights: [{ item: "FL.L3.Q4", weight: 0.65 }, { item: "FL.L3.Q2", weight: 0.35 }] },
          { id: "L3-K2-S4", titleFa: "آموزش نقش‌محور و ورود کارکنان", weights: [{ item: "FL.L3.Q4", weight: 0.6 }, { item: "FL.L2.Q3", weight: 0.4 }] },
          { id: "L3-K2-S5", titleFa: "سنجش شایستگی و بازخورد", weights: [{ item: "FL.L3.Q3", weight: 0.7 }, { item: "FL.L4.Q3", weight: 0.3 }] },
        ],
        questionIds: ["FL.L3.Q2", "FL.L3.Q3", "FL.L3.Q4", "FL.L2.Q2", "FL.L2.Q3"],
      },
      {
        id: "L3-K3",
        titleFa: "ارزیابی آزمون مرخصی کوتاه‌مدت",
        ownerRoleFa: "مالک کسب‌وکار",
        horizonFa: "میان‌مدت",
        whyFa: "تنها آزمون واقعیِ جاری شدن سیستم، غیبت برنامه‌ریزی‌شدهٔ مدیر است تا گلوگاه‌های پنهان وابستگی پیش از مقیاس‌گیری آشکار و اصلاح شوند (S036, S041).",
        asIsWeakFa: "در غیاب کوتاه‌مدت مدیر، عملیات دچار اختلال یا افت شدید کیفیت می‌شود و سیستم قابلیت خودگردانی ندارد.",
        asIsGrowingFa: "عملیات روزمره در غیاب کوتاه‌مدت مدیر پیش می‌رود اما تصمیم‌های غیرمعمول و هماهنگی‌های کلیدی تا بازگشت او متوقف می‌ماند.",
        asIsStrongFa: "کسب‌وکار آزمون غیبت مدیر را با موفقیت می‌گذراند و عملیات بدون افت کیفیت ادامه می‌یابد.",
        toBeFa: "پایداری کامل عملیات و حفظ کیفیت خدمات در غیبت ۴ هفته‌ای مالک با تکیه بر جانشین‌پذیری و پروتکل‌های جاری.",
        actionStepFa: "اجرای آزمون مرخصی کوتاه‌مدت (غیبت آزمایشی ۳ تا ۷ روزه، ثبت نقاط توقف و رفع وابستگی‌ها)",
        rummlerLevel: "process_whitespace",
        nadlerPairFa: "هم‌خوانی ساختار رسمی و فرهنگ خودگردانی (Formal Structure ↔ Informal Culture)",
        vaultConceptsFa: ["جاری‌سازی", "تکرارپذیری", "تفویض اختیار", "پایداری عملیات"],
        sourceIds: ["S036", "S040", "S041", "S052"],
        children: [
          "آزمون غیبت مدیر یا مالک",
          "تداوم خدمت و عملیات",
          "نقاط وابستگی به مدیر",
          "پوشش جانشین و انتقال اختیار",
          "اقدام اصلاحی پس از آزمون",
        ],
        subKeywords: [
          { id: "L3-K3-S1", titleFa: "آزمون غیبت مدیر یا مالک", weights: [{ item: "FL.L3.Q1", weight: 0.8 }, { item: "FL.L1.Q1", weight: 0.2 }] },
          { id: "L3-K3-S2", titleFa: "تداوم خدمت و عملیات", weights: [{ item: "FL.L3.Q1", weight: 0.7 }, { item: "FL.L3.Q4", weight: 0.3 }] },
          { id: "L3-K3-S3", titleFa: "نقاط وابستگی به مدیر", weights: [{ item: "FL.L3.Q1", weight: 0.55 }, { item: "FL.L1.Q2", weight: 0.45 }] },
          { id: "L3-K3-S4", titleFa: "پوشش جانشین و انتقال اختیار", weights: [{ item: "FL.L3.Q1", weight: 0.6 }, { item: "FL.L2.Q3", weight: 0.4 }] },
          { id: "L3-K3-S5", titleFa: "اقدام اصلاحی پس از آزمون", weights: [{ item: "FL.L3.Q1", weight: 0.5 }, { item: "FL.L3.Q4", weight: 0.5 }] },
        ],
        questionIds: ["FL.L3.Q1", "FL.L3.Q4", "FL.L1.Q1", "FL.L2.Q3", "FL.L5.Q3"],
      },
    ],
  },
  {
    yamlKey: "maintenance",
    findingId: "layer-monitor",
    titleFa: "نگهداشت و پایش",
    constructFa: "میزان رصد عددی با KPIهای پیش‌نگر، ریتم جلسات مسئله‌محور و حل مسئلهٔ سیستمی (A3/RCA) به‌جای سرزنش افراد",
    asIsFa: "مدیریت بر مبنای بحران و حساب بانکی؛ جلسات نامنظم هنگام آتش‌سوزی کاری.",
    toBeFa: "داشبورد شاخص‌های کلیدی (KPI)، جلسات هفتگی ثابت حل مسئله، اصلاح مستمر باگ‌ها.",
    actionsFa: "استقرار داشبورد عددی هفتگی، ریتم جلسات منضبط هفتگی، ایجاد رویه ثبت و بازبینی باگ‌های فرآیندی.",
    keywords: [
      {
        id: "L4-K1",
        titleFa: "استقرار داشبورد عددی هفتگی",
        ownerRoleFa: "مدیر عملیات / مالک کسب‌وکار",
        horizonFa: "کوتاه‌مدت",
        whyFa: "مدیریت بر اساس حس یا موجودی لحظه‌ای حساب بانکی باعث می‌شود انحراف‌ها زمانی دیده شوند که خسارت رخ داده است؛ داشبورد KPIهای پیش‌نگر هشدار زودهنگام می‌دهد (S039, S043, S049).",
        asIsWeakFa: "کسب‌وکار بدون داشبورد عددی و صرفاً بر اساس شهود، موجودی حساب یا پرس‌وجوی دستی مدیریت می‌شود و انحراف‌ها دیر تشخیص داده می‌شوند.",
        asIsGrowingFa: "گزارش‌های عددی پراکنده وجود دارد اما هنوز به یک داشبورد هفتگی منظم با آستانهٔ هشدار خودکار تبدیل نشده است.",
        asIsStrongFa: "شاخص‌های کلیدی عملکرد (KPI) در قالب داشبورد هفتگی منظم رصد شده و انحراف‌ها به‌موقع هشدار داده می‌شوند.",
        toBeFa: "داشبورد هفتگی شامل ۵ تا ۷ شاخص کلیدی پیش‌نگر و پس‌نگر با مالک مشخص و آستانهٔ هشدار روشن.",
        actionStepFa: "استقرار داشبورد عددی هفتگی (تعریف ۵ شاخص کلیدی عملکرد، آستانهٔ هشدار و مالک هر شاخص)",
        rummlerLevel: "organization",
        nadlerPairFa: "هم‌خوانی ساختار رسمی و کار (Formal Structure ↔ Task)",
        vaultConceptsFa: ["پایش", "شاخص کلیدی عملکرد (KPI)", "شواهد", "تصمیم‌گیری داده‌محور"],
        sourceIds: ["S039", "S043", "S049", "S050"],
        children: [
          "شاخص‌های کلیدی عملکرد (KPI)",
          "تعریف هدف و آستانه هشدار",
          "منبع داده و کیفیت داده",
          "روند، مقایسه و انحراف",
          "تناوب گزارش و مالک شاخص",
        ],
        subKeywords: [
          { id: "L4-K1-S1", titleFa: "شاخص‌های کلیدی عملکرد (KPI)", weights: [{ item: "FL.L4.Q1", weight: 0.8 }, { item: "FL.L1.Q3", weight: 0.2 }] },
          { id: "L4-K1-S2", titleFa: "تعریف هدف و آستانه هشدار", weights: [{ item: "FL.L4.Q4", weight: 0.65 }, { item: "FL.L4.Q1", weight: 0.35 }] },
          { id: "L4-K1-S3", titleFa: "منبع داده و کیفیت داده", weights: [{ item: "FL.L4.Q1", weight: 0.7 }, { item: "FL.L1.Q4", weight: 0.3 }] },
          { id: "L4-K1-S4", titleFa: "روند، مقایسه و انحراف", weights: [{ item: "FL.L4.Q1", weight: 0.55 }, { item: "FL.L4.Q4", weight: 0.45 }] },
          { id: "L4-K1-S5", titleFa: "تناوب گزارش و مالک شاخص", weights: [{ item: "FL.L4.Q1", weight: 0.6 }, { item: "FL.L4.Q2", weight: 0.4 }] },
        ],
        questionIds: ["FL.L4.Q1", "FL.L4.Q4", "FL.L1.Q3", "FL.L1.Q4", "FL.L5.Q4"],
      },
      {
        id: "L4-K2",
        titleFa: "ریتم جلسات منضبط هفتگی",
        ownerRoleFa: "مالک کسب‌وکار / مدیر داخلی",
        horizonFa: "کوتاه‌مدت",
        whyFa: "داشبورد بدون ریتم ثابتِ بازبینی و پیگیری مصوبات فقط یک جدول است؛ جلسات ساختاریافتهٔ هفتگی موتور چرخهٔ PDSA و پاسخ‌گویی تیم است (S022 Taylor, S043, S051 Shook).",
        asIsWeakFa: "جلسات کاری بی‌برنامه و واکنشی است و صرفاً هنگام بروز بحران یا آتش‌سوزی عملیاتی تشکیل می‌شود.",
        asIsGrowingFa: "جلسات برگزار می‌شود اما به دلیل نبود دستورجلسهٔ استاندارد و پیگیری مصوبات، خروجی اجرایی پایداری ندارد.",
        asIsStrongFa: "ریتم جلسات هفتگی منظم، داده‌محور و با دستورجلسه و پیگیری دقیق مصوبات برقرار است.",
        toBeFa: "ریتم ثابت جلسات هفتگی با دستورجلسهٔ استاندارد (مرور KPIها، تحلیل انحراف، ثبت مالک اقدام و موعد تحویل).",
        actionStepFa: "برقراری ریتم جلسات منضبط هفتگی (با تقویم ثابت، مرور داشبورد و ثبت مالک و موعد هر مصوبه)",
        rummlerLevel: "process_whitespace",
        nadlerPairFa: "هم‌خوانی ساختار رسمی و فرهنگ پاسخ‌گویی (Formal Structure ↔ Informal Culture)",
        vaultConceptsFa: ["پایش", "بهبود مستمر", "حل مسئله و A3", "هم‌راستایی"],
        sourceIds: ["S022", "S043", "S051"],
        children: [
          "دستورجلسه و ریتم ثابت",
          "مرور عملکرد و انحراف‌ها",
          "تصمیم‌گیری و حل مسئله",
          "مالک اقدام و موعد پیگیری",
          "ثبت تصمیم و بازبینی تعهدات",
        ],
        subKeywords: [
          { id: "L4-K2-S1", titleFa: "دستورجلسه و ریتم ثابت", weights: [{ item: "FL.L4.Q2", weight: 0.85 }, { item: "FL.L3.Q4", weight: 0.15 }] },
          { id: "L4-K2-S2", titleFa: "مرور عملکرد و انحراف‌ها", weights: [{ item: "FL.L4.Q2", weight: 0.6 }, { item: "FL.L4.Q1", weight: 0.4 }] },
          { id: "L4-K2-S3", titleFa: "تصمیم‌گیری و حل مسئله", weights: [{ item: "FL.L4.Q2", weight: 0.7 }, { item: "FL.L4.Q3", weight: 0.3 }] },
          { id: "L4-K2-S4", titleFa: "مالک اقدام و موعد پیگیری", weights: [{ item: "FL.L4.Q2", weight: 0.7 }, { item: "FL.L2.Q4", weight: 0.3 }] },
          { id: "L4-K2-S5", titleFa: "ثبت تصمیم و بازبینی تعهدات", weights: [{ item: "FL.L4.Q2", weight: 0.75 }, { item: "FL.L3.Q3", weight: 0.25 }] },
        ],
        questionIds: ["FL.L4.Q2", "FL.L4.Q1", "FL.L3.Q4"],
      },
      {
        id: "L4-K3",
        titleFa: "ایجاد رویه ثبت و بازبینی باگ‌های فرآیندی",
        ownerRoleFa: "مدیر عملیات / سرپرست کیفیت",
        horizonFa: "میان‌مدت",
        whyFa: "سرزنش فرد هنگام خطا باعث پنهان‌کاری می‌شود و سیستم معیوب دست‌نخورده باقی می‌ماند؛ تحلیل علت ریشه‌ای (RCA/A3) خطا را به اصلاح SOP تبدیل می‌کند (Deming S049, Peerally S054, Shook S051).",
        asIsWeakFa: "هنگام بروز خطا واکنش اول سرزنش یا جریمهٔ فرد است و سازوکاری برای ثبت باگ‌های فرآیندی و اصلاح ریشه‌ای سیستم وجود ندارد.",
        asIsGrowingFa: "بخشی از خطاها بررسی می‌شود اما هنوز به چرخهٔ منظم تحلیل علت ریشه‌ای (RCA) و به‌روزرسانی خودکار SOPها منتهی نمی‌شود.",
        asIsStrongFa: "فرهنگ حل مسئلهٔ سیستمی برقرار است و خطاهای تکراری بدون مقصرانگاری به اصلاح فرآیند و SOP تبدیل می‌شوند.",
        toBeFa: "رویهٔ بدون سرزنش برای ثبت عدم‌انطباق‌ها، تحلیل علت ریشه‌ای به روش A3 و به‌روزرسانی مستندات برای جلوگیری از تکرار خطا.",
        actionStepFa: "ایجاد رویه ثبت و بازبینی باگ‌های فرآیندی (جایگزینی سرزنش فرد با برگهٔ حل مسئلهٔ A3 و اصلاح SOP)",
        rummlerLevel: "process_whitespace",
        nadlerPairFa: "هم‌خوانی کار و فرهنگ یادگیری (Task ↔ Informal Culture)",
        vaultConceptsFa: ["تحلیل علت ریشه‌ای", "حل مسئله و A3", "بهبود مستمر", "یادگیری سازمانی"],
        sourceIds: ["S044", "S048", "S051", "S053", "S054"],
        children: [
          "ثبت خطا و عدم انطباق",
          "تحلیل علت ریشه‌ای (RCA)",
          "اقدام اصلاحی و پیشگیرانه (CAPA)",
          "به‌روزرسانی مستندات و SOP",
          "تأیید اثربخشی و پایش تکرار",
        ],
        subKeywords: [
          { id: "L4-K3-S1", titleFa: "ثبت خطا و عدم انطباق", weights: [{ item: "FL.L4.Q4", weight: 0.6 }, { item: "FL.L4.Q3", weight: 0.4 }] },
          { id: "L4-K3-S2", titleFa: "تحلیل علت ریشه‌ای (RCA)", weights: [{ item: "FL.L4.Q3", weight: 0.8 }, { item: "FL.L4.Q2", weight: 0.2 }] },
          { id: "L4-K3-S3", titleFa: "اقدام اصلاحی و پیشگیرانه (CAPA)", weights: [{ item: "FL.L4.Q3", weight: 0.7 }, { item: "FL.L4.Q4", weight: 0.3 }] },
          { id: "L4-K3-S4", titleFa: "به‌روزرسانی مستندات و SOP", weights: [{ item: "FL.L4.Q3", weight: 0.55 }, { item: "FL.L2.Q2", weight: 0.45 }] },
          { id: "L4-K3-S5", titleFa: "تأیید اثربخشی و پایش تکرار", weights: [{ item: "FL.L4.Q4", weight: 0.65 }, { item: "FL.L4.Q1", weight: 0.35 }] },
        ],
        questionIds: ["FL.L4.Q3", "FL.L4.Q4", "FL.L2.Q4", "FL.L3.Q3"],
      },
    ],
  },
  {
    yamlKey: "scaling",
    findingId: "layer-scale",
    titleFa: "توسعه و مقیاس‌پذیری",
    constructFa: "توان مقیاس‌پذیری عملیات، قابلیت تکثیر مدل بدون مالک (Arrow Core)، و سلامت اقتصاد واحد (Unit Economics)",
    asIsFa: "سقف رشد مسدود به زمان فیزیکی مالک؛ ناتوانی در پذیرش سفارش‌های بزرگ‌تر.",
    toBeFa: "قابلیت تکثیر آسان؛ آمادگی برای ایجاد شعب، برون‌سپاری یا نمایندگی.",
    actionsFa: "استانداردسازی پکیج عملیاتی، شناسایی خدمات مقیاس‌پذیر، ایجاد ظرفیت زیرسیستم‌های جدید.",
    keywords: [
      {
        id: "L5-K1",
        titleFa: "استانداردسازی پکیج عملیاتی",
        ownerRoleFa: "مالک کسب‌وکار / معمار سیستم",
        horizonFa: "میان‌مدت",
        whyFa: "تکثیر شعبه، نمایندگی یا خط درآمد جدید بدون داشتن «هستهٔ استاندارد تکثیرپذیر (Arrow Core / Operations Manual)» تنها بی‌نظمی و افت کیفیت را چندبرابر می‌کند (Winter & Szulanski 2001, S046 IFA, S047).",
        asIsWeakFa: "مدل عملیاتی کسب‌وکار وابسته به حضور مستقیم مالک است و پکیج استاندارد و قابل تکثیری برای شعبه، نمایندگی یا خط جدید وجود ندارد.",
        asIsGrowingFa: "اجزای اولیهٔ عملیات مشخص شده‌اند اما هنوز به یک کتابچهٔ عملیاتی یکپارچه که بدون حضور مالک قابل تکثیر باشد تبدیل نشده‌اند.",
        asIsStrongFa: "پکیج عملیاتی کسب‌وکار استاندارد شده و قابلیت تکثیر بدون حضور مستقیم مالک را دارد.",
        toBeFa: "کتابچهٔ عملیات (Operations Playbook) شامل فرآیندهای هسته، استاندارد کیفیت و بستهٔ انتقال دانش برای تکثیر مستقل.",
        actionStepFa: "استانداردسازی پکیج عملیاتی (تجمیع SOPهای هسته، استاندارد کیفیت و چک‌لیست راه‌اندازی واحد جدید)",
        rummlerLevel: "organization",
        nadlerPairFa: "هم‌خوانی ساختار رسمی و کار (Formal Structure ↔ Task)",
        vaultConceptsFa: ["فرانچایز و تکثیر", "مقیاس‌پذیری", "روش اجرای کار (SOP)", "کیفیت"],
        sourceIds: ["S045", "S046", "S047"],
        children: [
          "فرآیندهای هسته و استاندارد عملیاتی",
          "کتابچه عملیات و SOPهای قابل تکثیر",
          "آموزش و انتقال دانش به شعب",
          "استاندارد تجربه برند و کیفیت",
          "پایش انطباق و پشتیبانی شعب",
        ],
        subKeywords: [
          { id: "L5-K1-S1", titleFa: "فرآیندهای هسته و استاندارد عملیاتی", weights: [{ item: "FL.L5.Q2", weight: 0.65 }, { item: "FL.L2.Q2", weight: 0.35 }] },
          { id: "L5-K1-S2", titleFa: "کتابچه عملیات و SOPهای قابل تکثیر", weights: [{ item: "FL.L5.Q2", weight: 0.7 }, { item: "FL.L2.Q3", weight: 0.3 }] },
          { id: "L5-K1-S3", titleFa: "آموزش و انتقال دانش به شعب", weights: [{ item: "FL.L5.Q2", weight: 0.6 }, { item: "FL.L3.Q4", weight: 0.4 }] },
          { id: "L5-K1-S4", titleFa: "استاندارد تجربه برند و کیفیت", weights: [{ item: "FL.L5.Q2", weight: 0.6 }, { item: "FL.L5.Q1", weight: 0.4 }] },
          { id: "L5-K1-S5", titleFa: "پایش انطباق و پشتیبانی شعب", weights: [{ item: "FL.L5.Q2", weight: 0.65 }, { item: "FL.L3.Q1", weight: 0.35 }] },
        ],
        questionIds: ["FL.L5.Q2", "FL.L5.Q3", "FL.L2.Q2", "FL.L3.Q1", "FL.L1.Q1"],
      },
      {
        id: "L5-K2",
        titleFa: "شناسایی خدمات مقیاس‌پذیر",
        ownerRoleFa: "مالک کسب‌وکار",
        horizonFa: "میان‌مدت",
        whyFa: "رشد فروش بدون اقتصاد واحد سالم (Unit Economics) و خدمات تکرارپذیر، با هر مشتری جدید فقط هزینه، زمان مالک و پیچیدگی را به همان نسبت یا بیشتر بالا می‌برد (S045, Organization Science 2025).",
        asIsWeakFa: "رشد کسب‌وکار به ساعت کاری شخصی مالک قفل شده و با افزایش مشتریان، زمان و هزینهٔ تحویل هر سفارش به‌شدت بالا می‌رود (اقتصاد واحد نامطلوب).",
        asIsGrowingFa: "برخی خدمات پتانسیل تکرارپذیری دارند اما هنوز حاشیهٔ سود واحد و جداسازی خدمات استاندارد از سفارش‌های سفارشیِ پرهزینه کامل نشده است.",
        asIsStrongFa: "خدمات مقیاس‌پذیر با اقتصاد واحد سالم و مستقل از ساعت کاری شخصی مالک تعریف و تثبیت شده‌اند.",
        toBeFa: "تفکیک محصول/خدمت استاندارد و تکرارپذیر با حاشیهٔ مشارکت مثبت که با افزایش حجم مشتریان، هزینهٔ نهایی تحویل هر واحد کاهش یابد.",
        actionStepFa: "شناسایی خدمات مقیاس‌پذیر و بهینه‌سازی اقتصاد واحد (حذف گلوگاه‌های سفارشی‌سازی پرهزینه در تحویل خدمت)",
        rummlerLevel: "organization",
        nadlerPairFa: "هم‌خوانی راهبرد و طراحی کار (Strategy ↔ Task)",
        vaultConceptsFa: ["مقیاس‌پذیری", "مدل کسب‌وکار", "اقتصاد واحد", "اتوماسیون"],
        sourceIds: ["S045", "S036", "S023", "S025"],
        children: [
          "تکرارپذیری مدل خدمت",
          "تقاضا و تناسب بخش بازار",
          "اقتصاد واحد و حاشیه مشارکت",
          "هزینه نهایی تحویل خدمت",
          "پتانسیل دیجیتالی‌سازی و خودکارسازی",
        ],
        subKeywords: [
          { id: "L5-K2-S1", titleFa: "تکرارپذیری مدل خدمت", weights: [{ item: "FL.L5.Q2", weight: 0.55 }, { item: "FL.L5.Q3", weight: 0.45 }] },
          { id: "L5-K2-S2", titleFa: "تقاضا و تناسب بخش بازار", weights: [{ item: "FL.L5.Q1", weight: 0.5 }, { item: "FL.L1.Q3", weight: 0.5 }] },
          { id: "L5-K2-S3", titleFa: "اقتصاد واحد و حاشیه مشارکت", weights: [{ item: "FL.L5.Q4", weight: 0.85 }, { item: "FL.L1.Q4", weight: 0.15 }] },
          { id: "L5-K2-S4", titleFa: "هزینه نهایی تحویل خدمت", weights: [{ item: "FL.L5.Q4", weight: 0.75 }, { item: "FL.L5.Q3", weight: 0.25 }] },
          { id: "L5-K2-S5", titleFa: "پتانسیل دیجیتالی‌سازی و خودکارسازی", weights: [{ item: "FL.L5.Q4", weight: 0.6 }, { item: "FL.L5.Q1", weight: 0.4 }] },
        ],
        questionIds: ["FL.L5.Q1", "FL.L5.Q2", "FL.L5.Q3", "FL.L5.Q4", "FL.L1.Q3"],
      },
      {
        id: "L5-K3",
        titleFa: "ایجاد ظرفیت زیرسیستم‌های جدید",
        ownerRoleFa: "مالک کسب‌وکار / مدیر عملیات",
        horizonFa: "میان‌مدت",
        whyFa: "پذیرش ۳ برابر سفارش جدید روی زیرساخت و تیمِ در حد اشباع، سیستم تحویل و کیفیت را متلاشی می‌کند؛ مقیاس‌پذیری نیازمند ظرفیت‌سازی ماژولار پیش از جهش تقاضاست (S045, S046, S052).",
        asIsWeakFa: "ظرفیت عملیاتی، زیرساخت و تیم در نقطهٔ اشباع است و در صورت جهش سفارش‌ها کیفیت خدمات به‌شدت افت می‌کند.",
        asIsGrowingFa: "ظرفیت پاسخ‌گویی به رشد محدود وجود دارد اما برای جهش چندبرابری نیازمند طراحی ماژولار زیرسیستم‌ها و اتوماسیون است.",
        asIsStrongFa: "زیرساخت‌ها و زیرسیستم‌های عملیاتی ظرفیت جذب جهش سفارش‌ها را بدون افت کیفیت دارند.",
        toBeFa: "طراحی ماژولار زیرسیستم‌های تأمین، عملیات و کنترل کیفیت با قابلیت افزایش ظرفیت سریع بدون فروپاشی کیفیت.",
        actionStepFa: "ایجاد ظرفیت زیرسیستم‌های جدید (ظرفیت‌سنجی گلوگاه‌های تحویل و آماده‌سازی زیرساخت برای رشد ۳ برابری)",
        rummlerLevel: "organization",
        nadlerPairFa: "هم‌خوانی ساختار رسمی و ظرفیت منابع (Formal Structure ↔ People & Tech)",
        vaultConceptsFa: ["مقیاس‌پذیری", "طراحی سیستم", "زیرساخت و ظرفیت", "حاکمیت سازمانی"],
        sourceIds: ["S036", "S045", "S046", "S052", "S055"],
        children: [
          "ظرفیت‌سنجی نیروی انسانی و تجهیزات",
          "طراحی ماژولار زیرسیستم‌ها",
          "زنجیره تأمین و شرکای اجرا",
          "زیرساخت فناوری و داده",
          "ظرفیت کنترل کیفیت و نظارت",
        ],
        subKeywords: [
          { id: "L5-K3-S1", titleFa: "ظرفیت‌سنجی نیروی انسانی و تجهیزات", weights: [{ item: "FL.L5.Q1", weight: 0.75 }, { item: "FL.L5.Q3", weight: 0.25 }] },
          { id: "L5-K3-S2", titleFa: "طراحی ماژولار زیرسیستم‌ها", weights: [{ item: "FL.L5.Q1", weight: 0.65 }, { item: "FL.L2.Q4", weight: 0.35 }] },
          { id: "L5-K3-S3", titleFa: "زنجیره تأمین و شرکای اجرا", weights: [{ item: "FL.L5.Q1", weight: 0.6 }, { item: "FL.L5.Q4", weight: 0.4 }] },
          { id: "L5-K3-S4", titleFa: "زیرساخت فناوری و داده", weights: [{ item: "FL.L5.Q4", weight: 0.55 }, { item: "FL.L4.Q4", weight: 0.45 }] },
          { id: "L5-K3-S5", titleFa: "ظرفیت کنترل کیفیت و نظارت", weights: [{ item: "FL.L5.Q1", weight: 0.65 }, { item: "FL.L4.Q3", weight: 0.35 }] },
        ],
        questionIds: ["FL.L5.Q1", "FL.L5.Q3", "FL.L5.Q4", "FL.L4.Q4"],
      },
    ],
  },
];

export const crossPatterns: CrossPattern[] = [
  {
    id: "written_not_executed",
    meaningFa:
      "انفکاک سیاست از عمل (Policy-Practice Decoupling): فرآیندها نوشته شده‌اند اما در عمل روزمره اجرا نمی‌شوند؛ مسئله از جنس جاری‌سازی، حدود اختیار و فرهنگ سیستم‌پذیری است، نه مستندسازی بیشتر.",
    actionFa:
      "به‌جای نوشتن سند تازه، روی ماتریس حدود اختیار (L3-K1)، آموزش سناریومحور (L3-K2) و آزمون مرخصی کوتاه‌مدت (L3-K3) تمرکز کنید.",
    when: {
      strong: "layer-architecture",
      weak: "layer-flow",
      alsoWeak: null,
      weakAny: [],
    },
  },
  {
    id: "owner_trap",
    meaningFa:
      "حلقهٔ وابستگی به بنیان‌گذار (Founder Dependency Loop): هم نقش مالک از مجری جدا نشده و هم تیم بدون تأیید مدیر حرکت نمی‌کند؛ این دو لایه یک ریشهٔ ساختاری واحد دارند.",
    actionFa:
      "از ممیزی و آزادسازی زمان مالک (L1-K3) شروع کنید و هم‌زمان حدود اختیار تصمیم‌گیری پرسنل و قواعد ارجاع استثنا را مکتوب کنید (L3-K1).",
    when: {
      strong: null,
      weak: "layer-foundation",
      alsoWeak: "layer-flow",
      weakAny: [],
    },
  },
  {
    id: "undocumented_execution",
    meaningFa:
      "اجرای متکی بر حافظهٔ شفاهی (Tacit Execution Fragility): تیم فعلاً با تجربهٔ افراد کار را پیش می‌برد اما دانش در ذهن‌هاست؛ با رشد یا خروج افراد کلیدی، کیفیت فرو می‌ریزد.",
    actionFa:
      "استخراج دانش ضمنی مجریان و تدوین SOP برای ۵ فرایند کلیدی (L2-K2) و چک‌لیست‌های تحویل کار در فضای خالی بین نقش‌ها (L2-K3) را پیش از هر برنامهٔ رشد اجرا کنید.",
    when: {
      strong: "layer-flow",
      weak: "layer-architecture",
      alsoWeak: null,
      weakAny: [],
    },
  },
  {
    id: "blind_management",
    meaningFa:
      "مدیریت واکنشی و بدون دیدبانی (Blind & Reactive Operations): مدیریت بر مبنای بحران، شهود و موجودی حساب؛ انحراف‌ها دیر دیده می‌شوند و هر اصلاحی بدون پایش، ناپایدار می‌ماند.",
    actionFa:
      "استقرار داشبورد هفتگی KPI (L4-K1) و ریتم جلسهٔ منضبط حل مسئله (L4-K2) پیش‌شرط پایداری سایر اصلاحات سیستمی است.",
    when: {
      strong: null,
      weak: "layer-monitor",
      alsoWeak: null,
      weakAny: [],
    },
  },
  {
    id: "premature_scaling",
    meaningFa:
      "مقیاس‌گیری زودرس (Premature Scaling Hazard): میل یا آمادگی رشد از بلوغ لایه‌های زیربنایی جلو زده است؛ مقیاس‌گرفتن روی پایهٔ سست، خطاها و هزینهٔ هماهنگی را چندبرابر می‌کند.",
    actionFa:
      "پیش از تکثیر شعبه یا جذب سنگین مشتری، ابتدا گلوگاه لایه‌های پایه را ببندید و اقتصاد واحد خدمت را تثبیت کنید (L5-K1 و L5-K2).",
    when: {
      strong: "layer-scale",
      weak: null,
      alsoWeak: null,
      weakAny: ["layer-foundation", "layer-architecture", "layer-flow"],
    },
  },
  {
    id: "means_ends_decoupling",
    meaningFa:
      "انفکاک وسیله از هدف (Means-Ends Decoupling): جلسات و گزارش‌ها برقرار است اما به دلیل ضعف در هدف‌گذاری راهبردی یا اقتصاد واحد، این فعالیت‌ها به سودآوری و مقیاس‌پذیری منتهی نمی‌شوند.",
    actionFa:
      "شاخص‌های پایش هفتگی (L4-K1) را مستقیماً به هدف استراتژیک ۱ صفحه‌ای (L1-K1) و اقتصاد واحد خدمت (L5-K2) متصل کنید.",
    when: {
      strong: "layer-monitor",
      weak: "layer-foundation",
      alsoWeak: "layer-scale",
      weakAny: [],
    },
  },
];

export const casioKeywords: { id: string; labelFa: string }[] = layerCopy.flatMap((layer) =>
  layer.keywords.map((keyword) => ({
    id: keyword.id,
    labelFa: keyword.titleFa,
  })),
);

/**
 * ماتریس یال‌های چندبه‌چند و کالیبره‌شده (Stage 1 & 2 Many-to-Many Graph Edges):
 * ۱. یال‌های کلیدواژه به لایهٔ مادر (L1-K1..L5-K3 -> layer-*)
 * ۲. یال‌های کانونی درون‌لایه‌ای (Primary Intra-Layer Loadings: 0.65..0.90)
 * ۳. یال‌های کمکی درون‌لایه‌ای (Secondary Intra-Layer Loadings: 0.25..0.55)
 * ۴. یال‌های علّی بین‌لایه‌ای (Cross-Layer Causal Loadings: 0.20..0.45)
 */
export const casioKeywordEdges: {
  from: string;
  to: string;
  weight: number;
  transform: "identity";
}[] = [
  // --- یال‌های اتصال کلیدواژه‌ها به لایه‌های پنج‌گانه ---
  { from: "L1-K1", to: "layer-foundation", weight: 1, transform: "identity" },
  { from: "L1-K2", to: "layer-foundation", weight: 1, transform: "identity" },
  { from: "L1-K3", to: "layer-foundation", weight: 1, transform: "identity" },

  { from: "L2-K1", to: "layer-architecture", weight: 1, transform: "identity" },
  { from: "L2-K2", to: "layer-architecture", weight: 1, transform: "identity" },
  { from: "L2-K3", to: "layer-architecture", weight: 1, transform: "identity" },

  { from: "L3-K1", to: "layer-flow", weight: 1, transform: "identity" },
  { from: "L3-K2", to: "layer-flow", weight: 1, transform: "identity" },
  { from: "L3-K3", to: "layer-flow", weight: 1, transform: "identity" },

  { from: "L4-K1", to: "layer-monitor", weight: 1, transform: "identity" },
  { from: "L4-K2", to: "layer-monitor", weight: 1, transform: "identity" },
  { from: "L4-K3", to: "layer-monitor", weight: 1, transform: "identity" },

  { from: "L5-K1", to: "layer-scale", weight: 1, transform: "identity" },
  { from: "L5-K2", to: "layer-scale", weight: 1, transform: "identity" },
  { from: "L5-K3", to: "layer-scale", weight: 1, transform: "identity" },

  // --- لایهٔ ۱: بنیان و رهبری (درون‌لایه‌ای + بین‌لایه‌ای) ---
  // L1-K1: تدوین هدف استراتژیک ۱ صفحه‌ای
  { from: "FL.L1.Q3", to: "L1-K1", weight: 0.85, transform: "identity" },
  { from: "FL.L1.Q1", to: "L1-K1", weight: 0.25, transform: "identity" },
  { from: "FL.L1.Q2", to: "L1-K1", weight: 0.20, transform: "identity" },
  { from: "FL.L4.Q1", to: "L1-K1", weight: 0.25, transform: "identity" },
  { from: "FL.L5.Q2", to: "L1-K1", weight: 0.20, transform: "identity" },

  // L1-K2: اصلاح برداشت‌های مالی
  { from: "FL.L1.Q4", to: "L1-K2", weight: 0.90, transform: "identity" },
  { from: "FL.L4.Q1", to: "L1-K2", weight: 0.25, transform: "identity" },
  { from: "FL.L5.Q4", to: "L1-K2", weight: 0.25, transform: "identity" },

  // L1-K3: آزادسازی زمان مالک برای نقش طراحی
  { from: "FL.L1.Q1", to: "L1-K3", weight: 0.75, transform: "identity" },
  { from: "FL.L1.Q2", to: "L1-K3", weight: 0.80, transform: "identity" },
  { from: "FL.L3.Q1", to: "L1-K3", weight: 0.35, transform: "identity" },
  { from: "FL.L3.Q2", to: "L1-K3", weight: 0.30, transform: "identity" },
  { from: "FL.L5.Q3", to: "L1-K3", weight: 0.40, transform: "identity" },

  // --- لایهٔ ۲: معماری و طراحی (درون‌لایه‌ای + بین‌لایه‌ای) ---
  // L2-K1: نقشه‌برداری زنجیره ارزش مشتری
  { from: "FL.L2.Q1", to: "L2-K1", weight: 0.85, transform: "identity" },
  { from: "FL.L2.Q4", to: "L2-K1", weight: 0.30, transform: "identity" },
  { from: "FL.L5.Q4", to: "L2-K1", weight: 0.25, transform: "identity" },

  // L2-K2: استخراج ۵ فرآیند کلیدی با مصاحبه از مجریان
  { from: "FL.L2.Q2", to: "L2-K2", weight: 0.80, transform: "identity" },
  { from: "FL.L2.Q3", to: "L2-K2", weight: 0.65, transform: "identity" },
  { from: "FL.L2.Q1", to: "L2-K2", weight: 0.35, transform: "identity" },
  { from: "FL.L3.Q3", to: "L2-K2", weight: 0.30, transform: "identity" },
  { from: "FL.L3.Q4", to: "L2-K2", weight: 0.25, transform: "identity" },

  // L2-K3: تدوین چک‌لیست‌های تحویل کار (مدیریت فضای خالی Rummler-Brache)
  { from: "FL.L2.Q4", to: "L2-K3", weight: 0.80, transform: "identity" },
  { from: "FL.L2.Q2", to: "L2-K3", weight: 0.45, transform: "identity" },
  { from: "FL.L2.Q3", to: "L2-K3", weight: 0.50, transform: "identity" },
  { from: "FL.L3.Q2", to: "L2-K3", weight: 0.30, transform: "identity" },
  { from: "FL.L4.Q3", to: "L2-K3", weight: 0.30, transform: "identity" },

  // --- لایهٔ ۳: جاری‌سازی (درون‌لایه‌ای + بین‌لایه‌ای) ---
  // L3-K1: تعیین اختیارات تصمیم‌گیری مالی و عملیاتی پرسنل
  { from: "FL.L3.Q2", to: "L3-K1", weight: 0.80, transform: "identity" },
  { from: "FL.L3.Q1", to: "L3-K1", weight: 0.45, transform: "identity" },
  { from: "FL.L3.Q3", to: "L3-K1", weight: 0.35, transform: "identity" },
  { from: "FL.L3.Q4", to: "L3-K1", weight: 0.30, transform: "identity" },
  { from: "FL.L1.Q2", to: "L3-K1", weight: 0.45, transform: "identity" },
  { from: "FL.L2.Q4", to: "L3-K1", weight: 0.35, transform: "identity" },
  { from: "FL.L4.Q2", to: "L3-K1", weight: 0.20, transform: "identity" },

  // L3-K2: آموزش مبتنی بر سناریو (رفع انفکاک سیاست-عمل Bromley & Powell)
  { from: "FL.L3.Q3", to: "L3-K2", weight: 0.75, transform: "identity" },
  { from: "FL.L3.Q4", to: "L3-K2", weight: 0.80, transform: "identity" },
  { from: "FL.L3.Q2", to: "L3-K2", weight: 0.45, transform: "identity" },
  { from: "FL.L2.Q2", to: "L3-K2", weight: 0.30, transform: "identity" },
  { from: "FL.L2.Q3", to: "L3-K2", weight: 0.35, transform: "identity" },
  { from: "FL.L4.Q3", to: "L3-K2", weight: 0.25, transform: "identity" },

  // L3-K3: ارزیابی آزمون مرخصی کوتاه‌مدت
  { from: "FL.L3.Q1", to: "L3-K3", weight: 0.85, transform: "identity" },
  { from: "FL.L3.Q4", to: "L3-K3", weight: 0.40, transform: "identity" },
  { from: "FL.L1.Q1", to: "L3-K3", weight: 0.35, transform: "identity" },
  { from: "FL.L2.Q3", to: "L3-K3", weight: 0.30, transform: "identity" },
  { from: "FL.L5.Q3", to: "L3-K3", weight: 0.30, transform: "identity" },

  // --- لایهٔ ۴: نگهداشت و پایش (درون‌لایه‌ای + بین‌لایه‌ای) ---
  // L4-K1: استقرار داشبورد عددی هفتگی
  { from: "FL.L4.Q1", to: "L4-K1", weight: 0.85, transform: "identity" },
  { from: "FL.L4.Q4", to: "L4-K1", weight: 0.60, transform: "identity" },
  { from: "FL.L4.Q2", to: "L4-K1", weight: 0.25, transform: "identity" },
  { from: "FL.L1.Q3", to: "L4-K1", weight: 0.30, transform: "identity" },
  { from: "FL.L1.Q4", to: "L4-K1", weight: 0.25, transform: "identity" },
  { from: "FL.L5.Q4", to: "L4-K1", weight: 0.25, transform: "identity" },

  // L4-K2: ریتم جلسات منضبط هفتگی
  { from: "FL.L4.Q2", to: "L4-K2", weight: 0.85, transform: "identity" },
  { from: "FL.L4.Q1", to: "L4-K2", weight: 0.35, transform: "identity" },
  { from: "FL.L3.Q4", to: "L4-K2", weight: 0.25, transform: "identity" },

  // L4-K3: ایجاد رویه ثبت و بازبینی باگ‌های فرآیندی (RCA / A3 بدون سرزنش)
  { from: "FL.L4.Q3", to: "L4-K3", weight: 0.85, transform: "identity" },
  { from: "FL.L4.Q4", to: "L4-K3", weight: 0.60, transform: "identity" },
  { from: "FL.L4.Q2", to: "L4-K3", weight: 0.25, transform: "identity" },
  { from: "FL.L2.Q4", to: "L4-K3", weight: 0.25, transform: "identity" },
  { from: "FL.L3.Q3", to: "L4-K3", weight: 0.30, transform: "identity" },

  // --- لایهٔ ۵: توسعه و مقیاس‌پذیری (درون‌لایه‌ای + بین‌لایه‌ای) ---
  // L5-K1: استانداردسازی پکیج عملیاتی (Arrow Core Replication)
  { from: "FL.L5.Q2", to: "L5-K1", weight: 0.85, transform: "identity" },
  { from: "FL.L5.Q3", to: "L5-K1", weight: 0.55, transform: "identity" },
  { from: "FL.L2.Q2", to: "L5-K1", weight: 0.35, transform: "identity" },
  { from: "FL.L3.Q1", to: "L5-K1", weight: 0.35, transform: "identity" },
  { from: "FL.L1.Q1", to: "L5-K1", weight: 0.25, transform: "identity" },

  // L5-K2: شناسایی خدمات مقیاس‌پذیر و اقتصاد واحد (Unit Economics)
  { from: "FL.L5.Q4", to: "L5-K2", weight: 0.85, transform: "identity" },
  { from: "FL.L5.Q3", to: "L5-K2", weight: 0.65, transform: "identity" },
  { from: "FL.L5.Q1", to: "L5-K2", weight: 0.45, transform: "identity" },
  { from: "FL.L5.Q2", to: "L5-K2", weight: 0.40, transform: "identity" },
  { from: "FL.L1.Q3", to: "L5-K2", weight: 0.25, transform: "identity" },

  // L5-K3: ایجاد ظرفیت زیرسیستم‌های جدید
  { from: "FL.L5.Q1", to: "L5-K3", weight: 0.80, transform: "identity" },
  { from: "FL.L5.Q4", to: "L5-K3", weight: 0.50, transform: "identity" },
  { from: "FL.L5.Q3", to: "L5-K3", weight: 0.45, transform: "identity" },
  { from: "FL.L4.Q4", to: "L5-K3", weight: 0.25, transform: "identity" },
];

/**
 * تبدیل وزن یال‌های ورودی هر کلیدواژه به ضرایب نرمال‌شده با مجموع ۲.۰
 * تا حاصل weighted_sum روی گویه‌های ۰ تا ۱۰ دقیقاً در بازهٔ استاندارد [0, 20] قرار گیرد.
 */
export function normalizedKeywordFormulaWeights(
  keywordId: string,
  edges: { from: string; to: string; weight: number }[] = casioKeywordEdges,
): { item: string; weight: number }[] {
  const incoming = edges.filter((edge) => edge.to === keywordId && edge.from.startsWith("FL."));
  const sum = incoming.reduce((acc, edge) => acc + edge.weight, 0);
  if (sum <= 0) return [];
  return incoming.map((edge) => ({
    item: edge.from,
    weight: Math.round(((edge.weight * 2) / sum) * 10000) / 10000,
  }));
}
