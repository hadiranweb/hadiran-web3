# استپ E — اتصال GitHub

وضعیت: **قفل و انجام‌شده (به‌جز secret لیارا).**  
تاریخ: ۲۰۲۶-۰۹-۲۰

| فیلد | مقدار |
|---|---|
| ریپوی محصول | **https://github.com/hadiranweb/hadiran-web3** (عمومی) |
| شاخه | `main` |
| Environment | `production` |
| App لیارا | همچنان `hadiranweb` (نام ریپو ≠ شناسهٔ App) |
| ریپوی پروفایل | `hadiranweb/hadiranweb` دست‌نخورده ماند |

توکن GitHub در گیت و در پاسخ چت نیست. `uploads/` در `.gitignore` است.

## انجام شد

1. `git init` روی workspace؛ commit اولیه روی `main`
2. ساخت ریپوی `hadiranweb/hadiran-web3`
3. push به `origin/main`
4. Environment گیت‌هاب `production`

## هنوز نیست (عمداً از sandbox ساخته نمی‌شود)

| مورد | کجا |
|---|---|
| `LIARA_API_TOKEN` | Secret ریپو / Environment `production` در GitHub |
| `LIARA_TEAM_ID` | فقط اگر برنامه در تیم لیارا باشد |
| App `hadiranweb` و Postgres `hadiranweb-db` | کنسول لیارا |
| env ران‌تایم (`DATABASE_URL`, SMS.ir, …) | کنسول لیارا، نه GitHub |

اولین run اکشن روی `main` job دیپلوی را هم صدا می‌زند؛ بدون `LIARA_API_TOKEN` آن job قرمز می‌شود. گیت‌های `typecheck`/`build` جدا ارزیابی می‌شوند.

## موثر / متاثر E

| | موثر | متاثر |
|---|---|---|
| push به `main` | CI + تلاش برای دیپلوی | `.github/workflows/ci.yml` |
| نبود secret لیارا | فقط job `deploy` می‌شکند | استپ C |
| ریپوی `hadiran-web3` | آدرس کد | پروفایل گیت‌هاب عوض نمی‌شود |
