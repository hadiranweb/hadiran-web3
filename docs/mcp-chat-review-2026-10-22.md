# بررسی پلن «سرور MCP دوحالتهٔ چت» در برابر مخزن واقعی + پلن اجرا

مبنای بررسی: فایل ارسالی کاربر (۲۰۲۶-۱۰-۲۲) خوانده شد و تک‌تک ارجاع‌هایش با کد فعلی سنجیده شد.
نتیجه: اسکلت پلن درست است (مرز انتشار عمومی، Fail-soft، رمزنگاری کلید با `secret.ts`، قرارداد `/api/chat`)؛
اما شش انحراف از واقعیت مخزن دارد که قبل از ساخت اصلاح شدند:

| # | پلن می‌گوید | واقعیت مخزن | تصمیم |
|---|---|---|---|
| ۱ | مایگریشن `0030_mcp_chat_control.sql` | `0030` = `content_control` و `0031` = روبان؛ هر دو موجودند | مایگریشن MCP = **`0032_mcp_chat_control.sql`** |
| ۲ | `requireApiOwner` / `getCurrentSessionAccount` | نام‌های واقعی: `requireOwner` و `getCurrentAccount` در `src/lib/auth/guard.ts` و `session.ts` | همان نام‌های واقعی |
| ۳ | ابزار روی جدول `analyzers` | جدول آینه نداریم؛ آینه = پک در رجیستری (`loadAnalyzers()` در `catalog.ts`) | ابزار اکوسیستم آینه را از `loadAnalyzers` می‌خواند |
| ۴ | ورودی ابزارها با Zod Schema | `zod` در `package.json` نیست؛ lockfile قفل است | تایپ + اعتبارسنجی دستی؛ وابستگی تازه‌ای اضافه نمی‌شود |
| ۵ | `get_audience_context` با `conversationId` و حساب | `conversations` ستون `account_id` ندارد و نباید از کلاینت حساب گرفت | تاریخچه فقط با `conversationId`؛ پروفایل/گزارش آینه فقط از سشن سرور (`getCurrentAccount`) |
| ۶ | سندباکس: «شبیه‌سازی یکی از حساب‌های تستی» | جعل زمینهٔ حساب دیگر = نشت بالقوه | سندباکس فقط با زمینهٔ خودِ owner اجرا می‌شود |

نکات تأییدشدهٔ پلن که عیناً نگه داشته شدند:
- لایه‌های مقاله (`lineFa/questionFa/rootFa/firstStepFa/closingQuestionFa/closingOptions`) واقعاً روی جدول `knowledge` هستند (مایگریشن `0025`).
- `analyzer_reports` ستون‌های `maturityLabel/bottleneckName/bottleneckScore/coverTitle` و `analyzer_report_layers` ستون‌های `asIsText/toBeText/isBottleneck` را دارد.
- مرز انتشار: `publicKnowledgeFilter/publicKnowledgeJoin` خانه‌اش `src/lib/public/policy.ts` است (از `lib/knowledge/public.ts` re-export می‌شود).
- کلید LLM فقط با `sealSecret/openSecret` (`src/lib/bots/secret.ts`) و نمایش `tokenHintOf`.
- قرارداد `/api/chat` یعنی `{ answer, references, related, conversationId }`؛ فیلد `modeUsed` اختیاری اضافه می‌شود و `HomeChat` فیلد ناشناخته را نادیده می‌گیرد.

## انتخاب نسخهٔ پروتکل برای برش ۵

دیپ‌سرچ مشخصات MCP (۲۰۲۶-۱۰-۲۲): نسخهٔ `2026-07-28` هندشیک `initialize` و سشن را حذف کرده،
اما نسخهٔ مستقر و پرکاربرد در کلاینت‌ها هنوز چرخهٔ `2025-11-25` با `initialize` است
([مشخصات انتقال](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports)،
[چرخهٔ عمر](https://modelcontextprotocol.io/specification/2025-11-25/basic/lifecycle)).
تصمیم: اندپوینت `/api/mcp` چرخهٔ `2025-11-25` را پیاده می‌کند (`initialize`، `ping`، `tools/list`، `tools/call`،
`resources/list`، `resources/read`، `prompts/list`، `prompts/get`)، مذاکرهٔ نسخه انجام می‌دهد و بدون هندشیک هم
(Stateless) درخواست را می‌پذیرد. پیش‌فرض خاموش است و فقط با توکن Bearer صاحب سایت روشن می‌شود.

## ترتیب اجرا (هر برش گیت جدا دارد)

۱. داده و تنظیمات: مایگریشن `0032` + اسکیما + `lib/mcp/types.ts` + `lib/mcp/config.ts` (Fail-soft کامل).
۲. ابزارها + زمینهٔ مخاطب + موتور لوکال (`tools.ts`، `context.ts`، `local-composer.ts`).
۳. موتور LLM (فقط اندپوینت سازگار با OpenAI Chat Completions؛ Anthropic بومی ادعا نمی‌شود) + ارکستریتور + اتصال `/api/chat`.
۴. میز مدیریت `/workspace/mcp` (APIهای owner + صفحه + `McpControlDesk` + لینک در `WorkspaceChrome`).
۵. اندپوینت بیرونی `/api/mcp` (پیش‌فرض خاموش).

قواعد ثابت این ساخت: مایگریشن را ایجنت اجرا نمی‌کند (فقط فایل می‌سازد و `migration-files.ts` را بازتولید می‌کند)؛
`env` و توکن دست نمی‌خورد؛ گیت `typecheck`/`eslint`/`build` بعد از هر برش؛ دیپلو فقط با دستور صریح.

## نتیجهٔ اجرا (۲۰۲۶-۱۰-۲۲، شش کامیت روی main محلی — پوش نشده)

| برش | کامیت | چه شد |
|---|---|---|
| ۱ داده و تنظیمات | `341f253` | مایگریشن `0032_mcp_chat_control.sql` + اسکیما + `migration-files.ts` (۳۳ فایل) + `types.ts`/`config.ts` با Fail-soft کامل و کلید فقط cipher+hint |
| ۲ ابزار و لوکال | `7b6291d` | `tools.ts` (مرز انتشار عمومی)، `context.ts` (سشن سرور فقط)، `local-composer.ts` (لایه‌ها + سبک‌ها + گلوگاه)؛ ۷ تست |
| ۳ LLM و ارکستریتور | `1b8f834` | `llm-runner.ts` (fetch + تایم‌اوت، بدون SDK)، `orchestrator.ts`، اتصال `/api/chat` با `modeUsed` افزوده و قرارداد قبلی سالم |
| ۴ میز مدیریت | `5c1ae23` | `/workspace/mcp` + سه API owner-only + `McpControlDesk` (نوار وضعیت، اتصال، مخاطب/منابع، وزن‌ها، قالب‌ها، قوانین موضوعی، سندباکس دوحالته) + لینک در `WorkspaceChrome` |
| ۵ اندپوینت بیرونی | `edec539` | `/api/mcp` JSON-RPC (initialize/ping/tools/resources/prompts)، پیش‌فرض خاموش، Bearer صاحب سایت؛ ۶ تست |
| اصلاح | `158e1ad` | پاسخ «اتصال برقرار نیست» پیشنهاد آینه نمی‌دهد |

**گیت‌ها:** `tsc --noEmit` سبز · `eslint .` صفر · `next build` exit 0 (هر پنج مسیر تازه در خروجی بیلد ثبت شدند) ·
تست‌ها: ۲۹/۲۹ (tsx) + ۱۷/۱۷ (node) شامل ۱۳ تست تازهٔ MCP.

**تأییدشده در محیط بدون DB (سرور واقعی روی پورت 3000):**
- `POST /api/chat` ← ۲۰۰ با پاسخ قبلیِ «اتصال دانش برقرار نیست» + `modeUsed: "local"` (Fail-soft و سازگاری قرارداد).
- `POST /api/mcp` ← ۴۰۴ (خاموش به‌صورت پیش‌فرض). `POST /api/workspace/mcp/preview` بدون ورود ← ۴۰۱. `GET /workspace/mcp` ← 307 به `/signin`. خانه ← ۲۰۰.

**هنوز آزمون‌نشده (نیازمند DB واقعی و کلید):**
- اجرای مایگریشن `0032` (با توست، نه ایجنت) — تا آن موقع میز روی پیش‌فرض ایمن کار می‌کند و ذخیره خطای روشن می‌دهد.
- چرخهٔ کامل با DB: بازیابی لایه‌ها، قانون موضوع، سطح `mirror_insights` و خواندن گلوگاه از `analyzer_reports`.
- حالت LLM با کلید معتبر و تست قطع کلید (Fallback با ۲۰۰) — منطق و تست واحد دارد، اجرای زنده ندارد.
- کلیک واقعی در UI میز مدیریت با حساب owner.

**چک‌لیست پذیرش پلن — وضعیت صادقانه:** تست لوکال/عدم نشت/دادهٔ مخاطب/امنیت کلید در سطح کد و تست واحد پوشش
دارند اما «پاس» نهایی‌شان فقط بعد از یک نوبت اجرای زنده با DB و مایگریشن 0032 معتبر است؛ تست LLM و Fail-soft
زنده هم همان‌جا انجام می‌شود.
