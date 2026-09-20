# رودمپ برنامه‌ریزی استقرار هادیران روی لیارا

وضعیت: **A–D قفل. F.۱–۳ روی دیسک.** استپ بعدی: E (ریپو و secret).  
تاریخ: ۲۰۲۶-۰۹-۲۰  
الهام: الگوی CI→گیت→CD کاغذ‌و‌باد. راهنماهای داخل آن ریپو و نام Appهایش کپی نمی‌شوند.

---

## ۰. واقعیت همین sandbox (الان)

| مورد | وضعیت |
|---|---|
| `.git` | نیست |
| `gh` / توکن در env یا پروژه | نیست (فایل آپلود جدا؛ وارد گیت/پاسخ نمی‌شود) |
| `.env` / Postgres داخل sandbox | نیست |
| اتصال ریپو به این چت | هنوز فعال نشده؛ کار فقط فایل workspace است |

دو اتصال بعدی، وقتی بخواهی، جدا قفل می‌شوند:

1. **ریپوی متصل به چت** — نوشتن/خواندن کد همان مخزن.
2. **توکن API** — ساخت Actions، Environment، secret لیارا. خودِ توکن در پیام چت پیست نشود.

تا استپ ۳، هیچ‌کدام لازم نیست.

---

## ۱. چه چیزی از کاغذ‌و‌باد الهام است / چه چیزی مال هادیران است

الهام (الگو، نه فایل):

- PR فقط اعتبارسنجی است؛ دیپلوی هرگز از PR نیست.
- push به `main` فقط بعد از سبز بودن همهٔ گیت‌ها `liara deploy` می‌کند.
- Secret استقرار (`LIARA_API_TOKEN`، در صورت نیاز team-id) در GitHub؛ متغیر runtime در کنسول لیارا.
- GitHub Environment به نام `production`.
- concurrency روی دیپلوی پروداکشن؛ دیپلوی وسط کار کنسل نشود.
- استک جانبی (AI، ورکر صندوق، نصب‌کنندهٔ ویندوز) اگر وجود دارد جدا و دستی است — در هادیران اصلاً نیست.

هادیران (توپولوژی واقعی):

| کاغذ‌و‌باد | هادیران |
|---|---|
| فرانت Vite + بک‌اند Fastify + mailbox-worker | **یک** Next App Router + Drizzle |
| سه App لیارا + استک AI جدا | یک App محصول + یک Postgres |
| migrate داخل ایمیج بک‌اند | migrate/`db:push` باید برای همین یک App تعریف شود |
| LiveKit، زرین‌پال، درایو | عمداً بیرون از توپولوژی |

---

## ۲. استپ‌های برنامه‌ریزی (هر کدام جدا قفل می‌شود)

بعد از تأیید این رودمپ، هر استپ را جدا قفل می‌کنیم، بعد کد همان استپ.

### استپ A — قرارداد منابع لیارا — **قفل**

قرارداد کامل: `docs/liara-step-a.md`.

- پلتفرم **Next**، Node **۲۲**، پورت **۳۰۰۰** (نه Docker)
- App: **`hadiranweb`** → `hadiranweb.liara.run`
- Postgres: **`hadiranweb-db`** + شبکهٔ خصوصی؛ `DATABASE_URL` داخلی
- env پروداکشن روی کنسول لیارا: `DATABASE_URL`، `NEXT_PUBLIC_SITE_URL`، `SMSIR_*`، `OTP_*`، `HADIRAN_OWNER_PHONES`
- migrate روی همین App (`liara_pre_start.sh` در F)
- نمی‌سازیم: Fastify، ورکر، n8n، AI، LiveKit، درایو ۱۵گیگ، Redis، Dockerfile دیپلوی

**موثر A:** یک صورتحساب PaaS+DB؛ استپ F فقط `liara.json`+هوک.  
**متاثر A:** مونولیت Next و OTP به SMS.ir.

### استپ B — گیت‌های CI هادیران — **قفل**

قرارداد: `docs/liara-step-b.md`. YAML گیت‌ها: `.github/workflows/ci.yml`.

- مسدود: `typecheck`، `build` (Node ۲۲، `npm ci`)
- مشورتی: `lint-diagnostics` (مثل کاغذ؛ در `needs` دیپلوی نیست)
- بیلد با `DATABASE_URL` جعلی (ماژول DB در import پرتاب می‌کند)
- نه installer، نه تست Fastify، نه AI، نه migrate در CI

**موثر B:** هر PR و push به `main`.  
**متاثر B:** اسکریپت‌های `package.json`.

### استپ C — CD فقط روی `main` — **قفل**

قرارداد: `docs/liara-step-c.md`. YAML: job `deploy` در `.github/workflows/ci.yml`.

- دیپلوی فقط `push` به `main`؛ PR و `workflow_dispatch` دیپلوی نمی‌کنند
- `needs: [typecheck, build]`؛ `environment: production`
- یک `liara deploy --app hadiranweb --port 3000` با `@liara/cli@9.5.1`
- `--no-app-logs`؛ پیام SHA؛ concurrency بدون کنسل

**موثر C:** پروداکشن بعد از merge.  
**متاثر C:** App در لیارا، `LIARA_API_TOKEN`، Environment.

### استپ D — نقشهٔ موثر / متاثر — **قفل**

جدول کامل: `docs/liara-step-d.md`. مبهم نماند.

migrate: `liara_pre_start.sh` فایل‌های `0001`…`0004` به ترتیب؛ `db:push` در پروداکشن نه.

### استپ E — اتصال GitHub (بعد از قرارداد)

ترتیب پیشنهادی:

1. ریپوی خالی/موجود هادیران مشخص شود (نام App کاغذ کپی نشود).
2. workspace به git تبدیل شود یا ریپو به چت وصل شود.
3. توکن فقط برای Actions/secret — حداقل دسترسی: `contents` + `actions`؛ توکن در چت نیاید.
4. Secretهای لیارا در GitHub؛ runtime در لیارا.

این sandbox الان هیچ‌کدام را ندارد.

### استپ F — پیاده‌سازی تکه‌تکهٔ کد

1. **انجام شد:** `liara.json` (Next، `hadiranweb`، پورت ۳۰۰۰، Node ۲۲؛ بدون env)
2. **انجام شد:** `.github/workflows/ci.yml` گیت‌ها
3. **انجام شد:** job `deploy` فقط `main` + `liara_pre_start.sh` + `scripts/apply-migrations.mjs` + `0000_baseline.sql`
4. **انجام شد:** `.env.example` هم‌تراز با env لیارا (بدون secret)

`.gitignore` اضافه شد تا `uploads/` و `.env` وارد گیت نشوند.

---

## ۳. خارج از این رودمپ

- LiveKit، درایو ۱۵گیگ، زرین‌پال، `/fa`/`/en`، داشبورد واحد
- کپی نام Appهای `kaghazbaad-*`
- دیپلوی از این sandbox به لیارا (اینجا Postgres و secret پروداکشن نیست)
- بالا نگه داشتن سایت داخل sandbox

---

## ۴. استپ بعدی بعد از تأیید این فایل

F.۳: job دیپلوی روی `main` + هوک `liara_pre_start.sh`. سپس E (ریپو و secret؛ توکن در چت نمی‌آید).
