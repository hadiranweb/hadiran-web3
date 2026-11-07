# نقشهٔ توسعهٔ schema آزمون‌ساز عمومی

**وضعیت:** مراحل ۱ تا ۴ در workspace پیاده‌سازی شده‌اند؛ TypeScript، ESLint هدفمند و هر ۹۱ تست محلی پاس شده‌اند. SQL migration هنوز روی PostgreSQL واقعی replay نشده است.
**محدودهٔ این نوبت:** تغییر فایل‌های کد و migration در workspace؛ اجرای migration روی دیتابیس زنده، deploy و push انجام نمی‌شود.

## معیار پایان کار

- آزمون‌ها همچنان با جداول مشترک مدیریت شوند؛ برای هر آزمون جدول اختصاصی ساخته نشود.
- تعریف هر آزمون نسخه داشته باشد؛ attempt به نسخهٔ دقیق خودش ارجاع دهد و نسخهٔ منتشرشده با تغییر بعدی دست‌کاری نشود.
- سؤال، گزینه/قاعدهٔ پاسخ، پارامتر امتیاز، فرمول، یافته و تنظیمات گزارش موجودیت‌های جدا و قابل ممیزی باشند.
- یک سؤال یا یک قاعدهٔ پاسخ بتواند چند `response_effect` مستقل داشته باشد؛ هر effect مقصد، operation، value/coefficient و تنظیمات امن خودش را داشته باشد.
- ورودی فرمول و مقصد اثرها با FKهای نسخه‌همسان کنترل شوند؛ operationها allowlist باشند و هیچ `eval` یا کد اجرایی از DB پذیرفته نشود.
- گزارش تولیدشده snapshot تنظیمات و نسخهٔ آزمون را نگه دارد؛ پاسخ‌ها، گزارش، دسترسی‌ها و ledger/تعرفه/سهمیه همچنان جدا بمانند.
- JSONB فقط برای تنظیمات منعطف/سازگاری موقت بماند، نه منبع اصلی رابطه‌های قابل‌اعتبارسنجی.
- دادهٔ محتوایی آزمون در PostgreSQL ذخیره شود؛ کد صرفاً موتور عمومی، validator، mapper و fallback کنترل‌شده را نگه دارد.

## طرح نهاییِ اجزای داده

`analyzer_packs` هویت پایدار و مجوزهای آزمون را حفظ می‌کند. هر نسخه در `analyzer_pack_versions` قرار می‌گیرد، `analyzer_pack_releases` نسخهٔ جاریِ قابل‌اجرا را مشخص می‌کند و نسخهٔ منتشرشده immutable است. اجزای هر نسخه در جدول‌های مشترک زیر ذخیره می‌شوند:

- `analyzer_pack_sections` و `analyzer_pack_questions`؛ گزینه‌ها در `analyzer_pack_choice_options`.
- `analyzer_pack_parameters`؛ از `analyzer_pack_findings` جداست تا «نمره/بُعد» با «یافته/متن تفسیری» یکی نشود.
- `analyzer_pack_response_rules` و `analyzer_pack_response_effects`؛ هر effect به سؤال/قاعده، یک پارامتر مقصد و operation/config مستقل متصل است.
- `analyzer_pack_formulas`, `analyzer_pack_formula_inputs`, `analyzer_pack_formula_bands`, `analyzer_pack_formula_rules`؛ ورودی‌ها نوع‌دار و نسخه‌همسان‌اند.
- `analyzer_pack_keywords`, `analyzer_pack_keyword_children`, `analyzer_pack_edges`؛ گراف/نگاشت‌های موجود را از تعریف سؤال جدا می‌کنند.
- `analyzer_pack_report_configs` و جدول‌های فرزند context، band و cross-pattern؛ تنظیمات گزارش درجه‌اول و نسخه‌دار است.
- `analyzer_attempts.pack_version_id` و `analyzer_reports.pack_version_id` به snapshot نسخه پیوند می‌خورند. JSON پاسخ/نتیجه و snapshot گزارش برای payload اجرایی/سند حفظ می‌شود؛ آن‌ها جای FKهای تعریف آزمون را نمی‌گیرند.
- `analyzer_pack_authoring_issues` موردهای قدیمی یا ارجاع‌های حل‌نشده را ثبت می‌کند تا backfill آن‌ها را بی‌صدا حذف نکند.

نمای رابطهٔ اصلی:

```text
analyzer_packs
├── analyzer_pack_versions ── analyzer_pack_releases (نسخهٔ جاری)
│   ├── sections ── questions ── choice_options ── response_rules ── response_effects ── parameters
│   ├── parameters ── formulas ── formula_inputs ── questions / parameters
│   ├── findings / keywords / edges
│   ├── report_config ── context_questions / bands / cross-pattern parameters
│   └── analyzer_attempts ── analyzer_reports (هر دو با FK به همان نسخه)
└── grants / دسترسی‌ها / commercial ledger (جدا از scoring)
```

`response_effects` برای هر نگاشت مستقل، پارامتر مقصد، operation allowlist‌شده، coefficient و `value` اسکالر (عدد/متن/boolean) دارد؛ `config` فقط داده است و هرگز کد اجرایی نیست.

## گام‌های اجرا

### گام ۱ — هستهٔ schema و migration (این نوبت)

- [x] ساخت جدول‌های نسخه‌دار، اجزای نرمال‌شده، FK/check/indexهای PostgreSQL و محافظ immutable بودن نسخهٔ منتشرشده.
- [x] backfill یک‌باره از `analyzer_packs.pack` JSONB برای داده‌های موجود؛ پیوند attempt/report فقط در تطبیق دقیق slug+version.
- [x] حفظ ستون JSONB فعلی به‌عنوان projection سازگاری و fallback محدود؛ مسیر relational اکنون هنگام حضور migration منبع خواندن/نوشتن است.
- [x] بررسی static، ESLint، TypeScript و تست‌های runtime؛ در جمع‌بندی فعلی هر ۹۰ تست کلی پاس‌اند.
- [ ] اجرای replay واقعی migration روی PostgreSQL آزمایشی؛ PostgreSQL محلی در دسترس نیست و migration عمداً اجرا نشده است.

### گام ۲ — لایهٔ داده و مهاجرت نوشتن/خواندن

- [x] mapper دوطرفهٔ `AnalyzerPack` ↔ ردیف‌های relational، شامل گراف با مبدأ سؤال/پارامتر/واژه/یافته و response rule/effect.
- [x] ذخیرهٔ تراکنشی نسخه و اجزایش هنگام ساخت/ویرایش؛ خواندن relational با fallback محدود برای schema قدیمی و authoring issueها.
- [x] بذرهای فعلی فقط یک‌بار درج می‌شوند؛ پس از آن، ویرایش مدیر با بذر کد overwrite نمی‌شود.
- [x] attempt جدید به `pack_version_id` دقیق متصل می‌شود؛ نسخهٔ پیش‌نویس پیش از bind immutable می‌شود و خواندن attempt جاری از همان version id انجام می‌گیرد.
- [x] تست رفت‌وبرگشت دو seed، برابری نتیجهٔ scoring و نگه‌داری effectهای مستقل؛ در جمع‌بندی فعلی هر ۹۰ تست کلی پاس‌اند.
- [ ] replay واقعی روی PostgreSQL و تست تراکنش/FK/trigger در DB هنوز انجام نشده است.

### گام ۳ — مدل پاسخ و امتیازدهی چنداثری

- [x] نوع‌های runtime و sanitizer برای parameter، response rule و effect مستقل با operation allowlist؛ بدون `eval`.
- [x] موتور چنداثری، پوشش سؤال و اعتبارسنجی نهایی سؤال/نوع پاسخ/گزینه/بازه/ارجاع/نوع پارامتر/operation/value/coefficient.
- [x] تطبیق قطعی: effectهای عمومی سؤال اول اجرا می‌شوند؛ سپس فقط اولین rule مشخصِ مطابق پاسخ، یا fallback، و effectهای مستقل همان rule.
- [x] semantics: `identity`/`reverse` انتقال پاسخ مقیاسی/گزینه‌ای سازگار، `set_value` جایگزینی، `add` جمع ثابت، `multiply` ضرب انباشته با seed قبلی در همان مسیر، و `weighted_value` جمع پاسخ مقیاسی در ضریب.
- [x] UI ویرایش پارامتر، ruleهای گزینه‌ای/مقداری/بازه‌ای/fallback و چند effect مستقل، متصل به تب ویرایشگر آزمون.
- [x] migration 0038 پارامترها، ruleها و effectهای معتبر را backfill می‌کند؛ موردهای نامعتبر/تکراری را در `analyzer_pack_authoring_issues` ثبت می‌کند تا مسیر fallback امن حفظ شود.
- [x] تست‌های چنداثری، operationها، ورودی نامعتبر، fallback/ترتیب قطعی و برابری scoring برای packهای بدون rule/effect.
- [x] قرارداد `AnalyzerPack` از مسیر mapper دوطرفه به جداول relational وصل است؛ JSONB منبع fallback/compat باقی می‌ماند.
- [ ] replay واقعی migration روی PostgreSQL و smoke-test UI در مرورگر؛ هنوز اجرا نشده‌اند.

### گام ۴ — انتشار نسخه و snapshot گزارش

- [x] پیش‌نویس نسخهٔ قابل‌ویرایش، ایجاد snapshot تازه هنگام ویرایش و pointer نسخهٔ جاری؛ نسخهٔ منتشرشده در API/DB overwrite نمی‌شود.
- [x] بارگیری pack دقیق attempt برای خواندن/پیش‌نمایش/تبدیل؛ نسخهٔ report-config، قالب انتخاب‌شده و مدل کامل سند (از جمله داده‌های تشخیصی رندرشده) هنگام تولید ذخیره می‌شوند، اگر ستون‌های متناظر در DB موجود باشند.
- [x] hydrate ابتدا snapshot کامل سند را می‌خواند؛ دادهٔ خراب یا schema قدیمی به مسیر سازگار لایه‌ها/اکشن‌ها برمی‌گردد.
- [x] migration 0039 ستون `document_snapshot` را می‌افزاید و در `src/db/migration-files.ts` ثبت شده است.
- [x] تست round-trip/parity نشان می‌دهد سند ذخیره‌شده پس از تغییر تنظیم گزارش و قالب pack از خروجی تاریخی مستقل می‌ماند.
- [x] trigger PostgreSQL و لایهٔ نوشتن از تغییر نسخهٔ منتشرشده جلوگیری می‌کنند.

### گام ۵ — cutover و پاک‌سازی سازگاری

- حذف اتکای authoring/runtime به ستون کامل `analyzer_packs.pack` پس از مقایسهٔ parity و backfill کامل.
- حذف دادهٔ محتوایی seed از Git، در عین حفظ موتور عمومی و هر منطق تخصصی‌ای که واقعاً کد اجرایی است.
- نگه‌داشتن جدول‌های تجاری، grants، attempt ledger و گزارش به‌صورت جدا و بدون تغییر قواعد مصوب.

#### پیش‌نیازهای ایمنی گام ۵ — هنوز فقط static audit

- `authored.ts` و `relational-store.ts` هنوز مسیر fallback به projection قدیمی `analyzer_packs.pack` دارند؛ تا وقتی parity و وضعیت ردیف‌های واقعی DB تأیید نشود، این مسیر حذف نمی‌شود.
- `registry.ts` و `ssot-registry.ts` از seedهای pack برای تست، fallback بدون DB و تفسیر تخصصی استفاده می‌کنند. حذف محتوای seed بدون طراحی جایگزین می‌تواند شرط «صفحهٔ عمومی بدون DB بالا بیاید» را نقض کند؛ بنابراین حذف آن هنوز مجاز/ایمن نیست.
- `scripts/apply-migrations.mjs` در صورت pending بودن `0037_rebuild_schema_from_migrations.sql` با `--allow-destructive-reset` کل `public` را `DROP SCHEMA ... CASCADE` می‌کند و همهٔ migrationها را از نو replay می‌کند. `liara_pre_start.sh` در HEAD این flag را می‌فرستد و push به `main`، workflow deploy را فعال می‌کند؛ پس push فعلی می‌تواند این reset را روی DB متصل به production اجرا کند. وضعیت ledger آن DB بررسی نشده؛ تا تأیید صریح اجرای migration/reset روی target مشخص، push-deploy اجرا نشود.
- پیش از cutover واقعی باید target DB دقیق و وضعیت ledger بررسی شود، backup/restore تأیید شود، شمار attempt/reportهای bindنشده و issueهای backfill اندازه‌گیری شوند و parity ردیف‌های relational با pack/scoring/document قدیمی در همان DB ثابت شود.
- تا انجام این بررسی‌های DBمحور و مجوز صریح برای target مشخص، گام ۵ صرفاً preflight مستند است؛ ستون projection، fallbackها، seedها و قواعد تجاری دست‌نخورده می‌مانند.

## وضعیت این نوبت

- گام‌های ۱ تا ۴ در فایل‌های محلی پیاده‌سازی شدند؛ ۹۱ تست پاس، `npm run typecheck`، ESLint هدفمند و `git diff --check` موفق‌اند.
- conversion و خواندن/پیش‌نمایش attempt مشخص از نسخهٔ دقیق ثبت‌شده روی attempt استفاده می‌کنند؛ اگر نسخهٔ تاریخی قابل‌بازیابی نباشد یا قالب با همان نسخه سازگار نباشد، آن attempt با pack جاری تفسیر/تبدیل نمی‌شود. فهرست workspace نیز تفسیر زنده را برای نسخهٔ نامنطبق با pack جاری پنهان می‌کند تا خروجی اشتباه نمایش داده نشود.
- گزارش جدید در صورت وجود ستون‌ها `pack_version_id`، `report_config_snapshot` و `document_snapshot` را ذخیره می‌کند؛ hydrate snapshot کامل را ترجیح می‌دهد و برای schema قدیمی/دادهٔ نامعتبر از مسیر legacy استفاده می‌کند.
- migrationهای 0038 و 0039 و رجیستری ۴۰ migration در workspace موجودند، اما SQL روی PostgreSQL اجرا/replay نشده؛ trigger/FK و backfill روی DB واقعی تأیید نشده‌اند.
- preflight گام ۵ فقط به‌صورت static انجام شد: fallback JSONB و seedهای لازم برای حالت بدون DB باقی‌اند؛ migration runner در صورت pending بودن 0037 مسیر reset مخرب دارد. هیچ DBای برای سنجش وضعیت ledger/parity بررسی یا تغییر داده نشد.
- build و smoke-test UI در مرورگر اجرا نشده‌اند.
- تغییرات موجود و نامرتبط workspace (`liara_pre_start.sh`, `liara_post_build.sh`, `docs/`, `google_drive/`) حفظ شدند.
- push و deploy انجام نشده‌اند؛ اجرای migration روی هر دیتابیس نیز نیازمند مجوز جداگانه است.
