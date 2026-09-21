# آموزش: ساخت App و Postgres هادیران در کنسول لیارا

این راهنما برای **کنسول لیارا** است، نه برای گیت.  
ریپو و GitHub Actions از قبل آماده‌اند. از این sandbox به API لیارا دسترسی نیست؛ کار را در [console.liara.ir](https://console.liara.ir/) انجام بده.

بعد از این مراحل، هر push به `main` مثل کاغذ‌و‌باد روی لیارا مستقر می‌شود.

مقادیر زیر با کد فعلی قفل شده‌اند (`liara.json`، `.env.example`، `.github/workflows/ci.yml`). عوض‌شان نکن.

| پارامتر | مقدار اجباری | منبع در کد |
|---|---|---|
| شناسهٔ App | `hadiranweb` | `liara.json` → `app` و `liara deploy --app hadiranweb` |
| پلتفرم | **NextJS** | `liara.json` → `platform: next` |
| نسخهٔ Node | **۲۲** | `liara.json` → `next.nodeVersion` (نه `next.version`) |
| پورت | **۳۰۰۰** | `liara.json` → `port` |
| شناسهٔ Postgres | `hadiranweb-db` | قرارداد استقرار |
| ساب‌دامین موقت | `https://hadiranweb.liara.run` | `NEXT_PUBLIC_SITE_URL` |
| ریپو | `hadiranweb/hadiran-web3` | GitHub Actions |

شبکهٔ خصوصی را خودت نام می‌گذاری؛ فقط **App و DB باید همنامِ شبکه باشند**. پیشنهاد: `hadiran`. بعد از ساخت برنامه، شبکه عوض نمی‌شود.

---

## ۰. چه چیزی از قبل روی GitHub است (دست نزن)

این‌ها را دوباره در گیت یا Actions نگذار:

- Secret ریپو و Environment `production`: `LIARA_API_TOKEN`، `LIARA_TEAM_ID`
- Workflow: `.github/workflows/ci.yml` — دیپلوی فقط با `push` به `main`
- `liara.json`، `liara_pre_start.sh`، `scripts/apply-migrations.mjs`

`DATABASE_URL` و کلید SMS **وارد GitHub نمی‌شوند.** فقط env برنامه در لیارا.

`workflow_dispatch` روی `main` هم دیپلوی می‌کند (بدون commit خالی). گیت‌های typecheck و build سر جایشان می‌مانند.

---

## ۱. ورود به تیم درست

1. وارد [console.liara.ir](https://console.liara.ir/) شو.
2. همان تیمی را باز کن که Team ID آن در GitHub Secret است.
3. اگر App را در تیم دیگری بسازی، `liara deploy` از Actions آن را پیدا نمی‌کند.

---

## ۲. شبکهٔ خصوصی

در فرم ساخت دیتابیس یا برنامه، **شبکه خصوصی** → **ساخت شبکه خصوصی جدید**.

- نام پیشنهادی: `hadiran`
- این شبکه را برای **هر دو** منبع بعدی انتخاب کن.

هدف: App با host داخلی `hadiranweb-db` به Postgres برسد، نه با هاست عمومی `*.liara.cloud`.

---

## ۳. دیتابیس PostgreSQL

منو **دیتابیس‌ها** → **ایجاد دیتابیس** → **PostgreSQL**.

| فیلد | مقدار |
|---|---|
| شناسه | `hadiranweb-db` (دقیقاً همین؛ نه `hadiran-db` و نه نام کاغذ) |
| شبکه خصوصی | همان `hadiran` |
| نسخه | آخرین نسخهٔ پایدار پیشنهادی لیارا |
| دسترسی شبکهٔ عمومی | بهتر است خاموش باشد؛ اتصال فقط از شبکهٔ خصوصی |

پلن را مطابق نیاز انتخاب کن. صبر کن تا وضعیت دیتابیس **روشن / آماده** شود.

### `DATABASE_URL` را از کجا بردار

داخل دیتابیس → **نحوهٔ اتصال** → بخش **شبکه خصوصی** (نه عمومی).

شکل درست (رمز را از پنل کپی کن):

```text
postgresql://USER:PASSWORD@hadiranweb-db:5432/postgres
```

نشانهٔ اتصال داخلی: host برابر شناسهٔ دیتابیس است (`hadiranweb-db`)، پورت معمولاً `5432`، بدون `bromo.liara.cloud` و بدون پورت تصادفی عمومی.

کد برنامه فقط همین متغیر را می‌خواند: `src/db/index.ts` → `process.env.DATABASE_URL`.  
هوک `liara_pre_start.sh` هم بدون این متغیر استارت را قطع می‌کند.

این URI را در چت و در گیت نگذار.

---

## ۴. برنامهٔ NextJS

منو **پلتفرم** → **ایجاد برنامه**.

| فیلد | مقدار |
|---|---|
| پلتفرم | **NextJS** (نه NodeJS، نه Docker) |
| شناسه | `hadiranweb` |
| شبکه خصوصی | همان `hadiran` (مشترک با دیتابیس) |
| پلن CPU/RAM | به انتخاب تو؛ اگر کم باشد ممکن است `ECONNRESET` در بیلد Next بیاید |

بعد از ایجاد، دامنهٔ پیش‌فرض این است:

```text
https://hadiranweb.liara.run
```

نسخهٔ Node را **۲۲** بگذار ([تغییر نسخه در Next](https://docs.liara.ir/paas/nextjs/how-tos/choose-version/)). با `liara.json` یکی است. پورت را در کنسول اگر پرسید **۳۰۰۰**.

کد را از کنسول zip نکن. استقرار از GitHub Actions است.

---

## ۵. متغیرهای محیطی برنامهٔ `hadiranweb`

برنامه → **تنظیمات** → **متغیرها**.

این نام‌ها باید **عین** `.env.example` باشند. مقدار لوکال (`127.0.0.1`) را کپی نکن.

### اجباری قبل از اولین دیپلوی

```text
DATABASE_URL=postgresql://USER:PASSWORD@hadiranweb-db:5432/postgres
NEXT_PUBLIC_SITE_URL=https://hadiranweb.liara.run
```

- `DATABASE_URL`: همان URI شبکهٔ خصوصی مرحلهٔ ۳.
- `NEXT_PUBLIC_SITE_URL`: چون با پیشوند `NEXT_PUBLIC_` است، در **زمان build** داخل باندل می‌رود. اگر بعد از دیپلوی عوضش کنی، باید یک دیپلوی جدید بگیری.

اگر دامنهٔ اختصاصی بعداً وصل شد، این مقدار را به `https://دامنه-تو` عوض کن و دوباره به `main` push کن.

### ورود OTP (اختیاری برای بالا آمدن سایت عمومی)

بدون این‌ها دانش/آزمایشگاه/خانه خوانده می‌شوند؛ `/signin` پیامک نمی‌فرستد.

```text
SMSIR_API_KEY=
SMSIR_TEMPLATE_ID=
SMSIR_CODE_PARAMETER=CODE
SMSIR_TIMEOUT_MS=10000
OTP_TTL_SECONDS=120
OTP_MAX_ATTEMPTS=5
HADIRAN_OWNER_PHONES=
```

- `SMSIR_CODE_PARAMETER` باید با پارامتر قالب Verify در پنل SMS.ir یکی باشد؛ در کد پیش‌فرض `CODE` است.
- قالب نمونه: `کد ورود هادیران: {CODE}`
- `HADIRAN_OWNER_PHONES`: موبایل‌های ایرانی، جدا با ویرگول، بدون فاصلهٔ لازم. در ورود اول نقش `owner` می‌گیرند.
- کلید SMS را `NEXT_PUBLIC_` نکن.

بعد از ذخیرهٔ متغیرها اگر برنامه قبلاً دیپلوی شده، یک‌بار **ری‌استارت** یا دیپلوی جدید لازم است.

---

## ۶. اولین اتصال CI/CD

وقتی App و DB آماده‌اند و دو متغیر اجباری ست شده:

1. برو به [Actions ریپو](https://github.com/hadiranweb/hadiran-web3/actions).
2. آخرین workflow مربوط به `push` روی `main` را باز کن.
3. **Re-run failed jobs** (یا کل run را دوباره اجرا کن).

یا یک commit خالی به `main` (فقط اگر لازم شد).

ترتیب jobها:

1. Typecheck  
2. Next build  
3. **Deploy to Liara** → `liara deploy --app hadiranweb --port 3000`

بعد از دیپلوی موفق، لیارا `npm run build` و سپس `liara_pre_start.sh` را اجرا می‌کند (مایگریشن `0000`…`0004`) و بعد `next start`.

Smoke:

- `https://hadiranweb.liara.run/` باید خانه (چت) را بدهد.
- `https://hadiranweb.liara.run/api/health` اگر DB وصل باشد `{ "ok": true }`.
- صفحات دانش/موضوع تا وقتی seed نزده باشی ممکن است خالی باشند؛ ۵۰۰ یعنی معمولاً `DATABASE_URL` اشتباه یا شبکهٔ جدا.

---

## ۷. چه چیزی را به گیت یا چت نده

| بده به | نده |
|---|---|
| کنسول لیارا / env برنامه | `DATABASE_URL`، SMS، شماره‌های مالک |
| GitHub Secrets (از قبل ست شده) | توکن API لیارا و Team ID |
| گیت | هیچ secret، هیچ `.env` |

شناسه‌های `hadiranweb` و `hadiranweb-db` عمومی‌اند و در کد هستند؛ رمز دیتابیس و توکن API نه.

---

## ۸. اگر دیپلوی قرمز شد

| پیام / وضعیت | کار |
|---|---|
| `Missing LIARA_API_TOKEN` | Secret گیت‌هاب؛ نباید در این مرحله پیش بیاید |
| برنامه پیدا نشد / app does not exist | شناسه در کنسول باید دقیقاً `hadiranweb` باشد، در همان تیم |
| `DATABASE_URL is required` در لاگ استارت | متغیر روی App ست نشده |
| اتصال به DB رد می‌شود | URI عمومی است، یا App و DB شبکهٔ متفاوت دارند، یا رمز اشتباه است |
| صفحات DB پنج‌صد | همان `DATABASE_URL`؛ خانه ممکن است بدون DB هم HTML بدهد |
| `COPY failed: stat app/public` | پوشهٔ `public/` باید در ریشهٔ ریپو باشد (حتی خالی با `.gitkeep`)؛ ایمیج ران‌تایم Next لیارا آن را کپی می‌کند |
| OTP ارسال نمی‌شود | `SMSIR_API_KEY` و `SMSIR_TEMPLATE_ID` |

لاگ برنامه در کنسول لیارا → تاریخچه / لاگ. هوک مایگریشن باید خط `apply 0000_baseline.sql` تا `0004_…` را نشان بدهد (دفعات بعد `skip`).
