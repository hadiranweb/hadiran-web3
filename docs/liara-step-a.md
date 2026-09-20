# استپ A — قرارداد منابع لیارا (هادیران)

وضعیت: **قفل‌شده.** YAML، Dockerfile دیپلوی، و `liara.json` هنوز نوشته نمی‌شود (استپ F).  
تاریخ قفل: ۲۰۲۶-۰۹-۲۰  
منبع محصول: همین workspace (`src/`، Next App Router + Drizzle).  
منبع الگو (نه کپی نام/فایل): کاغذ‌و‌باد.

قفل‌ها:

| فیلد | مقدار |
|---|---|
| پلتفرم | **Next** (نه Docker، نه Node جدا) |
| Node | **۲۲** (پیش‌فرض لیارا Next؛ سازگار با Next ۱۶) |
| پورت | **۳۰۰۰** |
| شناسهٔ App | **`hadiranweb`** → موقتاً `hadiranweb.liara.run` |
| شناسهٔ Postgres | **`hadiranweb-db`** |
| timezone | پیش‌فرض لیارا `Asia/Tehran` |

---

## ۱. چه می‌سازیم / چه نمی‌سازیم

| منبع لیارا | می‌سازیم؟ | شناسه | نقش |
|---|---|---|---|
| یک برنامهٔ محصول | بله | `hadiranweb` | Next App Router + Route Handler + OTP |
| یک PostgreSQL | بله | `hadiranweb-db` | تنها دیتابیس؛ `DATABASE_URL` |
| شبکهٔ خصوصی بین App و DB | بله | شبکهٔ همان تیم/حساب | URI داخلی، نه هاست عمومی |
| App دوم (Fastify / API جدا) | خیر | — | مونولیت است |
| ورکر صندوق / صف | خیر | — | در توپولوژی نیست |
| n8n / Open WebUI / استک AI | خیر | — | بیرون از هادیران |
| LiveKit | خیر | — | عمداً خارج |
| باکت/دیسک ۱۵گیگ درایو | خیر | — | عمداً خارج |
| Redis جدا | خیر | — | نرخ OTP در Postgres است |
| زرین‌پال به‌عنوان سرویس | خیر | — | بیرون از این مسیر |
| Docker image / Dockerfile دیپلوی | خیر | — | پلتفرم Next انتخاب شد |

هزینهٔ موثر A: **یک App + یک Postgres**.

---

## ۲. پلتفرم قفل‌شده: Next

هادیران یک برنامهٔ استاندارد Next است: `next` ۱۶٫۲٫۶، اسکریپت‌های `build` / `start`، بدون `server.js` سفارشی.

لیارا روی پلتفرم Next این را اجرا می‌کند:

1. `npm install` (dependencies + devDependencies)
2. `npm run build`
3. `npm start` → `next start`

| مورد | قرارداد |
|---|---|
| bind | `next start` روی همهٔ اینترفیس‌ها؛ `PORT` را لیارا می‌گذارد. Dockerfile و `HOSTNAME=0.0.0.0` لازم نیست. |
| Node | ۲۲ |
| پورت اعلامی CLI/`liara.json` (وقتی در F نوشته شود) | ۳۰۰۰ |
| migrate | هوک `liara_pre_start.sh` روی **همین** App (env دارد). سرویس دوم نه. |
| دیسک cache Next | فعلاً نه؛ اگر ISR بعداً لازم شد جدا قفل می‌شود. |

---

## ۳. متغیرهای پروداکشن

همه روی **کنسول لیارا / env برنامهٔ `hadiranweb`**؛ هیچ‌کدام داخل گیت یا `liara.json`.  
`NEXT_PUBLIC_*` در **زمان build** داخل باندل می‌رود — باید **قبل از اولین دیپلوی** ست شود.

| متغیر | کجا مصرف | محرمانه؟ | اگر نباشد |
|---|---|---|---|
| `DATABASE_URL` | `src/db/index.ts` — URI **شبکهٔ خصوصی** به `hadiranweb-db` | بله | صفحات DB پرتاب ۵۰۰ |
| `NEXT_PUBLIC_SITE_URL` | canonical / کوکی / لینک مطلق | خیر (عمومی) | تا دامنهٔ سفارشی: `https://hadiranweb.liara.run` |
| `SMSIR_API_KEY` | ارسال OTP | بله | در پروداکشن پیامک قطع |
| `SMSIR_TEMPLATE_ID` | قالب Verify | بله | ارسال قطع |
| `SMSIR_CODE_PARAMETER` | پیش‌فرض `CODE` | خیر | باید با قالب پنل یکی باشد |
| `SMSIR_TIMEOUT_MS` | پیش‌فرض `10000` | خیر | — |
| `OTP_TTL_SECONDS` | پیش‌فرض `120` | خیر | — |
| `OTP_MAX_ATTEMPTS` | پیش‌فرض `5` | خیر | — |
| `HADIRAN_OWNER_PHONES` | نقش `owner` در ورود اول | بله | هیچ مالکی ساخته نمی‌شود |

توکن GitHub و `LIARA_API_TOKEN` runtime هادیران نیستند؛ مال استپ E (Actions).

دامنهٔ سفارشی بعد از smoke روی `hadiranweb.liara.run`.

---

## ۴. migrate روی همان App

جدول‌ها در `src/db/migrations/` (`0001`…`0004`؛ OTP روی پروداکشن هنوز اعمال نشده).

- سرویس migrate جدا **نمی‌سازیم**.
- استپ F: `liara_pre_start.sh` قبل از `next start`.
- دستور دقیق (`drizzle-kit migrate` در برابر SQL) در استپ D/F.

---

## ۵. موثر / متاثر قفل‌شده

| | موثر | متاثر |
|---|---|---|
| App `hadiranweb` | یک صورتحساب PaaS، ساب‌دامین `hadiranweb.liara.run` | استپ C: یک `liara deploy --app=hadiranweb` |
| Postgres `hadiranweb-db` | `DATABASE_URL` تنها منبع حقیقت DB | OTP، دانش، چت، موضوعات |
| پلتفرم Next + Node ۲۲ | استپ F فقط `liara.json` + هوک؛ بدون Dockerfile | bind و نسخهٔ Node دیگر باز نیست |
| env روی لیارا نه گیت | نشت secret | بیلد `NEXT_PUBLIC_*`، ورود SMS.ir |
| نساختن LiveKit/درایو/Fastify/Docker | هزینه و سطح حمله | توپولوژی فعلی کد |

---

## ۶. خارج از A (عمداً)

- نوشتن YAML / Dockerfile / `liara.json` (F)
- ساخت واقعی App در کنسول لیارا از این sandbox
- push گیت، secret گیت‌هاب (E)
- کپی نام‌های `kaghazbaad-*`
- بالا نگه داشتن سایت داخل sandbox
- یکی‌دانستن شناسهٔ لیارا `hadiranweb` با ریپوی پروفایل خالی `github.com/hadiranweb/hadiranweb` — ریپوی محصول جدا در E قفل می‌شود

توکن آپلودشده فقط برای استپ E؛ در این فایل و در گیت نمی‌آید.
