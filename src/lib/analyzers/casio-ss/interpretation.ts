/** از interpretation-matrix.yaml v1.3.0 — متن گزارش. موتور نمره جداست. */

export const INTERPRETATION_VERSION = "five-layer-interpretation-1.3.0";

export type LayerKeyword = { id: string; titleFa: string; children: string[]; questionIds: string[] };
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
export type LayerBand = { id: string; labelFa: string; meaningFa: string; min: number; max: number; maxInclusive: boolean };
export type CrossPattern = {
  id: string;
  meaningFa: string;
  actionFa: string;
  when: { strong: string | null; weak: string | null; alsoWeak: string | null; weakAny: string[] };
};

export const layerBands: LayerBand[] = [
  {
    "id": "weak",
    "labelFa": "ضعف (گلوگاه بالقوه)",
    "meaningFa": "لایه عملاً برقرار نیست و به‌احتمال زیاد گلوگاه فعلی کل سیستم است.",
    "min": 0,
    "max": 10,
    "maxInclusive": false
  },
  {
    "id": "growing",
    "labelFa": "در حال رشد",
    "meaningFa": "اسکلت لایه وجود دارد اما ناپایدار است؛ با اقدام‌های مشخص قابل تثبیت است.",
    "min": 10,
    "max": 15,
    "maxInclusive": false
  },
  {
    "id": "strong",
    "labelFa": "قوی",
    "meaningFa": "لایه برقرار است؛ تمرکز بر تثبیت و انتقال الگو به لایه‌های ضعیف‌تر.",
    "min": 15,
    "max": 20,
    "maxInclusive": true
  }
];

export const layerCopy: LayerCopy[] = [
  {
    "yamlKey": "governance",
    "findingId": "layer-foundation",
    "titleFa": "بنیان و رهبری",
    "constructFa": "میزان جداسازی نقش مالک از اجرا و وجود استراتژی مکتوب و تسهیم‌شده",
    "asIsFa": "تله متخصص؛ بنیان‌گذار درگیر کارهای اجرایی است و اهداف کلان مکتوب نیست.",
    "toBeFa": "جداسازی نقش مالک از اپراتور؛ شفافیت استراتژی و تعیین سهم اهداف فصلی.",
    "actionsFa": "تدوین هدف استراتژیک ۱ صفحه‌ای، اصلاح برداشت‌های مالی، آزادسازی زمان مالک برای نقش طراحی.",
    "keywords": [
      {
        "id": "L1-K1",
        "titleFa": "تدوین هدف استراتژیک ۱ صفحه‌ای",
        "children": [
          "چشم‌انداز و رسالت",
          "اولویت‌ها و انتخاب‌های راهبردی",
          "اهداف سالانه و فصلی",
          "معیارهای موفقیت و نتایج کلیدی",
          "تسهیم و هم‌سویی اهداف با مدیران و شرکا"
        ],
        "questionIds": [
          "FL.L1.Q3"
        ]
      },
      {
        "id": "L1-K2",
        "titleFa": "اصلاح برداشت‌های مالی",
        "children": [
          "تفکیک حساب‌های شخصی و کسب‌وکار",
          "حقوق، برداشت و توزیع سود مالک",
          "هزینه‌های مرتبط با مالک و نرمال‌سازی سود",
          "سودآوری عملیاتی در برابر موجودی نقد",
          "جریان نقدی و سرمایه در گردش"
        ],
        "questionIds": [
          "FL.L1.Q4"
        ]
      },
      {
        "id": "L1-K3",
        "titleFa": "آزادسازی زمان مالک برای نقش طراحی",
        "children": [
          "ممیزی زمان مالک",
          "تفکیک نقش مالک، مدیر و اپراتور",
          "کاهش وابستگی عملیاتی به مالک",
          "واگذاری فعالیت‌های روزمره",
          "تداوم کسب‌وکار در غیاب مالک"
        ],
        "questionIds": [
          "FL.L1.Q1",
          "FL.L1.Q2"
        ]
      }
    ]
  },
  {
    "yamlKey": "architecture",
    "findingId": "layer-architecture",
    "titleFa": "معماری و طراحی",
    "constructFa": "میزان مکتوب بودن فرایندهای حیاتی، پوشش SOP و وضوح مسئولیت‌ها",
    "asIsFa": "وابستگی به دانش ذهنی افراد؛ خطاهای تکراری به دلیل نبود SOPهای ۱-۲-۳.",
    "toBeFa": "فرآیندهای استاندارد مکتوب در مسیر حیاتی مشتری (Critical Flow) و چک‌لیست‌ها.",
    "actionsFa": "نقشه‌برداری زنجیره ارزش مشتری، استخراج ۵ فرآیند کلیدی با مصاحبه از مجریان، تدوین چک‌لیست‌های تحویل کار.",
    "keywords": [
      {
        "id": "L2-K1",
        "titleFa": "نقشه‌برداری زنجیره ارزش مشتری",
        "children": [
          "نقشه سفر مشتری",
          "جریان انتهابه‌انتهای جذب تا تحویل",
          "نقاط تماس و تحویل بین‌نقشی",
          "ورودی‌ها، خروجی‌ها و ارزش مشتری",
          "گلوگاه‌ها، انتظار و دوباره‌کاری"
        ],
        "questionIds": [
          "FL.L2.Q1"
        ]
      },
      {
        "id": "L2-K2",
        "titleFa": "استخراج ۵ فرآیند کلیدی با مصاحبه از مجریان",
        "children": [
          "اولویت‌بندی فرآیندهای حیاتی",
          "مصاحبه و مشاهده مجریان",
          "استخراج دانش ضمنی",
          "مرزبندی فرآیند با SIPOC",
          "مدل‌سازی وضعیت موجود (As-Is)"
        ],
        "questionIds": [
          "FL.L2.Q1",
          "FL.L2.Q2",
          "FL.L2.Q3"
        ]
      },
      {
        "id": "L2-K3",
        "titleFa": "تدوین چک‌لیست‌های تحویل کار",
        "children": [
          "SOPهای گام‌به‌گام",
          "چک‌لیست تحویل و کنترل کیفیت",
          "معیار پذیرش و تعریف خروجی کامل",
          "مالک فرایند و مسئولیت‌ها (RACI)",
          "نسخه‌بندی و بازنگری اسناد"
        ],
        "questionIds": [
          "FL.L2.Q2",
          "FL.L2.Q3",
          "FL.L2.Q4"
        ]
      }
    ]
  },
  {
    "yamlKey": "implementation",
    "findingId": "layer-flow",
    "titleFa": "جاری‌سازی",
    "constructFa": "میزان استقلال تیم در اجرای فرایندها و پایبندی به دستورالعمل‌ها در غیاب مالک",
    "asIsFa": "تله تصمیم‌گیری؛ پرسنل منتظر تأیید مدیر هستند و تفویض معکوس رخ می‌دهد.",
    "toBeFa": "تیم خودمختار؛ تفویض مسئولیت «نتیجه نهایی» (Outcome) به جای تکلیف روزمره.",
    "actionsFa": "تعیین اختیارات تصمیم‌گیری مالی و عملیاتی پرسنل، آموزش مبتنی بر سناریو، ارزیابی آزمون مرخصی کوتاه‌مدت.",
    "keywords": [
      {
        "id": "L3-K1",
        "titleFa": "تعیین اختیارات تصمیم‌گیری مالی و عملیاتی پرسنل",
        "children": [
          "حدود اختیار تصمیم‌گیری",
          "آستانه‌های مالی و عملیاتی",
          "نقش تصمیم‌گیر، مجری و پاسخ‌گو",
          "مالکیت نتیجه (Outcome Ownership)",
          "قواعد ارجاع و مدیریت استثنا"
        ],
        "questionIds": [
          "FL.L3.Q1",
          "FL.L3.Q2",
          "FL.L3.Q3",
          "FL.L3.Q4"
        ]
      },
      {
        "id": "L3-K2",
        "titleFa": "آموزش مبتنی بر سناریو",
        "children": [
          "سناریوهای پرتکرار شغلی",
          "سناریوهای استثنایی و بحرانی",
          "تمرین و شبیه‌سازی تصمیم",
          "آموزش نقش‌محور و ورود کارکنان",
          "سنجش شایستگی و بازخورد"
        ],
        "questionIds": [
          "FL.L3.Q2",
          "FL.L3.Q3",
          "FL.L3.Q4"
        ]
      },
      {
        "id": "L3-K3",
        "titleFa": "ارزیابی آزمون مرخصی کوتاه‌مدت",
        "children": [
          "آزمون غیبت مدیر یا مالک",
          "تداوم خدمت و عملیات",
          "نقاط وابستگی به مدیر",
          "پوشش جانشین و انتقال اختیار",
          "اقدام اصلاحی پس از آزمون"
        ],
        "questionIds": [
          "FL.L3.Q1"
        ]
      }
    ]
  },
  {
    "yamlKey": "maintenance",
    "findingId": "layer-monitor",
    "titleFa": "نگهداشت و پایش",
    "constructFa": "میزان پایش عددی عملکرد، انضباط جلسات، و یادگیری سازمانی از خطاها",
    "asIsFa": "مدیریت بر مبنای بحران و حساب بانکی؛ جلسات نامنظم هنگام آتش‌سوزی کاری.",
    "toBeFa": "داشبورد شاخص‌های کلیدی (KPI)، جلسات هفتگی ثابت حل مسئله، اصلاح مستمر باگ‌ها.",
    "actionsFa": "استقرار داشبورد عددی هفتگی، ریتم جلسات منضبط هفتگی، ایجاد رویه ثبت و بازبینی باگ‌های فرآیندی.",
    "keywords": [
      {
        "id": "L4-K1",
        "titleFa": "استقرار داشبورد عددی هفتگی",
        "children": [
          "شاخص‌های کلیدی عملکرد (KPI)",
          "تعریف هدف و آستانه هشدار",
          "منبع داده و کیفیت داده",
          "روند، مقایسه و انحراف",
          "تناوب گزارش و مالک شاخص"
        ],
        "questionIds": [
          "FL.L4.Q1",
          "FL.L4.Q4"
        ]
      },
      {
        "id": "L4-K2",
        "titleFa": "ریتم جلسات منضبط هفتگی",
        "children": [
          "دستورجلسه و ریتم ثابت",
          "مرور عملکرد و انحراف‌ها",
          "تصمیم‌گیری و حل مسئله",
          "مالک اقدام و موعد پیگیری",
          "ثبت تصمیم و بازبینی تعهدات"
        ],
        "questionIds": [
          "FL.L4.Q2"
        ]
      },
      {
        "id": "L4-K3",
        "titleFa": "ایجاد رویه ثبت و بازبینی باگ‌های فرآیندی",
        "children": [
          "ثبت خطا و عدم انطباق",
          "تحلیل علت ریشه‌ای (RCA)",
          "اقدام اصلاحی و پیشگیرانه (CAPA)",
          "به‌روزرسانی مستندات و SOP",
          "تأیید اثربخشی و پایش تکرار"
        ],
        "questionIds": [
          "FL.L4.Q3",
          "FL.L4.Q4"
        ]
      }
    ]
  },
  {
    "yamlKey": "scaling",
    "findingId": "layer-scale",
    "titleFa": "توسعه و مقیاس‌پذیری",
    "constructFa": "توان مقیاس‌پذیری عملیات، قابلیت تکثیر مدل بدون مالک، و اقتصاد واحد",
    "asIsFa": "سقف رشد مسدود به زمان فیزیکی مالک؛ ناتوانی در پذیرش سفارش‌های بزرگ‌تر.",
    "toBeFa": "قابلیت تکثیر آسان؛ آمادگی برای ایجاد شعب، برون‌سپاری یا نمایندگی.",
    "actionsFa": "استانداردسازی پکیج عملیاتی، شناسایی خدمات مقیاس‌پذیر، ایجاد ظرفیت زیرسیستم‌های جدید.",
    "keywords": [
      {
        "id": "L5-K1",
        "titleFa": "استانداردسازی پکیج عملیاتی",
        "children": [
          "فرآیندهای هسته و استاندارد عملیاتی",
          "کتابچه عملیات و SOPهای قابل تکثیر",
          "آموزش و انتقال دانش به شعب",
          "استاندارد تجربه برند و کیفیت",
          "پایش انطباق و پشتیبانی شعب"
        ],
        "questionIds": [
          "FL.L5.Q2"
        ]
      },
      {
        "id": "L5-K2",
        "titleFa": "شناسایی خدمات مقیاس‌پذیر",
        "children": [
          "تکرارپذیری مدل خدمت",
          "تقاضا و تناسب بخش بازار",
          "اقتصاد واحد و حاشیه مشارکت",
          "هزینه نهایی تحویل خدمت",
          "پتانسیل دیجیتالی‌سازی و خودکارسازی"
        ],
        "questionIds": [
          "FL.L5.Q1",
          "FL.L5.Q2",
          "FL.L5.Q3"
        ]
      },
      {
        "id": "L5-K3",
        "titleFa": "ایجاد ظرفیت زیرسیستم‌های جدید",
        "children": [
          "ظرفیت‌سنجی نیروی انسانی و تجهیزات",
          "طراحی ماژولار زیرسیستم‌ها",
          "زنجیره تأمین و شرکای اجرا",
          "زیرساخت فناوری و داده",
          "ظرفیت کنترل کیفیت و نظارت"
        ],
        "questionIds": [
          "FL.L5.Q1",
          "FL.L5.Q3"
        ]
      }
    ]
  }
];

export const crossPatterns: CrossPattern[] = [
  {
    "id": "written_not_executed",
    "meaningFa": "فرآیندها نوشته شده‌اند اما اجرا نمی‌شوند؛ مسئله از جنس جاری‌سازی و فرهنگ سیستم‌پذیری است، نه مستندسازی بیشتر.",
    "actionFa": "به‌جای سند تازه، روی حدود اختیار، آموزش سناریومحور و آزمون غیبت کار کنید (درخت L3).",
    "when": {
      "strong": "layer-architecture",
      "weak": "layer-flow",
      "alsoWeak": null,
      "weakAny": []
    }
  },
  {
    "id": "owner_trap",
    "meaningFa": "تلهٔ مالک/متخصص: هم نقش مالک از مجری جدا نشده و هم تیم بدون تأیید مدیر حرکت نمی‌کند؛ دو لایه یک ریشه دارند.",
    "actionFa": "از آزادسازی زمان مالک و ممیزی نقش‌ها شروع کنید (L1-K3) و هم‌زمان حدود اختیار تیم را مکتوب کنید (L3-K1).",
    "when": {
      "strong": null,
      "weak": "layer-foundation",
      "alsoWeak": "layer-flow",
      "weakAny": []
    }
  },
  {
    "id": "undocumented_execution",
    "meaningFa": "تیم فعلاً با تجربهٔ افراد کار را پیش می‌برد اما دانش در ذهن‌هاست؛ با رشد یا خروج افراد، کیفیت فرو می‌ریزد.",
    "actionFa": "استخراج دانش ضمنی و تدوین SOP برای ۵ فرایند کلیدی (L2-K2) پیش از هر برنامهٔ رشد.",
    "when": {
      "strong": "layer-flow",
      "weak": "layer-architecture",
      "alsoWeak": null,
      "weakAny": []
    }
  },
  {
    "id": "blind_management",
    "meaningFa": "مدیریت بر مبنای بحران و شهود؛ انحراف‌ها دیر دیده می‌شوند و هر اصلاحی بدون پایش، پایدار نمی‌ماند.",
    "actionFa": "داشبورد هفتگی KPI و ریتم جلسهٔ ثابت (L4-K1 و L4-K2) پیش‌شرط قابل اتکا شدن بقیهٔ اصلاح‌هاست.",
    "when": {
      "strong": null,
      "weak": "layer-monitor",
      "alsoWeak": null,
      "weakAny": []
    }
  },
  {
    "id": "premature_scaling",
    "meaningFa": "میل یا آمادگی رشد از بلوغ لایه‌های پایه جلو زده است؛ مقیاس‌گرفتن روی پایهٔ سست، بحران را بزرگ می‌کند نه کسب‌وکار را.",
    "actionFa": "اول گلوگاه لایهٔ پایه را ببندید؛ بعد سراغ پکیج عملیاتی و تکثیر بروید (L5-K1).",
    "when": {
      "strong": "layer-scale",
      "weak": null,
      "alsoWeak": null,
      "weakAny": [
        "layer-foundation",
        "layer-architecture",
        "layer-flow"
      ]
    }
  }
];

export const casioKeywords: { id: string; labelFa: string }[] = [
  {
    "id": "L1-K1",
    "labelFa": "تدوین هدف استراتژیک ۱ صفحه‌ای"
  },
  {
    "id": "L1-K2",
    "labelFa": "اصلاح برداشت‌های مالی"
  },
  {
    "id": "L1-K3",
    "labelFa": "آزادسازی زمان مالک برای نقش طراحی"
  },
  {
    "id": "L2-K1",
    "labelFa": "نقشه‌برداری زنجیره ارزش مشتری"
  },
  {
    "id": "L2-K2",
    "labelFa": "استخراج ۵ فرآیند کلیدی با مصاحبه از مجریان"
  },
  {
    "id": "L2-K3",
    "labelFa": "تدوین چک‌لیست‌های تحویل کار"
  },
  {
    "id": "L3-K1",
    "labelFa": "تعیین اختیارات تصمیم‌گیری مالی و عملیاتی پرسنل"
  },
  {
    "id": "L3-K2",
    "labelFa": "آموزش مبتنی بر سناریو"
  },
  {
    "id": "L3-K3",
    "labelFa": "ارزیابی آزمون مرخصی کوتاه‌مدت"
  },
  {
    "id": "L4-K1",
    "labelFa": "استقرار داشبورد عددی هفتگی"
  },
  {
    "id": "L4-K2",
    "labelFa": "ریتم جلسات منضبط هفتگی"
  },
  {
    "id": "L4-K3",
    "labelFa": "ایجاد رویه ثبت و بازبینی باگ‌های فرآیندی"
  },
  {
    "id": "L5-K1",
    "labelFa": "استانداردسازی پکیج عملیاتی"
  },
  {
    "id": "L5-K2",
    "labelFa": "شناسایی خدمات مقیاس‌پذیر"
  },
  {
    "id": "L5-K3",
    "labelFa": "ایجاد ظرفیت زیرسیستم‌های جدید"
  }
];

export const casioKeywordEdges: { from: string; to: string; weight: number; transform: "identity" }[] = [
  {
    "from": "L1-K1",
    "to": "layer-foundation",
    "weight": 1,
    "transform": "identity"
  },
  {
    "from": "FL.L1.Q3",
    "to": "L1-K1",
    "weight": 1,
    "transform": "identity"
  },
  {
    "from": "L1-K2",
    "to": "layer-foundation",
    "weight": 1,
    "transform": "identity"
  },
  {
    "from": "FL.L1.Q4",
    "to": "L1-K2",
    "weight": 1,
    "transform": "identity"
  },
  {
    "from": "L1-K3",
    "to": "layer-foundation",
    "weight": 1,
    "transform": "identity"
  },
  {
    "from": "FL.L1.Q1",
    "to": "L1-K3",
    "weight": 1,
    "transform": "identity"
  },
  {
    "from": "FL.L1.Q2",
    "to": "L1-K3",
    "weight": 1,
    "transform": "identity"
  },
  {
    "from": "L2-K1",
    "to": "layer-architecture",
    "weight": 1,
    "transform": "identity"
  },
  {
    "from": "FL.L2.Q1",
    "to": "L2-K1",
    "weight": 1,
    "transform": "identity"
  },
  {
    "from": "L2-K2",
    "to": "layer-architecture",
    "weight": 1,
    "transform": "identity"
  },
  {
    "from": "FL.L2.Q1",
    "to": "L2-K2",
    "weight": 1,
    "transform": "identity"
  },
  {
    "from": "FL.L2.Q2",
    "to": "L2-K2",
    "weight": 1,
    "transform": "identity"
  },
  {
    "from": "FL.L2.Q3",
    "to": "L2-K2",
    "weight": 1,
    "transform": "identity"
  },
  {
    "from": "L2-K3",
    "to": "layer-architecture",
    "weight": 1,
    "transform": "identity"
  },
  {
    "from": "FL.L2.Q2",
    "to": "L2-K3",
    "weight": 1,
    "transform": "identity"
  },
  {
    "from": "FL.L2.Q3",
    "to": "L2-K3",
    "weight": 1,
    "transform": "identity"
  },
  {
    "from": "FL.L2.Q4",
    "to": "L2-K3",
    "weight": 1,
    "transform": "identity"
  },
  {
    "from": "L3-K1",
    "to": "layer-flow",
    "weight": 1,
    "transform": "identity"
  },
  {
    "from": "FL.L3.Q1",
    "to": "L3-K1",
    "weight": 1,
    "transform": "identity"
  },
  {
    "from": "FL.L3.Q2",
    "to": "L3-K1",
    "weight": 1,
    "transform": "identity"
  },
  {
    "from": "FL.L3.Q3",
    "to": "L3-K1",
    "weight": 1,
    "transform": "identity"
  },
  {
    "from": "FL.L3.Q4",
    "to": "L3-K1",
    "weight": 1,
    "transform": "identity"
  },
  {
    "from": "L3-K2",
    "to": "layer-flow",
    "weight": 1,
    "transform": "identity"
  },
  {
    "from": "FL.L3.Q2",
    "to": "L3-K2",
    "weight": 1,
    "transform": "identity"
  },
  {
    "from": "FL.L3.Q3",
    "to": "L3-K2",
    "weight": 1,
    "transform": "identity"
  },
  {
    "from": "FL.L3.Q4",
    "to": "L3-K2",
    "weight": 1,
    "transform": "identity"
  },
  {
    "from": "L3-K3",
    "to": "layer-flow",
    "weight": 1,
    "transform": "identity"
  },
  {
    "from": "FL.L3.Q1",
    "to": "L3-K3",
    "weight": 1,
    "transform": "identity"
  },
  {
    "from": "L4-K1",
    "to": "layer-monitor",
    "weight": 1,
    "transform": "identity"
  },
  {
    "from": "FL.L4.Q1",
    "to": "L4-K1",
    "weight": 1,
    "transform": "identity"
  },
  {
    "from": "FL.L4.Q4",
    "to": "L4-K1",
    "weight": 1,
    "transform": "identity"
  },
  {
    "from": "L4-K2",
    "to": "layer-monitor",
    "weight": 1,
    "transform": "identity"
  },
  {
    "from": "FL.L4.Q2",
    "to": "L4-K2",
    "weight": 1,
    "transform": "identity"
  },
  {
    "from": "L4-K3",
    "to": "layer-monitor",
    "weight": 1,
    "transform": "identity"
  },
  {
    "from": "FL.L4.Q3",
    "to": "L4-K3",
    "weight": 1,
    "transform": "identity"
  },
  {
    "from": "FL.L4.Q4",
    "to": "L4-K3",
    "weight": 1,
    "transform": "identity"
  },
  {
    "from": "L5-K1",
    "to": "layer-scale",
    "weight": 1,
    "transform": "identity"
  },
  {
    "from": "FL.L5.Q2",
    "to": "L5-K1",
    "weight": 1,
    "transform": "identity"
  },
  {
    "from": "L5-K2",
    "to": "layer-scale",
    "weight": 1,
    "transform": "identity"
  },
  {
    "from": "FL.L5.Q1",
    "to": "L5-K2",
    "weight": 1,
    "transform": "identity"
  },
  {
    "from": "FL.L5.Q2",
    "to": "L5-K2",
    "weight": 1,
    "transform": "identity"
  },
  {
    "from": "FL.L5.Q3",
    "to": "L5-K2",
    "weight": 1,
    "transform": "identity"
  },
  {
    "from": "L5-K3",
    "to": "layer-scale",
    "weight": 1,
    "transform": "identity"
  },
  {
    "from": "FL.L5.Q1",
    "to": "L5-K3",
    "weight": 1,
    "transform": "identity"
  },
  {
    "from": "FL.L5.Q3",
    "to": "L5-K3",
    "weight": 1,
    "transform": "identity"
  }
];

