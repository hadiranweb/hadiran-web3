# استپ D — نقشهٔ موثر / متاثر دیپلوی

وضعیت: **قفل‌شده.** مبهم نماند؛ YAML بعد از این مجاز است (برش‌های F).  
تاریخ قفل: ۲۰۲۶-۰۹-۲۰

---

## جدول اجباری

| رویداد | موثر | متاثر |
|---|---|---|
| merge به `main` (گیت سبز) | یک `liara deploy` به `hadiranweb` | jobهای `typecheck`+`build`، Environment `production`، App و Postgres در لیارا |
| PR | هیچ دیپلویی | فقط CI استپ B |
| `workflow_dispatch` | فقط گیت‌ها | job دیپلوی با `if` اجرا نمی‌شود |
| تغییر schema / فایل `src/db/migrations/*.sql` | باید قبل از `next start` روی **همان** App اعمال شود | `DATABASE_URL` به `hadiranweb-db`؛ هوک `liara_pre_start.sh`؛ **نه** `db:push` در هر استارت |
| اولین دیپلوی | جداول از جمله OTP (`0003`) هنوز نیستند تا هوک/SQL اجرا شود | ورود `/signin` تا migrate ناموفق است |
| OTP / SMS.ir | ورود پروداکشن | `SMSIR_*` و `HADIRAN_OWNER_PHONES` روی لیارا؛ بدون آن‌ها صفحات عمومی می‌مانند، پیامک قطع |
| عوض کردن دامنه | canonical، کوکی امن، OG | `NEXT_PUBLIC_SITE_URL` **قبل از بیلد بعدی** روی لیارا؛ SSL دامنه در کنسول |
| نبود `DATABASE_URL` | پرتاب در `src/db/index.ts` | صفحات DB ۵۰۰؛ خانهٔ بدون DB ممکن است بالا بیاید |
| lint قرمز | هیچ | CD و merge از نظر گیت اجباری |

---

## migrate (رفع ابهام D)

- سرویس دوم نیست.
- CI به Postgres وصل نمی‌شود.
- پروداکشن: `liara_pre_start.sh` → `node scripts/apply-migrations.mjs`
- فایل‌ها به ترتیب نام: `0000_baseline.sql` … `0004_*.sql`
- دفتر: جدول `_hadiran_schema_migrations`؛ هر فایل یک‌بار
- `0000` جداول هسته را با `IF NOT EXISTS` می‌سازد تا دیتابیس خالی لیارا در `0002` نشکند
- `npm run db:push` برای پروداکشن قفل **نیست**
- seed خودکار نیست؛ صفحات محتوا تا seed دستی خالی‌اند، OTP بعد از `0003` آمادهٔ schema است

هیچ ردیف مبهم نماند.
