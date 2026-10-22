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
