# نقشه معماری اطلاعات و SEO — هادیران‌وب۳

وضعیت: **فاز A و B و برش ۱–۲ فاز C پیاده شده.** باقی‌ماندهٔ فاز C: OG تصویر اختصاصی (عمداً عقب افتاده).  
تاریخ: ۲۰۲۶-۰۹-۱۹  
منبع نسخهٔ محصول: ادغام نسخه ۱ (بازیابی + لندینگ) و نسخه ۲ (چت تمام‌صفحه + گراف موضوع)

---

## ۱. تصمیم‌های قفل‌شده

| تصمیم | مقدار | دلیل |
|---|---|---|
| صفحهٔ `/` | چت نسخه ۲ (رابط مکالمه‌ای) | محصول اصلی: شفاف‌سازی مسئله و هم‌فکری |
| لندینگ نسخه ۱ | **`/ecosystem`** | هب محصول؛ با `/hadiran` تداخل معنایی ندارد |
| هویت شخص | `/hadiran` می‌ماند | این صفحهٔ واقعی «دربارهٔ شخص» است؛ `/about` ساخته نمی‌شود |
| جزئیات موجودیت‌ها | از نسخه ۱ | صفحات `[slug]` برای ایندکس Google ضروری‌اند |
| چت‌بات | بازیابی متن نسخه ۱ + hop موضوع نسخه ۲ + جدول `messages` | کیفیت پاسخ + گراف دانش + قابلیت تاریخچه |
| هب موضوع | `/topics` + `/topics/[slug]` | پل بین سیلوها؛ نیت فرود موضوع ایندکس‌پذیر است |
| فیلتر `?topic=` | فقط UI همان لیست؛ کاننیکال مجموعه | چیپ و چت به هب می‌روند، نه به query |
| تماس | `/contact` = روش‌ها از `person.contactMethods` | بدون فرم پیام؛ همکاری همان `/lab/[slug]/collaborate` است |
| درایو ۱۵گیگ / LiveKit | **خارج از توپولوژی هادیران** | ساخته نمی‌شوند؛ با فاز C قاطی نمی‌شوند |

`/about` عمداً ساخته نمی‌شود. در SEO، `/about` یعنی سازمان/شخص. آن نقش را `/hadiran` دارد. لندینگ نسخه ۱ «اکوسیستم چیست و چهار جهان چگونه به هم وصل‌اند» است، نه بیوگرافی.

---

## ۲. اصول SEO که ساختار دایرکتوری از آن‌ها پیروی می‌کند

1. **یک URL = یک موجودیت = یک نیت جستجو.** صفحهٔ چت، صفحهٔ هب، صفحهٔ شخص، و صفحهٔ مقاله با هم رقابت نکنند (جلوگیری از cannibalization).
2. **سلسله‌مراتب پوشه = سلسله‌مراتب معنا.** مجموعه در ریشهٔ بخش، عضو در `[slug]`، زیرسند زیر همان عضو.
3. **عمق حداکثر سه سطح.** `/lab/[slug]/whitepaper` قابل قبول است. عمیق‌تر از این ایندکس و breadcrumb را خراب می‌کند.
4. **slug پایدار و لاتین.** UI فارسی است؛ URL انگلیسی/ترانسلیتریشن است (`what-is-web3` نه `وب۳-چیست`). ثبات لینک، کپی‌پذیری، و سازگاری ابزارها مهم‌تر از کلیدواژهٔ فارسی داخل مسیر است.
5. **محتوای اصلی با path، نه query.** فیلتر موضوع `?topic=` فقط فیلتر UI است؛ صفحهٔ مجموعهٔ موضوع اگر ارزش ایندکس دارد باید `/topics/[slug]` شود، نه تکیه به query.
6. **صفحهٔ کلاینت‌محور بدون پوستهٔ سرور ایندکس نمی‌شود.** `/` چت است، اما باید Server Component با H1، توضیح، و لینک‌های داخلی داشته باشد؛ ویجت چت Client است.
7. **سیلو (silo) با لینک داخلی.** هر جهان فقط از هب و از موجودیت‌های هم‌موضوع به جهان‌های دیگر پل می‌زند. فوتر و ناوبری همهٔ سیلوها را نشان می‌دهند؛ بدنهٔ مقاله نباید بی‌دلیل به همه جا لینک شود.
8. **Canonical یکتا، بدون duplicate.** لیست و جزئیات هر دو ایندکس می‌شوند؛ صفحهٔ فیلترشده با query `noindex` یا canonical به مجموعه می‌رود مگر اینکه صفحهٔ موضوع جدا ساخته شود.

---

## ۳. درخت URL نهایی (canonical)

```
/                              رابط مکالمه (محصول)
/ecosystem                     هب اکوسیستم — لندینگ سابق نسخه ۱

/hadiran                       هویت شخص (جهان ۱)

/signin                        ورود OTP (noindex)
/knowledge                     دانشنامه — فهرست
/knowledge/new                 نوشتن مطلب (noindex — نیازمند نشست)
/knowledge/[slug]              یک واحد دانش (مقاله، یادداشت، پژوهش، ایده)
/knowledge/[slug]/edit         ویرایش مطلب (noindex — نیازمند نشست)

/lab                           آزمایشگاه — فهرست پروژه‌ها
/lab/[slug]                    یک پروژه
/lab/[slug]/whitepaper         سند چرا / چیست
/lab/[slug]/blueprint          سند معماری
/lab/[slug]/roadmap            سند مسیر
/lab/[slug]/gantt              سند زمان
/lab/[slug]/collaborate        درخواست همکاری (indexable ضعیف؛ noindex توصیه می‌شود)

/courses                       آکادمی — فهرست دوره‌ها
/courses/[slug]                یک دوره

/topics                        فهرست موضوعات (پل گراف — فاز C)
/topics/[slug]                 هب موضوع: دانش + پروژه + دورهٔ مرتبط (کاننیکال موضوع)

/contact                       تماس — روش‌ها، بدون فرم (فاز C)
```

مسیرهایی که **عمداً وجود ندارند:**

| مسیر | چرا نه |
|---|---|
| `/about` | تداخل با `/hadiran` |
| `/chat` یا `/app` | چت خودِ محصول است و روی `/` می‌ماند |
| `/home` | تکراری با `/` |
| `/knowledge/topic/[id]` | id در URL ممنوع؛ اگر موضوع ایندکس شود `/topics/[slug]` |
| `/api/*` | ایندکس نشوند (`robots.txt` + noindex روی JSON) |

---

## ۴. نقشهٔ پوشهٔ Next.js App Router

هر segment پوشه = یک URL. Route Group برای SEO دیده نمی‌شود و فقط برای سازمان کد است.

```
src/app/
  layout.tsx                          پوستهٔ سراسری: html lang=fa dir=rtl، Nav، Footer، فونت وزیرمتن
  globals.css
  robots.ts                           Allow /  Disallow /api  Disallow /*/collaborate
  sitemap.ts                          همهٔ صفحات موجودیت + مجموعه‌ها + /ecosystem + /hadiran
  page.tsx                            /  — Server Component: metadata + پوستهٔ ایندکس‌پذیر + <AIChat />
  ecosystem/
    page.tsx                          /ecosystem — لندینگ نسخه ۱ (آمار، معرفی، CTA)
  hadiran/
    page.tsx                          /hadiran
  signin/
    page.tsx                          /signin  (noindex — ورود OTP)
  knowledge/
    page.tsx                          /knowledge
    new/
      page.tsx                        /knowledge/new  (noindex — نوشتن، نیازمند نشست)
    [slug]/
      page.tsx                        /knowledge/[slug]
      edit/
        page.tsx                      /knowledge/[slug]/edit  (noindex)
  lab/
    page.tsx                          /lab
    [slug]/
      page.tsx                        /lab/[slug]
      [docType]/
        page.tsx                      /lab/[slug]/whitepaper|blueprint|roadmap|gantt
      collaborate/
        page.tsx                      /lab/[slug]/collaborate
  courses/
    page.tsx                          /courses
    [slug]/
      page.tsx                        /courses/[slug]
  topics/                             فاز C
    page.tsx                          /topics
    [slug]/
      page.tsx                        /topics/[slug]
  contact/
    page.tsx                          /contact  (روش‌های تماس؛ بدون فرم)
  api/
    chat/route.ts                     endpoint واحد چت (جایگزین /api/ai)
    collaborate/route.ts
    health/route.ts
```

Route Group پیشنهادی برای خوانایی کد، بدون تغییر URL:

```
src/app/(site)/...     صفحات ایندکس‌پذیر
src/app/(chat)/page.tsx   اگر بخواهیم layout جدا برای چت — اختیاری
src/app/api/...
```

تا وقتی layout چت با بقیه یکی است، Route Group لازم نیست. اضافه کردن `(site)` فقط وقتی توجیه دارد که هدر چت با هدر صفحات محتوا فرق کند.

---

## ۵. نقش SEO هر URL

| URL | نیت جستجو | موجودیت Schema.org | ایندکس | محتوای ایندکس‌پذیر اجباری |
|---|---|---|---|---|
| `/` | هم‌فکری / شفاف‌سازی مسئله | `WebSite` + `SearchAction` | بله | H1، پاراگراف معرفی، لینک به چهار جهان، نه فقط input خالی |
| `/ecosystem` | اکوسیستم شخصی هادیران چیست | `CollectionPage` یا `WebPage` با `hasPart` به چهار جهان | بله | آمار، توضیح مدل چهارجهانی، CTA |
| `/hadiran` | هادیران کیست | `Person` | بله | نام، bio، مهارت، سازمان |
| `/signin` | ورود با OTP موبایل | — | **noindex, nofollow** | فرم شماره و کد؛ ایندکس نشود |
| `/knowledge` | دانشنامه هادیران | `CollectionPage` | بله | مقدمه + لیست با عنوان و خلاصه |
| `/knowledge/[slug]` | موضوع خاص (مثلاً MCP چیست) | `Article` / `TechArticle` | بله | عنوان، خلاصه، بدنه Markdown، اسلایدها اگر باشند |
| `/knowledge/new` | نوشتن مطلب | — | **noindex** | فرم ایجاد؛ نیازمند نشست `hadiran_session` |
| `/knowledge/[slug]/edit` | ویرایش مطلب | — | **noindex** | فرم ویرایش؛ نیازمند نشست |
| `/lab` | پروژه‌ها و آزمایش‌ها | `CollectionPage` | بله | مقدمه + کارت پروژه |
| `/lab/[slug]` | یک پروژه | `SoftwareSourceCode` یا `CreativeWork` | بله | مسئله، چشم‌انداز، مفهوم، وضعیت |
| `/lab/[slug]/whitepaper` | وایت‌پیپر پروژه | `ScholarlyArticle` یا `Article` | بله | بدنهٔ کامل سند |
| `/courses` | دوره‌های هادیران | `CollectionPage` | بله | مقدمه + کارت دوره |
| `/courses/[slug]` | یک دوره | `Course` | بله | عنوان، توضیح، سطح، درس‌ها |
| `/topics` | موضوعات اکوسیستم هادیران | `CollectionPage` | بله | مقدمه + کارت موضوع با تعداد دانش/پروژه/دوره |
| `/topics/[slug]` | موضوع X در اکوسیستم | `DefinedTerm` + هب موضوع | بله | تعریف یک‌پاراگرافی + دانش + پروژه + دورهٔ متصل |
| `/lab/[slug]/collaborate` | فرم همکاری | — | **noindex, follow** | فرم؛ ارزش جستجو ندارد |
| `/contact` | تماس با هادیران | `ContactPage` | بله | روش‌های تماس از `contactMethods`؛ فرم پیام ندارد |

---

## ۶. صفحهٔ `/` — چت محصول، بدون خودکشی SEO

نسخه ۲ کل `page.tsx` را `"use client"` کرده. این برای Google تقریباً یک صفحهٔ خالی است.

الگوی اجباری:

```
src/app/page.tsx                 Server Component
  export const metadata = { title, description, openGraph, alternates.canonical }
  <h1> مسئله‌ات را بگو؛ با هم شفافش می‌کنیم </h1>
  <p> فضایی برای بازنمایی دقیق ایده‌ها و ساختاردهی به دغدغه‌ها. </p>
  <nav aria-label="بخش‌های اکوسیستم هادیران"> لینک /hadiran (درباره من) /knowledge /lab /courses /ecosystem </nav>
  <HomeChat />
```

قواعد:

- `metadata` فقط در Server Component تعریف می‌شود.
- H1 و یک پاراگراف واقعی در HTML اولیه باشد (نه فقط بعد از hydrate).
- JSON-LD `WebSite` با `potentialAction` از نوع `SearchAction` که `target` آن `/api/chat` نیست؛ برای موتور جستجو `target: {site}/knowledge?q={search_term_string}` — چت برای ربات قابل اجرا نیست.
- عنوان تب: `هادیران | فضای هم‌فکری، شفاف‌سازی مسئله و طراحی سیستم‌ها`
- توضیحات متا باید خودِ محصول را بگوید، نه لیست آمار. آمار مال `/ecosystem` است.

---

## ۷. صفحهٔ `/ecosystem` — لندینگ نسخه ۱

محتوای منتقل‌شده از `src/app/page.tsx` نسخه ۱:

- بج «رابط اصلی اکوسیستم» → بازنویسی شود به «نقشهٔ اکوسیستم» تا با `/` رقابت نکند
- H1 معرفی اکوسیستم (نه «مسئله‌ات را بگو» — آن H1 مال `/` است)
- چهار کارت آمار: دانش، پروژه، دوره، موضوع
- CTA: درباره من، ورود به آزمایشگاه، و **شروع هم‌فکری** → `/`
- ویجت چت روی این صفحه **نمی‌آید**؛ در غیر این صورت duplicate با `/`

Metadata پیشنهادی:

- title: `اکوسیستم هادیران‌وب۳ | دانش، آموزش، آزمایشگاه، هویت`
- description: توضیح مدل چهارجهانی و اتصال آن‌ها از طریق موضوع

Internal links اجباری از این صفحه: `/`, `/hadiran`, `/knowledge`, `/lab`, `/courses`

---

## ۸. سیلو و لینک داخلی

```
                    /ecosystem  (هب محصول)
                    /  (چت — دروازهٔ مکالمه)
                           |
          -----------------+-----------------
          |         |            |          |
     /hadiran  /knowledge      /lab     /courses
          |         |            |          |
          |    /knowledge/x   /lab/y    /courses/z
          |                      |
          |              /lab/y/whitepaper
          |
     موضوعات مشترک = پل بین سیلوها  →  /topics/[slug]  (جهان پنجم نیست)
```

قواعد لینک:

- از مقاله فقط به موضوع، پروژهٔ مرتبط، و دورهٔ مرتبط لینک بده (از join table)، نه به همهٔ دانشنامه.
- چیپ موضوع روی دانش / آزمایشگاه / دوره / شخص / حباب چت → **`/topics/[slug]`** نه `/knowledge?topic=`.
- از پروژه به اسناد همان پروژه و به نقش‌های همکاری.
- ناوبری سراسری (جهان‌ها): `/` ، `/ecosystem` ، `/hadiran` ، `/knowledge` ، `/lab` ، `/courses` — موضوع و تماس در **فوتر** می‌آیند، نه در نوار اصلی.
- Breadcrumb هر صفحهٔ `[slug]` باید مجموعهٔ والد را نشان دهد.

نمونه breadcrumb:

```
خانه / دانشنامه / پروتکل MCP
خانه / آزمایشگاه / کیت ابزار MCP / وایت‌پیپر
خانه / اکوسیستم
```

---

## ۹. Metadata، فایل‌های فنی، دادهٔ ساخت‌یافته

هر `page.tsx` ایندکس‌پذیر باید `generateMetadata` داشته باشد (پویا برای `[slug]`).

حداقل فیلدها:

- `title` یکتا، الگوی `عنوان صفحه | هادیران‌وب۳`
- `description` از `summaryFa` / `descriptionFa`
- `alternates.canonical` روی همین path
- `openGraph.url` + `og:type` مناسب (`website` / `article`)
- `robots` فقط روی collaborate: `{ index: false, follow: true }`

فایل‌های ریشه:

| فایل | نقش |
|---|---|
| `src/app/sitemap.ts` | تولید از DB: knowledge, projects, courses, documents, topics + URLهای ثابت (`/contact`، `/topics`) |
| `src/app/robots.ts` | `Allow: /` — `Disallow: /api/` — `Disallow: /*/collaborate` — `Disallow: /signin` — `Disallow: /knowledge/new` — `Disallow: /*/edit` — اشاره به sitemap |
| JSON-LD در layout | `Organization` / `Person` برای هادیران (یک‌بار) |
| JSON-LD در صفحهٔ موجودیت | مطابق جدول بخش ۵ |

`lang="fa"` و `dir="rtl"` در `<html>` می‌ماند. اگر نسخهٔ انگلیسی URL جدا شد، آن وقت `hreflang`؛ تا آن روز hreflang نگذارید (اشاره به زبانی که صفحه ندارد، خطا است).

---

## ۱۰. چت و تأثیرش روی ساختار دایرکتوری

چت URL جدا نمی‌گیرد. منطق پشت `/api/chat` می‌ماند تا مسیرهای محتوا تمیز بمانند.

ادغام منطق (برای فاز پیاده‌سازی کد، نه تغییر URL):

```
سؤال
  → نرمال‌سازی توکن نسخه ۱ (ارقام فارسی، حذف علائم)
  → مسیر الف: ILIKE وزن‌دار روی title/summary/body دانش، پروژه، دوره
  → مسیر ب: ILIKE روی topics سپس hop از knowledge_topics / project_topics / course_topics
  → اتحاد نتایج + امتیاز relevance
  → پاسخ قالبی از topها
  → ذخیره در conversations + messages (schema نسخه ۲)
```

خروجی API برای UI نسخه ۲ سازگار می‌شود:

```json
{
  "answer": "...",
  "references": {
    "knowledge": [{ "slug", "title", "summary" }],
    "projects":  [{ "slug", "name",  "summary" }],
    "courses":   [{ "slug", "title", "summary" }],
    "topics":    [{ "slug", "name" }]
  }
}
```

لینک‌های داخل حباب پاسخ باید دقیقاً به درخت بخش ۳ بروند (`/knowledge/[slug]` و غیره). اگر صفحهٔ جزئیات نباشد، چت به ۴۰۴ می‌رسد و سیگنال SEO خراب می‌شود — برای همین صفحات `[slug]` نسخه ۱ قبل از ادغام چت باید موجود باشند.

جدول `messages` محتوای ایندکس‌پذیر عمومی نیست. مکالمهٔ کاربر در sitemap نمی‌آید.

---

## ۱۱. فیلتر موضوع و duplicate content

نسخه ۲: `/knowledge?topic=uuid`  
نسخه ۱: `/knowledge?topic=slug`

تصمیم قفل‌شده (فاز C — **هب کاننیکال**):

- `/topics/[slug]` فرود ایندکس‌پذیر موضوع است (دانش + پروژه + دوره روی یک صفحه).
- چیپ موضوع و لینک چت به هب می‌روند، نه به query.
- `?topic=` فقط فیلتر UI همان مجموعه است (`/knowledge?topic=ai` دانش را تنگ می‌کند). کاننیکال آن URL همیشه `/knowledge` (یا `/lab` / `/courses`) می‌ماند.
- **ریدایرکت ۳۰۱ از `?topic=` به هب ممنوع است** — نیت فیلتر لیست با نیت هب گراف یکی نیست.
- این URLهای query از صفحات دیگر تبلیغ نمی‌شوند.

هرگز UUID در URL عمومی نگذارید.

---

## ۱۲. ریدایرکت و سازگاری

الان سایت عمومی نشده؛ ریدایرکت لازم نیست. اگر بعداً کسی `/about` را حدس زد:

| از | به | نوع |
|---|---|---|
| `/about` | `/hadiran` | ۳۰۱ (شخص) |
| `/about-ecosystem` یا `/home` | `/ecosystem` | ۳۰۱ |
| `/api/ai` | `/api/chat` | ۳۰۸ داخلی یا بازنویسی |

تا وقتی `/about` لینک خارجی ندارد، اصلاً نسازید تا ایندکس نشود.

---

## ۱۳. کپی و H1 — جلوگیری از cannibalization

| صفحه | H1 باید دربارهٔ چیست | H1 نباید باشد |
|---|---|---|
| `/` | شفاف‌سازی مسئله / هم‌فکری | معرفی اکوسیستم با آمار |
| `/ecosystem` | اکوسیستم چهارجهانی چیست | «مسئله‌ات را بگو؛ با هم شفافش می‌کنیم» |
| `/hadiran` | درباره من / هادی کیست | معرفی پلتفرم |
| `/knowledge` | دانشنامه | تکرار H1 خانه |
| `/topics` | موضوعات اکوسیستم / پل گراف | دانشنامه یا لیست مقاله |
| `/topics/[slug]` | این موضوع در چهار جهان چیست | عنوان یک مقالهٔ هم‌نام |
| `/contact` | چگونه با هادیران تماس بگیریم | بیوگرافی `/hadiran` یا فرم همکاری پروژه |

یک جملهٔ برند در همه جا مجاز است؛ یک H1 یکسان خیر.

---

## ۱۴. فازبندی اجرا (بعد از تأیید این مستند)

**فاز A — ساختار دایرکتوری (بدون منطق جدید چت)**

1. `src/app/page.tsx` شود پوستهٔ سرور + چت نسخه ۲.
2. لندینگ نسخه ۱ منتقل شود به `src/app/ecosystem/page.tsx` با H1 و metadata جدید.
3. Nav: لینک «اکوسیستم» به `/ecosystem`؛ لوگو به `/`.
4. صفحات `[slug]` نسخه ۱ حفظ شوند.
5. `robots.ts` و `sitemap.ts` و `generateMetadata` روی صفحات ثابت.

**فاز B — چت ادغامی**

1. `/api/chat` با بازیابی نسخه ۱ + hop موضوع نسخه ۲.
2. UI نسخه ۲ روی `/` به این API وصل شود.
3. ذخیره `conversations` / `messages`.

**فاز C — تقویت SEO هادیران (قفل ۱۹ سپتامبر ۲۰۲۶)**

خارج از این فاز (عمداً): درایو ۱۵گیگ، LiveKit، زرین‌پال، `/fa`/`/en`، OG تصویر اختصاصی، فرم پیام روی `/contact`.

ترتیب اجرا بعد از تأیید این الحاقیه:

1. `/topics` + `/topics/[slug]` + بازنویسی لینک چیپ/چت به هب
2. `/contact` روش‌ها + لینک فوتر؛ بلوک کوتاه تماس روی `/hadiran` می‌ماند
3. JSON-LD فقط روی صفحه‌هایی که در همین فاز ساخته یا لمس می‌شوند (`DefinedTerm`، `ContactPage`؛ `Person` روی `/hadiran` اگر در همان برش تماس لمس شد)
4. sitemap شامل `/topics`، `/topics/[slug]`، `/contact`

جزئیات قرارداد: بخش ۱۷.

این فایل قرارداد URL فاز A را قفل کرد. فاز B پیاده شد. برش ۱ (`/topics`) و برش ۲ (`/contact`) فاز C پیاده شده‌اند.

---

## ۱۵. چک‌لیست پذیرش ساختار

- [x] `/` چت است و در view-source حداقل یک H1 و یک پاراگراف دارد
- [x] `/ecosystem` لندینگ نسخه ۱ است و ویجت چت ندارد
- [x] `/hadiran` شخص است؛ `/about` وجود ندارد
- [x] `/knowledge/[slug]`، `/lab/[slug]`، `/courses/[slug]` پاسخ ۲۰۰ می‌دهند
- [x] هیچ UUID در path عمومی نیست
- [x] `collaborate` در robots disallow است
- [x] sitemap شامل `/`، `/ecosystem`، مجموعه‌ها و همهٔ slugها است
- [x] عنوان و H1 خانه با اکوسیستم یکی نیست

## ۱۶. چک‌لیست فاز B — چت ادغامی

- [x] `/api/chat` endpoint واحد با `{ message, conversationId? }`
- [x] مسیر الف: ILIKE وزن‌دار روی متن دانش / پروژه / دوره
- [x] مسیر ب: تطبیق موضوع + hop از join tableها
- [x] اتحاد نتایج و امتیاز؛ پاسخ قالبی از topها
- [x] خروجی `references` سازگار با UI نسخه ۲
- [x] ذخیره `conversations` + `messages` (ستون citations)
- [x] خانه به `/api/chat` وصل است و `conversationId` را در session نگه می‌دارد
- [x] `/api/ai` بازیابی‌محور مانده (بدون persist)

---

## ۱۷. قرارداد فاز C — `/topics` و `/contact`

قفل از هماهنگی ۱۹ سپتامبر ۲۰۲۶. **اول این سند، بعد کد.**

### ۱۷.۱ چه چیزی می‌سازیم / چه چیزی نمی‌سازیم

| می‌سازیم | نمی‌سازیم |
|---|---|
| `/topics` فهرست ایندکس‌پذیر | موضوع به‌عنوان جهان پنجم در ناوبری اصلی |
| `/topics/[slug]` هب گراف | `/topics/[slug]/edit` یا CRUD موضوع |
| `/contact` روش‌های تماس | فرم پیام، تیکت، ایمیل‌خروجی |
| JSON-LD روی همین صفحه‌ها | OpenGraph تصویر اختصاصی (برش بعدی) |
| لینک فوتر: موضوعات، تماس | درایو ۱۵گیگ، LiveKit، زرین‌پال |

`/about` همچنان ساخته نمی‌شود. `/hadiran` شخص است؛ `/contact` تماس است.

### ۱۷.۲ `/topics/[slug]` — هب کاننیکال

نیت جستجو: «این موضوع در اکوسیستم هادیران کجا ظاهر می‌شود؟»

محتوای اجباری HTML اولیه:

- H1 = `labelFa` موضوع (یکتا؛ تکرار عنوان مقالهٔ هم‌نام ممنوع)
- یک پاراگراف تعریف (`descriptionFa`). اگر در seed خالی است، قبل از ایندکس پر شود — هب بدون تعریف، صفحهٔ تهی است.
- سه بلوک اتصال از join tableها: دانش → `/knowledge/[slug]`، پروژه → `/lab/[slug]`، دوره → `/courses/[slug]`
- اگر بلوکی خالی است، آن بخش را نشان نده؛ صفحه با تعریف به‌تنهایی معتبر است

Schema.org: `DefinedTerm` (نام، توضیح، `inDefinedTermSet` به `/topics`).

Canonical: `/topics/[slug]`.

چیپ موضوع در این صفحات به هب می‌رود (نه به `?topic=`):

- `/knowledge/[slug]`، `/lab/[slug]`، `/courses/[slug]`، `/hadiran`
- حباب ارجاع چت (`HomeChat` → `/topics/[slug]`)

`?topic=` بعد از این فاز:

- فقط فیلتر همان لیست (`/knowledge?topic=ai` دانش را تنگ می‌کند)
- کاننیکال فیلتر = `/knowledge` (یا `/lab` / `/courses`)
- از بیرون لینک داده نمی‌شود
- ۳۰۱ به هب **نمی‌شود** — نیت فرق دارد

`/topics` فهرست: کارت موضوع با `labelFa`، رنگ، تعداد موجودیت متصل، لینک به هب. کاننیکال `/topics`.

### ۱۷.۳ `/contact` در برابر `/hadiran` و همکاری

| URL | نیت | محتوا |
|---|---|---|
| `/contact` | چگونه تماس بگیرم | روش‌ها از `person.contactMethods` (ایمیل، X، گیت‌هاب، …) |
| `/hadiran` | هادیران کیست | بیو؛ بلوک کوتاه تماس **می‌ماند** + لینک «صفحهٔ تماس» |
| `/lab/[slug]/collaborate` | درخواست همکاری روی یک پروژه | فرم noindex؛ به `/contact` منتقل نمی‌شود |

بدون فرم پیام روی `/contact`. بدون API جدید. بدون OTP روی این صفحات (خواندن عمومی).

H1 تماس دربارهٔ راه‌های ارتباط است، نه تکرار bio.

Schema.org: `ContactPage` با `mainEntity` از نوع `Person` که به `/hadiran` اشاره می‌کند.

### ۱۷.۴ ناوبری و SEO فنی

- نوار اصلی عوض نمی‌شود (پنج جهان + ورود). موضوع پل است نه جهان.
- فوتر: لینک `/topics` و `/contact` اضافه می‌شود.
- `sitemap.ts`: `/contact`، `/topics`، هر `/topics/[slug]`.
- `robots.ts`: این مسیرها Allow می‌مانند (الان disallow نیستند).
- JSON-LD همراه همان صفحه؛ در layout سراسری تکراری نگذار مگر `Person` یک‌بار روی `/hadiran`.

### ۱۷.۵ موثر / متاثر این برش

**موثر (فاز C روی چه چیزی اثر می‌گذارد):**

- چیپ موضوع در دانش، آزمایشگاه، دوره، شخص
- لینک موضوع در پاسخ چت
- فوتر
- sitemap
- `/hadiran` فقط یک لینک اضافه به `/contact` (بلوک تماس حذف نمی‌شود)

**متاثر (چه چیزی شکل فاز C را می‌دهد):**

- جدول `topics` + joinهای `knowledge_topics` / `project_topics` / `course_topics` / `person_topics`
- `person.contactMethods` (منبع تنها برای `/contact`)
- اصل یک URL = یک نیت (هب ≠ فیلتر لیست ≠ شخص ≠ همکاری)

خواندن دانش/آزمایشگاه/دوره/خانه بدون ورود می‌ماند. نوشتن دانش همان OTP فاز قبلی است.

### ۱۷.۶ چک‌لیست پذیرش (بعد از کد)

- [x] `/topics` و `/topics/[slug]` پاسخ ۲۰۰ با H1 و تعریف در HTML اولیه
- [x] هیچ چیپ یا حباب چت به `/knowledge?topic=` لینک نمی‌دهد
- [x] `/knowledge?topic=` اگر باز شود فیلتر می‌کند و canonical آن `/knowledge` است
- [x] `/contact` روش‌ها را نشان می‌دهد و فرم ندارد
- [x] `/hadiran` بلوک تماس را حفظ کرده و به `/contact` لینک دارد
- [x] ناوبری اصلی موضوع/تماس ندارد؛ فوتر هر دو را دارد
- [x] sitemap شامل موضوعات و تماس است
- [x] `/about` وجود ندارد؛ درایو و LiveKit اضافه نشده‌اند
