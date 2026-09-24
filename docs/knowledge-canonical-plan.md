# پلن لایهٔ canonical دانش — هادیران

وضعیت: **قفل برنامه‌ریزی؛ هنوز کد نشده.**  
تاریخ: ۲۰۲۶-۰۹-۲۴  
منبع قرارداد: `knowledge-base-transfer-v0.1`  
منبع جهان‌ها: `docs/ia-seo-map.md` و قفل‌های همین چت  
الهام ویرایشگر: کاغذ‌و‌باد (فقط UX ثبت مارکداون؛ استک/نام/مسیر کپی نمی‌شود)

---

## ۰. هدف

شما در میز owner مارکداون می‌نویسید. آن متن **ثبت خام** است تا وقتی صریحاً ارتقا شود. صفحهٔ `/knowledge/[slug]` و چت فقط از دانش تأییدشدهٔ عمومی تغذیه می‌شوند.

```text
Raw Capture ≠ Knowledge
Claim ≠ Approved Memory
Publication ≠ Canonical Source
```

```text
Capture → SemanticRecord → Claim → Review+Promotion (یک اقدام owner)
       → MemoryItem → Projection (/knowledge/[slug] و در صورت نیاز جهان‌های دیگر)
```

این پلن «محتوای واقعی» را ممکن می‌کند بدون seed ساختگی و بدون دست‌زدن به لایهٔ سبز استقرار.

---

## ۱. قفل‌ها (دست نزن)

| قفل | مقدار |
|---|---|
| SoT | PostgreSQL + Drizzle؛ مارکداون قالب ثبت است نه ریپوی موازی |
| جهان‌ها | `/` گفتگو، `/ecosystem` نقشه، `/hadiran` شخص، دانش/آزمایشگاه/آکادمی، `/topics` پل |
| `/about` | ساخته نمی‌شود |
| پلتفرم | Next، App `hadiranweb`، بدون Dockerfile / LiveKit / درایو |
| CI/CD | `ci.yml` و هوک‌های سبز دست نخورند؛ docs-only دیپلوی نمی‌سازد |
| کاغذ | فقط split مارکداون/پیش‌نمایش؛ Fastify/AI/ورکر نه |
| seed.ts فعلی | روی پرود اجرا نشود؛ wipe ممنوع |
| افزونهٔ سازمانی بسته | multi-tenant، grant، pack، metering در نسخهٔ اول نه |
| زیپ اکوسیستم v1 | منبع موازی نیست |

جدول‌های فعلی (`knowledge`, `person`, `projects`, `courses`, `topics`, OTP) **حذف یا بازنویسی کامل نمی‌شوند.** لایهٔ جدید کنارشان است.

---

## ۲. جواب سؤال‌های هستی‌شناسی (قفل)

1. **Writer canonical:** یک لایه در DB. ویرایشگر به DB می‌نویسد. صفحه و چت projectionاند.
2. **میز نوشتن:** `/workspace` noindex، فقط `owner`، خارج از نوار اصلی. لینک بعد از ورود.
3. **چرخه:** حالت‌ها می‌مانند. نقش دوم نیست. یک دکمهٔ «ارتقا / انتشار» هم Review می‌سازد هم Promotion (lineage، نه overwrite خام).
4. **دو منبع:** قرارداد دانش = زیپ transfer؛ جهان‌ها = IA فعلی.

---

## ۳. نگاشت موجودیت‌ها

| بستهٔ transfer | هادیران |
|---|---|
| SemanticRecord | پیش‌نویس ثبت‌شده در workspace |
| KnowledgeClaim | گزارهٔ استخراج‌شده از همان ثبت (حداقل: یک claim از عنوان+نیت) |
| KnowledgeReview + KnowledgePromotion | همان اقدام ارتقای owner |
| MemoryItem | دارایی canonical تأییدشده |
| GraphEdge | بعد از MemoryItem؛ `published_as` به ردیف دانش |
| Projection `article` | ردیف `knowledge` موجود (`slug`, `title_fa`, `body_fa`, …) |
| person / project / course / topic | فعلاً همان جدول‌های جهان؛ اتصال memory با یال در برش‌های بعدی |

در برش اول **فقط** مسیر دانشنامه به‌عنوان projection مقاله. شخص و آزمایشگاه و دوره را از همین میز بازنویسی نمی‌کنیم.

ستون اتصال (بدون شکستن جدول قدیم):

```text
knowledge.memory_item_id   nullable FK
knowledge.ai_indexable     فقط اگر MemoryItem.visibility=public و lifecycle=approved
```

چت و فهرست عمومی: ردیفی که `memory_item_id` ندارد یا memory تأیید/عمومی نیست **بازیابی نشود**. دیتابیس پرود الان خالی است؛ backfill لازم نیست.

---

## ۴. حداقل schema موازی (برش داده)

جدول جدید — نام پایدار انگلیسی، توضیح فارسی در کامنت SQL:

```text
semantic_records
knowledge_claims
knowledge_reviews
knowledge_promotions
memory_items
graph_edges
evidence_sources      (می‌تواند خالی بماند تا شواهد جدا بیاید)
provenance_records
```

هر رکورد مهر عمومی را به‌صورت ستون دارد (از `record-stamp`):  
`id` متن پایدار (`SR-…`)، `title_fa`, `slug` اختیاری، `status`, `visibility`, `intent`, `summary_fa`, `owner_id` → `accounts.id`, `created_at`, `updated_at`, `schema_version`.

بدنهٔ مارکداون: `semantic_records.body_fa` (text). MemoryItem پس از ارتقا `content` jsonb یا `body_fa` کپی‌شده + lineage به claim.

**نمی‌سازیم در برش اول:** جدول جدا برای episodic, artifact, revision, projection, knowledge_packs. Projection همان `knowledge`. Revision = ردیف جدید + `supersedes` در صورت نیاز بعدی.

Vocabulary (`taxonomy/` زیپ) به‌صورت ثابت در کد (`src/lib/knowledge/vocabulary.ts`) نه CMS جدا. مقدار جدید فقط با الگوی تکرارشونده.

مهاجرت: `src/db/migrations/0005_canonical_knowledge.sql` + ثبت در `migration-files.ts` مثل قبل. `db:push` پرود ممنوع. هوک استارت موجود فایل را اعمال می‌کند. **migrate در next build اجرا نمی‌شود** (قفل فعلی instrumentation).

---

## ۵. معماری اطلاعات `/workspace`

جهان پنجم نیست. `robots`: `Disallow: /workspace`. sitemap ندارد.

```text
/workspace                      صندوق: captured / pending_review / approved
/workspace/capture              ثبت جدید (ویرایشگر مارکداون)
/workspace/records/[id]         ویرایش ثبت + ارتقا / رد
```

گارد: نشست + `role=owner`. عضو (`member`) ۴۰۳. بدون OTP روی لیارا این میز در پرود باز نمی‌شود — همان ترتیب قبلی: SMS بعداً؛ توسعه با کد dev مجاز است.

`/knowledge/new` و `/knowledge/[slug]/edit`: بعد از برش UI، owner را به workspace می‌برند (ریدایرکت). دیگر مستقیم در جدول `knowledge` نمی‌نویسند. نیت URL حفظ می‌شود: میان‌بر نوشتن، نه CMS موازی.

ناوبری عمومی عوض نمی‌شود. بعد از ورود، یک لینک «میز کار» فقط برای owner (مثلاً در منوی حساب / کنار خروج).

---

## ۶. ویرایشگر (الهام کاغذ، مال هادیران)

الگو: دو ستون یا تب — مارکداون / پیش‌نمایش (`MarkdownReadonly` موجود). ذخیره بدون انتشار.

حداقل فیلدهای ثبت (قالب مهر؛ بقیه اختیاری):

```yaml
title_fa
intent
body_fa          # مارکداون
status: captured
visibility: private   # پیش‌فرض؛ هنگام ارتقا می‌تواند public شود
```

اسلاگ عمومی فقط هنگام ارتقا ساخته می‌شود (`slugify` موجود). ثبت خام می‌تواند بدون slug بماند.

`KnowledgeComposer` فعلی برای نوشتن مستقیم projection است. در برش UI یا جمع می‌شود داخل capture، یا capture جدا می‌ماند و composer فقط preview. **نام کاغذ در UI نیست.**

یک اقدام مخرب نیست: ذخیره = captured. «ارتقا / انتشار» جدا، با تأیید.

ارتقا اگر `visibility=public`:

1. Claim (اگر نیست) از عنوان + نیت
2. Review `approve` + Promotion
3. MemoryItem `lifecycle=approved`
4. Upsert `knowledge` به‌عنوان projection + یال `published_as`
5. Redirect به `/knowledge/[slug]` برای دیدن نمود — یا ماندن در workspace

اگر هنوز private: MemoryItem ساخته می‌شود اما فهرست/چت عمومی آن را نمی‌بینند.

---

## ۷. بازیابی و چت

امروز: ILIKE روی `knowledge`. بعد از برش:

```text
Identity → owner/public
  → knowledge.memory_item_id IS NOT NULL
  → memory.lifecycle = approved
  → memory.visibility = public  (برای مهمان و چت خانه)
  → سپس lexical فعلی
```

`candidate` / `pending_review` / `rejected` وارد چت نمی‌شوند.

---

## ۸. برش‌های ساخت (ترتیب اجرا)

هر برش جدا merge می‌شود. docs-only دیپلوی ندارد. برش schema دیپلوی لیارا دارد — بدون `[no-cache]` مگر کش دوباره ۱۲ دقیقه سکوت کند.

### برش ۰ — همین سند

پذیرش پلن. کد نه.

### برش ۱ — قرارداد در مخزن

کپی تطبیق‌شدهٔ vocabulary و مهر در `docs/knowledge-base/` (از زیپ، با نام هادیران نه کاغذ). بدون import استک. بدون UI.

### برش ۲ — داده

- SQL `0005_canonical_knowledge.sql`
- Drizzle models موازی
- `knowledge.memory_item_id`
- چت/فهرست عمومی: فیلتر بالا (پرود خالی است؛ رفتار عمومی عوض می‌شود اما محتوا نیست)

گیت typecheck/build باید سبز بماند.

### برش ۳ — میز `/workspace` + capture

- صفحات noindex
- گارد owner
- ذخیره SemanticRecord
- لینک owner در ناو/خروج
- ریدایرکت `/knowledge/new` → `/workspace/capture`

هنوز انتشار عمومی از این میز نیست مگر برش ۴.

### برش ۴ — ارتقا و projection

- دکمهٔ ارتقا در `/workspace/records/[id]`
- ساخت claim/review/promotion/memory/edge
- upsert `knowledge`
- `/knowledge/[slug]` همان UI فعلی را می‌خواند

### برش ۵ — صندوق و فیلتر چت

- لیست وضعیت‌ها در `/workspace`
- قفل بازیابی چت روی memory عمومی

### عمداً عقب (بعد از نوشتن واقعی شما)

- یال به `topics` / `projects` / `person`
- ثبت شخص و دوره از workspace
- شواهد جدا، episodic، revision کامل
- OG تصویر
- SMS.ir روی کنسول (پیش‌نیاز پرود برای owner واقعی)

---

## ۹. مؤثر / متاثر

| برش | مؤثر | متاثر |
|---|---|---|
| ۲ schema | migrate استارت لیارا | هوک موجود؛ بیلد next نباید DB باز کند |
| ۳ workspace | مسیرهای noindex جدید | گارد OTP؛ Nav فقط لینک owner |
| ۴ ارتقا | ردیف `knowledge` | صفحات دانش فعلی؛ شمارندهٔ `/ecosystem` |
| ۵ چت | پاسخ خانه | `/api/chat`؛ دانش تأییدنشده دیده نشود |
| هیچ برش | `ci.yml`، آلمان، `--no-cache` همیشگی، seed wipe | لایهٔ سبز |

---

## ۱۰. پذیرش

- [ ] `/workspace` بدون owner به ورود می‌رود؛ در sitemap/robots ایندکس نیست
- [ ] ذخیرهٔ ثبت، `/knowledge` و چت را عوض نمی‌کند
- [ ] ارتقای public یک `/knowledge/[slug]` می‌سازد؛ HTML اولیه عنوان و بدنه دارد
- [ ] ثبت `captured` در چت نمی‌آید
- [ ] `seed.ts` قدیمی اجرا نشده؛ wipe نشده
- [ ] نوار اصلی جهان جدید ندارد
- [ ] نام کاغذ در UI/مسیر نیست
- [ ] یک ورودی واقعی مسیر کامل زیپ را طی کند: Capture → Record → Claim → Review → Promotion → Memory → Edge → Projection

---

## ۱۱. خارج از این پلن

LiveKit، درایو، زرین‌پال، `/fa`/`/en`، داشبورد چندنقشی، اجرای seed ساختگی، بازنویسی IA جهان‌ها، کپی Appهای `kaghazbaad-*`.
