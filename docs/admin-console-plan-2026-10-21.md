# مرکز کنترل متن، نام و تیره — پلن اجرایی (نسخهٔ ۲، بازطراحی‌شده)

تاریخ: ۲۰۲۶-۱۰-۲۱ · وضعیت: **پلن، بدون کد** · مبنای کد: `844d96f`
منابع این نسخه: ممیزی کد میز + گزارش «منوی هاوری/مگامنو» (`uploads/hadiran-hover-menu-research.txt`)

هدف: هر متن، نام، عنوان و حالت ظاهری که امروز فقط با deploy عوض می‌شود، از یک ماژول واحد در `/workspace` کنترل شود؛ روی DB بنشیند، روی دیسک پیش‌فرض داشته باشد، ویرایشگر کامل داشته باشد، و با ویرایشگرهای موجود (نوشته/پروژه/دوره/کالا/پک) تداخل نکند.

مرز ثابت: `/admin` و `/dashboard` ساخته نمی‌شود. همه‌چیز داخل `/workspace` می‌ماند.

---

## ۰) چه چیزی در نسخهٔ ۲ عوض شد و چرا

| تغییر | دلیل |
| --- | --- |
| ناوبری سایت به‌عنوان **مسیر جدا (Track B)** به پلن اضافه شد، نه به فازهای متن | گزارش هاور درست است ولی موضوعش ناوبری است، نه ذخیره‌سازی متن؛ قاطی‌کردنشان پلن را ناپایدار می‌کند |
| از گزارش فقط **رفتار** و **IA** گرفته شد؛ پیشنهاد کتابخانه‌ای رد شد | `radix-ui`/`@base-ui/react` اولین وابستگی UI پروژه می‌شود و با «بدون وابستگی، توکن‌محور» و «shadcn/MUI نه» نمی‌خواند |
| یک ناسازگاری در گزارش اصلاح شد | امروز پنل فقط زیر `80rem` وجود دارد و آن ناحیه لمسی است؛ هاور آنجا هرگز فعال نمی‌شود. پس «هاور روی پنل فعلی» به‌تنهایی هیچ سود کاربری ندارد و فقط بعد از ساختن **پنل دسکتاپ** معنا پیدا می‌کند |
| ریسک «۱۷ آیتم در ناو میز» با الگوی پنل/گروه‌بندی حل شد، ولی به‌صورت فاز مشروط | گزارش درست می‌گوید سقف ۵–۷ آیتم سطح‌بالا؛ ولی بازچینش ناو میز کار جدا و پرریسکی است |
| خواندن متن از DB در `layout.tsx` با کش برچسب‌دار قید شد | بدون آن، هر صفحهٔ عمومی از static به dynamic می‌افتد — رگرسیون عملکرد که در نسخهٔ ۱ پنهان بود |
| فاز ۱ کوچک‌تر شد | ۵۰ کلید کافی است؛ بندهای تیره و هویت کاملاً به فازهای بعد رفتند |

---

## ۱) وضعیت امروز (نقشهٔ کنترل)

| چه چیزی | امروز کجا کنترل می‌شود | بدون deploy؟ |
| --- | --- | --- |
| «درباره من» (هویت) | جدول `person` | نه — هیچ مسیری در `/workspace` نیست |
| مهارت/موضوع/سازمان | `skills`, `topics`, `organizations` | نه — فقط SQL |
| متن ثابت سایت (شعار، عنوان اتاق‌ها، lede، گام‌های خانه) | `src/lib/copy.ts` (۹ export، ۴۴ مقدار) | نه |
| نام/توضیح سایت، عنوان مرورگر | `src/lib/site.ts`, `layout.tsx`, `manifest.ts` | نه |
| عنوان/متن موجودیت‌ها (دانش/پروژه/دوره/کالا/پک) | ویرایشگرهای موجود `/workspace` | بله — **همین‌جا می‌ماند** |
| تم روشن/تاریک | `ThemeToggle` + localStorage | فقط همان مرورگر |
| رنگ/شعاع/تایپ | توکن‌های `globals.css` | نه |
| ~۱۰۰۸ رشتهٔ فارسی در ۶۰ فایل `tsx` | داخل JSX | نه |

ناوبری امروز (از گزارش، تأییدشده در کد): `Nav.tsx` هفت لینک تخت در `≥80rem`، پنل کلیکی فقط زیر `80rem`، `useDisclosure` درست (`aria-expanded`/`inert`/`hidden`/WAAPI/`prefers-reduced-motion`)، `SessionMenu` هم همان هوک با معنای Menu Button.

---

## ۲) چهار قاعدهٔ پذیرفته‌شده از تحقیق

1. **مدل بر اساس معنا، نه چیدمان** — کلید `voice.slogan`، نه «جای صفحه». هیچ فیلد ظاهری در مدل متن.
2. **singleton برای محتوای جهانی، collection برای تکرارشونده** — متن‌ها در رجیستری کلید؛ موجودیت‌ها در ویرایشگر خودشان.
3. **WORKING قابل ویرایش + LIVE تغییرناپذیر** — حداکثر یک پیش‌نویس per کلید؛ انتشار در یک تراکنش؛ بازگردانی = انتشار نسخهٔ قدیم با یادداشت.
4. **توکن معنایی، نه نام رنگ** — `data-accent`/`data-radius`؛ ویرایشگر فقط پالت مجاز؛ کنتراست در CI.

و از گزارش هاور، این چهار تصمیم (بقیه رد شد):

5. **هاور فقط بهبود تدریجی است؛ کلیک/فوکوس/تپ مسیر اصلی‌اند.** هاور فقط داخل `matchMedia("(hover: hover) and (pointer: fine)")`.
6. **الگوی Disclosure Hybrid** برای آیتم‌هایی که هم لینک‌اند هم پنل دارند: لینک + دکمهٔ شورون جدا با `aria-expanded`. هرگز `role="menu"` برای ناوبری سایت.
7. **پنل فقط برای اتاقی که مقصد سطح‌دوم واقعی دارد.** خانه/درباره من/دوره‌ها تخت می‌مانند.
8. **هیچ وابستگی UI تازه.** توسعهٔ `useDisclosure` + یک هوک `useHoverIntent`؛ Radix/Base UI فقط به‌عنوان تصمیم آیندهٔ مستند ثبت می‌شود.

---

## ۳) معماری مرکز کنترل — سه لایه

```
دیسک  →  src/lib/content/registry.ts     پیش‌فرض + فراداده (گروه، برچسب، سقف طول، usedAt)
DB    →  site_copy / content_revision / site_theme / theme_preference
خواندن→  src/lib/content/site-copy.ts    ادغام live→پیش‌فرض + fallback کامل
```

### ۳.۱ شکل کلید

`group.key`، گروه‌ها هم‌نام اتاق‌ها: `voice`, `rooms`, `person`, `knowledge`, `mirrors`, `lab`, `house`, `contact`, `home`, `site`, `system`.

```ts
// src/lib/content/registry.ts
export type CopyField = {
  key: string;          // "voice.slogan"
  group: CopyGroup;
  fa: string;           // پیش‌فرض = مقدار امروز copy.ts (منبع واحد در دیسک)
  en?: string;
  label: string;        // نام خوانا در ویرایشگر
  hint?: string;        // «در هدر خانه دیده می‌شود»
  maxLength: number;
  multiline?: boolean;
  usedAt: string[];     // ["src/app/page.tsx", "src/components/Nav.tsx"]
};
```

فهرست‌های تودرتو با کلید شماره‌دار برگ می‌شوند: `person.intro.1..4`، `home.steps.2.body`. هیچ کلیدی به آرایه اشاره نمی‌کند.

### ۳.۲ خواندن و مسئلهٔ static بودن

- `getSiteCopy()`: یک SELECT، ادغام `live ?? default`، با `unstable_cache`، `tags: ["site-copy"]`، `revalidate` بلند.
- انتشار/بازگردانی → `revalidateTag("site-copy")` در همان route. نتیجه: صفحه‌های عمومی **static می‌مانند** و فقط پس از انتشار تازه می‌شوند.
- اگر بدون کش خوانده شود، `layout.tsx` به DB وابسته می‌شود و همهٔ مسیرها dynamic می‌شوند — این رگرسیون در فاز ۱ با خروجی `next build` (ستون static/dynamic) چک می‌شود.
- قطع DB: `getSiteCopy()` خطا را می‌بلعد و کامل به پیش‌فرض رجیستری برمی‌گردد؛ صفحهٔ عمومی مثل امروز بالا می‌آید.
- `copy.ts` **حذف نمی‌شود**؛ آداپتور نازک روی رجیستری می‌شود تا ۱۰ فایل مصرف‌کننده و منطق زنده دست نخورند.
- کامپوننت‌های کلاینت (`Nav`, `Footer` زیر `SiteChrome`): متن‌ها **prop** از `layout.tsx` (سروری) می‌گیرند. هیچ `fetch` تازه در ناو/فوتر.

### ۳.۳ دیسک

- `registry.ts` منبع پیش‌فرض و تنها منبع فراداده؛ در گیت.
- برون‌بری از میز → `uploads/content/site-copy-<ts>.json` (در gitignore). درون‌ریزی → فقط **پیش‌نویس** می‌سازد، نه انتشار.
- دیسک = پیش‌فرض قابل بازگشت؛ DB = مقدار زنده. هیچ‌کدام تنها نیست.

---

## ۴) جدول‌ها و مایگریشن

یک مایگریشن: `src/db/migrations/0030_content_control.sql` (ساخت فقط با `node scripts/generate-migration-files.mjs`؛ env/اجرای مایگریشن کار من نیست).

```sql
CREATE TABLE IF NOT EXISTS site_copy (
  id serial PRIMARY KEY,
  key varchar(120) NOT NULL,
  locale varchar(8) NOT NULL DEFAULT 'fa',
  draft_value text,
  live_value text,
  live_revision integer NOT NULL DEFAULT 0,
  draft_note text,
  updated_by integer REFERENCES accounts(id) ON DELETE SET NULL,
  updated_at timestamptz DEFAULT now(),
  published_by integer REFERENCES accounts(id) ON DELETE SET NULL,
  published_at timestamptz,
  UNIQUE (key, locale)
);

CREATE TABLE IF NOT EXISTS content_revision (
  id serial PRIMARY KEY,
  entity varchar(32) NOT NULL,        -- 'site_copy' | 'person' | 'taxonomy'
  entity_key varchar(160) NOT NULL,   -- 'voice.slogan' | 'person:hadiran'
  revision integer NOT NULL,
  snapshot jsonb NOT NULL,
  note text,
  actor_id integer REFERENCES accounts(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (entity, entity_key, revision)
);

CREATE TABLE IF NOT EXISTS site_theme (
  id integer PRIMARY KEY DEFAULT 1,
  accent_slug varchar(32) NOT NULL DEFAULT 'lapis',
  radius_scale varchar(16) NOT NULL DEFAULT 'md',
  default_mode varchar(16) NOT NULL DEFAULT 'system',
  updated_by integer REFERENCES accounts(id) ON DELETE SET NULL,
  updated_at timestamptz DEFAULT now(),
  CHECK (id = 1)
);

CREATE TABLE IF NOT EXISTS theme_preference (
  account_id integer PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
  preference varchar(16) NOT NULL DEFAULT 'system',
  accent_slug varchar(32),
  updated_at timestamptz DEFAULT now()
);
```

قواعد: خواندن عمومی فقط `live_value` · سطر بدون `live_value` = پیش‌فرض · «بازگشت به پیش‌فرض» = `live_value = NULL` + انتشار · انتشار همه‌چیز را در یک `db.transaction` می‌نویسد · قفل خوش‌بینانه با `live_revision` · متن ساده بدون HTML · سقف طول هم در فرم هم در سرور · `person` روی رکورد زنده می‌نشیند ولی هر ذخیره یک `content_revision` می‌سازد.

---

## ۵) IA میز (Track A)

یک آیتم تازه در ناو میز (owner): «متن و نام» → `/workspace/content`. بقیهٔ ناو دست نمی‌خورد (فاز ۵ اختیاری).

```
/workspace/content                 کارت گروه‌ها + شمار override + هویت + تیره
/workspace/content/copy/[group]    فرم گروه (label/hint/سقف/شمارنده/پیش‌نمایش)
/workspace/content/person          هویت کامل
/workspace/content/taxonomy        مهارت/موضوع/سازمان + پیوند به person
/workspace/content/theme           پالت مجاز + شعاع + حالت پیش‌فرض + پیش‌نمایش
```

- هر صفحه یک حکم دارد؛ فرم، نه جدول. تاریخچه جدول است.
- بازاستفاده: `CollectionSearch` برای جست‌وجوی کلید، `CollectionChips` («همه / تغییرکرده / پیش‌فرض»)، کارت‌ها با `section-cards`/`card-hover`/`is-compact` از `drive-rooms.css`.
- قطع DB: `PublicSourceNotice` بالای فرم، فرم از پیش‌فرض پر، ذخیره غیرفعال.
- همه noindex مثل بقیهٔ میز.

API: `GET /api/workspace/copy?group=` · `PUT` (ذخیرهٔ پیش‌نویس) · `POST` با `action=publish|revert` · `GET /history`. همه با `requireOwner` و همان الگوی routeهای موجود (`/api/workspace/discounts`).

---

## ۶) مالکیت فیلد (بدون تداخل)

| داده | تنها ویرایشگر | دیگران |
| --- | --- | --- |
| متن ثابت، نام سایت، عنوان مرورگر، لیبل/توضیح اتاق‌ها | `/workspace/content/copy/*` | در ویرایشگر موجودیت تکرار نمی‌شود |
| هویت `person` (نام، معرفی، داستان، مسیر، نگاه، اصول، آواتار، راه تماس) | `/workspace/content/person` | — |
| مهارت/موضوع/سازمان | `/workspace/content/taxonomy` | `person` فقط پیوند می‌دهد |
| عنوان/خلاصه/متن دانش، پروژه، دوره، کالا، پک | ویرایشگر فعلی همان ماژول | این ماژول فقط **لینک** می‌زند |
| تم هر کاربر | `ThemeToggle` (رفتار بدون تغییر) | میز فقط پیش‌فرض سایت و پالت |
| آواتار/رسانه | فقط URL در فاز ۲ | آپلود عکس/صدا تا دستور «بساز» ساخته نمی‌شود |

---

## ۷) تیره روی توکن

- پیش‌فرض سایت از `site_theme` در `layout.tsx` روی `<html data-accent data-radius data-theme-default>` می‌نشیند؛ CSS با `[data-accent="…"]` فقط `--accent`, `--accent-fg`, `--accent-soft`, `--accent-ink`, `--ring` را عوض می‌کند — نه بازنویسی `globals.css`، نه جایگزینی `ThemeToggle`/چراغ SVG.
- پالت مجاز: `lapis` (فعلی)، `teal`, `amber`, `plum` — هر کدام روشن/تاریک با کنتراست سنجیده‌شده. ورودی آزاد رنگ وجود ندارد.
- انتخاب کاربر (`light|dark|system`) مثل امروز در localStorage؛ اگر وارد شده باشد در `theme_preference` هم ذخیره می‌شود (شکست → فقط محلی، بدون خطا).
- اسکریپت کوچک کنتراست در CI روی جفت‌های متن/پس‌زمینهٔ هر پالت، هر دو حالت.

---

## ۸) Track B — ناوبری: پنل هیبرید + هاور عمدی

**وضعیت:** مسیر جدا، **مشروط**، پشت تأیید صریح. هیچ‌کدام از این‌ها در فاز ۱–۳ اجرا نمی‌شود.

### B0 — چیزی که امروز نمی‌سازیم
ناوبری تخت `≥80rem` کار می‌کند و پنل زیر `80rem` استاندارد است. طبق خودِ گزارش، مگامنو زیر ~۲۰ مقصد واقعی توجیه ندارد. پس **دست‌نزدن گزینهٔ معتبر است** و پیش‌فرض همین است.

### B1 — پنل دسکتاپ برای چهار اتاق (پیش‌نیاز هر هاوری)
ابتدا پنل، بعد هاور؛ چون هاور جایی معنا دارد که پنل باشد و پنل امروز فقط در ناحیهٔ لمسی است.

| اتاق | مقصد سطح‌دوم واقعی (موجود در کد) |
| --- | --- |
| باغ دانش | همهٔ نوشته‌ها، `/topics`، مراحل رشد — `loadPublicKnowledgeList`, `loadPublicTopicKnowledgeCounts` |
| کارگاه | پروژه‌های شاخص + مسیر همکاری — `loadPublicProjects` |
| آینه‌ها | فهرست آزمون‌ها از کاتالوگ — `lib/analyzers/catalog.ts` |
| فروشگاه | گونه‌های کالا (`shopKindFa`, `loadPublicShopList(kind)`) |
| خانه، درباره من، دوره‌ها | **بدون پنل** — تخت می‌مانند |

الگوی آیتم: `<Link>` واقعی + دکمهٔ شورون جدا (`aria-expanded`, `aria-controls`) = Disclosure Hybrid. لینک‌ها در DOM می‌مانند (`hidden` + `inert`، مثل امروز)، نه unmount — هم برای سئو، هم برای سازگاری با الگوی فعلی.
محتوا: عنوان‌ها و برچسب‌ها از رجیستری (`rooms.*.panel.*`) تا از همان میز کنترل شوند؛ شمارنده‌ها از کش برچسب‌دار؛ اگر DB نبود، پنل فقط لینک‌های ساده نشان می‌دهد.

### B2 — لایهٔ هاور (فقط بهبود)
```
src/components/navigation/useHoverIntent.ts   (~۳۵ خط، بدون وابستگی)
```
- فقط `matchMedia("(hover: hover) and (pointer: fine)")`.
- بازشدن ۱۵۰ms، بستن ۲۷۵ms، بدون تأخیر بین تریگرهای همسایه، انیمیشن ≤۳۰۰ms.
- ریشه = `.nav-anchor` موجود که هم تریگر هم پنل را دربر می‌گیرد → ورود به پنل تایمر بستن را لغو می‌کند.
- **پل هاور** روی فاصلهٔ `0.65rem` قرص تا پنل (`padding-top` روی کانتینر یا `::before`) تا WCAG 1.4.13 (پایدار + قابل هاور) نقض نشود.
- `Escape` می‌بندد و فوکوس به تریگر برمی‌گردد؛ بعد از `Escape`، هاور تا خروج کامل موس دوباره باز نمی‌کند.
- `SessionMenu` هرگز هاوری نمی‌شود (فرمان است، نه ناوبری). موبایل و `<80rem` همان Disclosure کلیکی.

### B3 — تصمیم موکول‌شده
اگر روزی چند پنل با مورفینگ (سبک Stripe) خواستیم: Radix `NavigationMenu` یا Base UI — **فقط** با تأیید صریح و پذیرش اولین وابستگی UI. تا آن روز دست‌ساز با `useDisclosure` + `useHoverIntent`.

### B4 — سقف ناو میز (اختیاری)
۱۷ آیتم owner بیش از قاعدهٔ ۵–۷ است. راه درست: همان الگوی B1 روی ریل میز، با گروه‌های «محتوا / مردم / بازار / سیستم». این بازچینش ناو است، نه بخشی از مرکز کنترل — فاز جدا و پشت تأیید.

---

## ۹) فازبندی

**فاز ۱ — پایهٔ متن (کوچک، قابل بازگشت)**
`0030` با `site_copy` + `content_revision`؛ `registry.ts` با ۵۰ کلید (۴۴ برگ `copy.ts` + ۶ از `site.ts`/`layout`/`manifest`)؛ `site-copy.ts` با کش برچسب‌دار؛ تبدیل `copy.ts` به آداپتور؛ `layout.tsx → SiteChrome → Nav/Footer` با prop؛ `/workspace/content` + `/workspace/content/copy/[group]`؛ API؛ آیتم ناو؛ یک تست واحد برای ادغام/fallback.
خروجی: شعار و عنوان‌ها از میز، با پیش‌نمایش، انتشار، بازگشت — بدون deploy، بدون افت static.

**فاز ۲ — هویت و تاکسونومی**
`/workspace/content/person` (فرم کامل + `principlesFa` فهرستی + `contactMethods` ردیفی) و `/workspace/content/taxonomy` (CRUD + پیوند)؛ `content_revision` برای person؛ الگو از `PeopleDesk`/`RecordManager` بدون کپی کامل.

**فاز ۳ — تیره و تاریخچه**
`site_theme` + `theme_preference` + `/workspace/content/theme` + اسکریپت کنتراست؛ تاریخچه/بازگردانی همهٔ کلیدها و person؛ برون‌بری/درون‌ریزی دیسک.

**فاز N1 — پنل هیبرید دسکتاپ** (Track B، مشروط؛ پیش‌نیاز: فاز ۱ چون برچسب‌ها از رجیستری می‌آیند)
داده‌های سطح‌دوم + چهار پنل + a11y + prop-driven محتوا.

**فاز N2 — `useHoverIntent`** (مشروط به N1)
هوک + پل هاور + تایمرها + تست کیبورد/لمسی/RTL.

**فاز ۴ (اختیاری)**
مهاجرت تدریجی صفحه‌های سروری به `getSiteCopy()` و ثبت کلید برای متن‌های پرتکرارِ ۶۰ فایل `tsx` — فقط کلیدهای واقعاً پرمصرف، نه استخراج انبوه.

هر فاز جدا: `tsc --noEmit`، `next build`، `node --test` موجود، ۱۶ مسیر بدون DB. پوش و استقرار فقط با دستور صریح، با `scripts/push-deploy.sh`.

---

## ۱۰) معیار پذیرش

**Track A**
1. تغییر «شعار» در میز → خانه بدون deploy عوض می‌شود؛ عمومی از `live_value` می‌خواند.
2. صفحه‌های عمومی پس از فاز ۱ **هنوز static** می‌مانند (خروجی بیلد مقایسه می‌شود) و فقط پس از انتشار بازتولید می‌شوند.
3. با DB قطع، همهٔ صفحه‌های عمومی با پیش‌فرض بالا می‌آیند؛ میز فرم را نشان می‌دهد ولی ذخیره بسته است.
4. پیش‌نویس منتشرنشده در هیچ صفحهٔ عمومی دیده نمی‌شود.
5. دو ویرایش هم‌زمان: نفر دوم پیام تعارض می‌گیرد، نه overwrite.
6. بازگردانی، نسخهٔ قبلی را منتشر می‌کند و رویداد تازه با یادداشت اجباری می‌سازد.
7. متن بلندتر از سقف در فرم و سرور رد می‌شود؛ HTML ذخیره نمی‌شود.
8. «درباره من» از میز کامل ویرایش می‌شود و `/hadiran` همان را نشان می‌دهد.
9. `ThemeToggle` سه‌حالته دست‌نخورده؛ پالت فقط از فهرست مجاز؛ `globals.css` بازنویسی نمی‌شود.
10. هیچ `/admin` یا `/dashboard` وجود ندارد؛ ۱۶ مسیر قبلی همان ۲۰۰.

**Track B**
11. با موس دقیق: هاور بعد از ~۱۵۰ms پنل را باز می‌کند؛ حرکت قطری به دورترین لینک (RTL: گوشهٔ چپ پایین) پنل را نمی‌بندد.
12. کلیک، `Enter/Space`، `Escape`، `Tab` و صفحه‌کلید تنها مستقل از هاور کار می‌کنند.
13. لپ‌تاپ لمسی و دستگاه بی‌موس: هیچ وابستگی‌ای به هاور نیست؛ ناو با کلیک کامل کار می‌کند (دام `@media (hover:hover)` تِیلویند ۴).
14. `SessionMenu` کلیکی مانده؛ هیچ `role="menu"` در ناوبری سایت نیست؛ لینک‌های پنل در HTML اولیه هستند.
15. اتاق‌های بدون مقصد دوم (خانه، درباره من، دوره‌ها) هنوز تخت‌اند.

---

## ۱۱) ریسک‌ها و تصمیم‌های باز

- **static → dynamic:** بزرگ‌ترین ریسک فنی فاز ۱؛ راه‌حل کش برچسب‌دار + سنجش خروجی بیلد. اگر Next در این نسخه با `unstable_cache` در لایهٔ layout همکاری نکرد، جایگزین: خواندن متن در هر صفحه (نه layout) و prop دادن به `SiteChrome` از همان صفحه.
- **سقف ناو:** ۱۷ آیتم در میز؛ در فاز ۱ فقط یک آیتم اضافه می‌شود و بازچینش نمی‌شود (B4 جدا).
- **i18n:** ستون `locale` از روز اول هست (هزینه صفر)؛ فاز ۱ فقط `fa`.
- **تعداد کلیدها:** عمداً ۵۰، نه ۱۰۰۰.
- **هاور:** اگر بعد از N2 داده نشان داد که کسی از هاور استفاده نمی‌کند، برگشتش حذف یک هوک است — به همین دلیل رفتار در یک فایل جدا نگه داشته می‌شود.
- **پرتره/رسانه:** آپلود عکس و صدا در فاز ۲ ساخته نمی‌شود (فقط URL) — منتظر دستور «بساز».

---

## ۱۲) وضعیت اجرا — فاز ۱ ساخته شد (۲۰۲۶-۱۰-۲۲)

**فایل‌های تازه**

| مسیر | نقش |
| --- | --- |
| `src/lib/content/registry.ts` | ۵۱ کلید با برچسب/راهنما/سقف طول/`usedAt`، `DEFAULT_COPY`، `applyOverrides`، `normalizeCopyValue`، `chromeCopy` |
| `src/lib/content/site-copy.ts` | `getSiteCopy()` با `unstable_cache` و تگ `site-copy` + fallback کامل بدون DB |
| `src/lib/content/desk.ts` | خواندن/ذخیرهٔ پیش‌نویس/انتشار/بازگشت/بازگردانی نسخه/تاریخچه |
| `src/lib/content/types.ts` | تیپ‌های مشترک برای ویرایشگر کلاینت |
| `src/lib/content/registry.test.mjs` | ۶ تست خالص (ادغام، کلید ناشناخته، HTML، سقف طول، آرایه، عدم mutate) |
| `src/db/migrations/0030_content_control.sql` | `site_copy` + `content_revision` (۳۱ مایگریشن با اسکریپت تولید شد) |
| `src/app/api/workspace/copy/route.ts` | `GET` (گروه/تاریخچه)، `PUT` (پیش‌نویس)، `POST` (`publish`/`revert`/`restore`) |
| `src/app/workspace/content/page.tsx` | نمای کلی گروه‌ها + شمار override/پیش‌نویس |
| `src/app/workspace/content/copy/[group]/page.tsx` | صفحهٔ گروه |
| `src/components/workspace/CopyGroupEditor.tsx` | ویرایشگر: صافی، جست‌وجو، شمارنده، پیش‌فرض، تاریخچه، انتشار با یادداشت |

**تغییرهای موجود**

- `src/lib/copy.ts`: منبع پیش‌فرض ماند؛ `navNotes` و `siteCopy` اضافه شد. دیگر هیچ صفحه‌ای مستقیم از آن import نمی‌کند (فقط رجیستری).
- `layout.tsx`: `generateMetadata` + `RootLayout` async؛ `SiteChrome` فقط `chromeCopy` می‌گیرد (نه کل رجیستری) تا payload کلاینت سبک بماند.
- `Nav`/`Footer`/`SiteChrome`: متن از prop، بدون fetch تازه.
- ۸ صفحه (`page`, `hadiran`, `knowledge`, `lab`, `analyzers`, `ecosystem`, `contact`, `not-found`) + `manifest.ts` روی `getSiteCopy()`.
- `/workspace/content` به ناو میز (owner) اضافه شد.

**راستی‌آزمایی**

- `tsc --noEmit` سبز؛ `next build` exit 0.
- فهرست routeهای static دقیقاً با `844d96f` یکی است (۶ مسیر: `_not-found`, `apple-icon`, `icon.svg`, `manifest`, `privacy`, `robots`) — هیچ صفحه‌ای از static به dynamic نیفتاد. `/` از قبل هم `ƒ` بود.
- `node --import tsx --test src/lib/content/registry.test.mjs` → ۶/۶؛ `node --test` قبلی → ۹/۹.
- بدون `DATABASE_URL`: ۱۸ مسیر ۲۰۰ و بدون خطا؛ `/workspace/content` → ۳۰۷ به `/signin`؛ `GET /api/workspace/copy` → ۴۰۱. متن‌ها از پیش‌فرض رجیستری رندر شدند و پیام «منبع برقرار نیست» در `/hadiran` و `/contact` مثل قبل است.

**آنچه در این فاز عمداً ساخته نشد**

هویت `person`، تاکسونومی، `site_theme`/`theme_preference`، برون‌بری/درون‌ریزی دیسک، و هر بخشی از Track B (پنل/هاور). مایگریشن `0030` فقط دو جدول دارد؛ دو جدول تیره در فاز ۳ با مایگریشن خودش می‌آید.
