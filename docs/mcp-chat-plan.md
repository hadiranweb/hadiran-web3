# پلن معماری و پیاده‌سازی سرور MCP دوحالتهٔ چت هادیران

وضعیت: **پلن اجرایی برای تیم توسعه (برش ۰ — تصمیم و طراحی؛ بدون تغییر کد در این مرحله)**  
تاریخ: ۲۰۲۶-۱۰-۲۲  
مخزن هدف: `hadiranweb/hadiran-web3`  
پیش‌نیازها و مراجع: `docs/knowledge-canonical-plan.md`، `docs/workspace-shell-plan.md`، `src/lib/ai.ts`، `src/lib/public/policy.ts`، `src/lib/bots/secret.ts`

```text
یک کاتالوگ ابزار (MCP) = دو موتور اجرا (لوکال قطعی + LLM متصل)
خرابی یا نبود LLM = بازگشت خودکار و بی‌وقفه (Fail-soft) به موتور لوکال
ثبت خام (Captured) و دادهٔ خصوصی = هرگز وارد چت عمومی یا پرامپت نمی‌شوند
کنترل رفتار، وزن موضوعات و سطح دادهٔ مخاطب = در میز کار (/workspace/mcp) فقط برای owner
```

---

## ۰. هدف و تعریف مسئله

در چت خانهٔ هادیران (`/` و `/api/chat`) دو حالت پاسخ‌گویی وجود دارد:

1. **حالت لوکال (بدون دخالت LLM — Deterministic / Template Mode):** بازیابی مستقیم از پایگاه داده و ساخت پاسخ ساختاریافته از روی دانشنامه، موضوعات، پروژه‌ها، دوره‌ها و آینه‌ها بدون نیاز به کلید یا سرویس هوش مصنوعی بیرونی.
2. **حالت متصل به LLM (LLM-Assisted Mode):** خواندن همان منابع تاییدشدهٔ دانشنامه و زمینهٔ مخاطب، و تولید پاسخ تحلیلی، شخصی‌سازی‌شده و متناسب با مسئلهٔ کاربر توسط مدل زبانی.

**هدف این پلن:** طراحی و پیاده‌سازی یک **سرور و لایهٔ استاندارد MCP (Model Context Protocol)** درون خودِ برنامهٔ Next.js که:
- بین هر دو حالتِ **لوکال** و **LLM** مشترک باشد (ابزارها، منابع و قالب‌های موضوعی فقط یک بار تعریف شوند)؛
- از داخل **بخش مدیریت سایت (`/workspace/mcp`)** توسط `owner` کنترل و تنظیم شود؛
- بر اساس **موضوع (`topic`)** و **دادهٔ مجاز مخاطب (`account` / `analyzer_reports` / `conversations`)**، پاسخ و مسیر پیشنهادی بعدی را شخصی‌سازی کند؛
- و یک اندپوینت استاندارد **`/api/mcp`** (Streamable HTTP) نیز برای اتصال کلاینت‌ها و ایجنت‌های استاندارد MCP فراهم کند.

---

## ۱. قفل‌ها و اصول تغییرناپذیر (دست نزن)

تیم توسعه در تمام برش‌ها ملزم به رعایت این قفل‌هاست:

| قفل | قانون الزامی |
|---|---|
| **مرز انتشار عمومی** | تمام کوئری‌های دانش در MCP **باید** از `publicKnowledgeJoin` و `publicKnowledgeFilter` در `src/lib/public/policy.ts` (`memory_items.lifecycle = 'approved'` و `visibility = 'public'` و `knowledge.ai_indexable = true`) عبور کنند. هیچ رکورد `semantic_records` خام وارد چت نمی‌شود. |
| **پایداری و Fail-soft** | اگر حالت روی `llm` باشد ولی کلید API تنظیم نشده باشد، سرویس LLM تایم‌اوت بخورد، یا خطای شبکه/سهمیه رخ دهد، سیستم **بدون برگرداندن خطای ۵۰۰ به کاربر**، در همان درخواست به موتور لوکال (`local-composer`) سوییچ می‌کند. |
| **حریم خصوصی مخاطب** | دادهٔ مخاطب (نام، خلاصهٔ گزارش آینهٔ عارضه‌یابی و گلوگاه) **فقط** از نشست معتبر کوکی `hadiran_session` در سمت سرور (`getCurrentSessionAccount`) خوانده می‌شود — هرگز از پارامتر ارسالی کلاینت در body خوانده نمی‌شود. |
| **امنیت کلید LLM** | کلید API مدل زبانی در دیتابیس به‌صورت متن خام ذخیره نمی‌شود؛ صرفاً با مکانیزم AES-256-GCM موجود در `src/lib/bots/secret.ts` (`sealSecret` / `openSecret`) رمزنگاری و تنها ۴ کاراکتر آخر (`apiKeyHint`) نمایش داده می‌شود. |
| **قرارداد پاسخ `/api/chat`** | ساختار JSON خروجی `/api/chat` (`{ answer, references, related, conversationId }`) باید کاملاً Backward-compatible بماند تا `src/components/HomeChat.tsx` بدون شکستن کار کند (فیلدهای تکمیلی مثل `modeUsed` یا `followUpQuestions` به‌صورت اختیاری اضافه می‌شوند). |
| **زیرساخت و CI/CD** | تک‌برنامهٔ Next.js روی پورت `3000` (`liara.json`) حفظ می‌شود. سرویس یا پورت جدا ساخته نمی‌شود. `.github/workflows/ci.yml` دست نمی‌خورد. در زمان `next build` هیچ اتصالی به دیتابیس یا LLM برقرار نمی‌شود. |
| **دسترسی مدیریت** | صفحات `/workspace/mcp*` و `/api/workspace/mcp*` دارای `robots: { index: false, follow: false }` هستند و با گارد `requirePageOwner` / `requireApiOwner` فقط برای نقش `owner` باز می‌شوند. |

---

## ۲. معماری کلان: هستهٔ واحد MCP در دو حالت اجرای چت

به‌جای دو کدبیس جدا برای «چت لوکال» و «چت LLM»، معماری به صورت **سه‌لایه** طراحی می‌شود:

```text
                         [ درخواست POST /api/chat ]
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ لایه ۱: کنترلر و سیاست‌گذار MCP (src/lib/mcp/orchestrator.ts)            │
│  1. خواندن تنظیمات فعال از جدول mcp_configs (حالت، وزن‌ها، سقف داده)    │
│  2. استخراج امن نشست مخاطب (Guest vs Logged-in Account)                 │
│  3. تشخیص موضوعات پیام (Topic Matching) و بارگذاری قانون موضوع          │
│     از جدول mcp_topic_rules                                             │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ لایه ۲: اجرای ابزارها و منابع استاندارد MCP (src/lib/mcp/tools/*)       │
│  • mcp.tool.search_knowledge    (با لایه‌های rootFa, firstStepFa, ...)   │
│  • mcp.tool.search_ecosystem    (پروژه‌های آزمایشگاه، دوره‌ها، آینه‌ها)   │
│  • mcp.tool.resolve_topic_graph (موضوعات + یال‌های ۱-hop)               │
│  • mcp.tool.get_audience_context(خلاصهٔ وضعیت مخاطب طبق سطح مجاز ادمین) │
└───────────────────┬─────────────────────────────────┬───────────────────┘
                    │                                 │
      [حالت ۱: موتور لوکال قطعی]            [حالت ۲: موتور متصل به LLM]
   (وقتی mode = 'local' یا Fallback)         (وقتی mode = 'llm' یا 'hybrid')
                    │                                 │
                    ▼                                 ▼
┌───────────────────────────────────┐ ┌───────────────────────────────────┐
│ src/lib/mcp/local-composer.ts     │ │ src/lib/mcp/llm-runner.ts         │
│ • چیدمان پاسخ از روی قالب موضوع   │ │ • ساخت System Prompt از روی       │
│ • استفاده از لایه‌های مقاله:       │ │   Prompt استاندارد MCP + قانون    │
│   lineFa + rootFa + firstStepFa   │ │   موضوع + زمینهٔ مخاطب             │
│ • افزودن گرهٔ شخصی مخاطب (اگر در   │ │ • ارسال خروجی ابزارهای MCP و      │
│   گزارش آینه گلوگاهی ثبت شده)     │ │   امکان Tool-Calling تکمیلی       │
│ • افزودن سؤال گام بعد             │ │ • در صورت خطا/تایم‌اوت: سوییچ به  │
│   (closingQuestionFa)             │ │   local-composer در همان درخواست  │
└───────────────────┬───────────────┘ └───────────────┬───────────────────┘
                    └─────────────────┬───────────────┘
                                      ▼
       [ ذخیره در conversations/messages + ارسال پاسخ و ارجاع‌ها ]
```

---

## ۳. کاتالوگ استاندارد MCP (Tools، Resources و Prompts)

تمام قابلیت‌های بازیابی و زمینه‌سازی در قالب موجودیت‌های استاندارد MCP تعریف می‌شوند تا هم در داخل `/api/chat` (به‌صورت In-Process و بدون سربار شبکه) و هم روی اندپوینت `/api/mcp` قابل فراخوانی باشند:

### الف) ابزارها (MCP Tools)

| نام ابزار (Tool Name) | ورودی (Zod Schema) | خروجی ساختاریافته | کاربرد در لوکال و LLM |
|---|---|---|---|
| `search_knowledge` | `{ query: string, topicSlug?: string, limit?: number }` | فهرست مقالات تاییدشدهٔ عمومی شامل: `slug`, `titleFa`, `summaryFa`, `lineFa`, `questionFa`, `rootFa`, `firstStepFa`, `closingQuestionFa`, `closingOptions` | **لوکال:** استخراج مستقیم جملات کلیدی مقاله برای ساخت پاسخ چندبخشی.<br>**LLM:** تغذیهٔ دقیق مدل با محتوای واقعی مقاله برای جلوگیری از توهم (Hallucination). |
| `search_ecosystem` | `{ query: string, topicIds?: number[], includeMirrors?: boolean }` | پروژه‌های منتشرشده (`projects`)، دوره‌های منتشرشده (`courses`) و آینه‌های باز (`analyzers` با وضعیت `open`) | پیشنهاد ابزار عملی (آینهٔ عارضه‌یابی)، پروژهٔ کارگاه یا دورهٔ آموزشی متناسب با مسئلهٔ مخاطب. |
| `resolve_topic_graph` | `{ query: string }` | موضوعات منطبق (`topics`) + موجودیت‌های متصل از طریق جداول رابط (`knowledge_topics`, `project_topics`, `course_topics`) + قانون اختصاصی آن موضوع (`mcp_topic_rules`) | تشخیص محور اصلی صحبت کاربر و فعال کردن سیاست پاسخ‌گویی مخصوص همان موضوع. |
| `get_audience_context` | `{ conversationId?: number }` *(شناسهٔ حساب فقط از سشن سرور تزریق می‌شود)* | بسته به سطح مجاز در تنظیمات ادمین:<br>• سطح `none`: خالی<br>• سطح `session`: خلاصهٔ پیام‌های قبلی همین گفتگو<br>• سطح `profile`: نام مخاطب و نقش<br>• سطح `mirror_summary`: آخرین گزارش آینه (`analyzer_reports`: `maturityLabel`, `bottleneckName`, `bottleneckScore`) | شخصی‌سازی پاسخ: مثلاً اگر کاربر در آینهٔ کاسیو گلوگاهش «سیستم فروش» بوده، پاسخ چت مستقیماً با توجه به آن گلوگاه تنظیم می‌شود. |

### ب) منابع (MCP Resources)

- `hadiran://ontology/worlds` — نقشهٔ اتاق‌ها و جهان‌های هادیران (برای هدایت صحیح کاربر به مسیرهای واقعی سایت).
- `hadiran://knowledge/{slug}` — متن و لایه‌های ساختاری یک مقالهٔ عمومی تاییدشده.
- `hadiran://topics/{slug}` — تعریف موضوع و تمام پیوندهای عمومی آن.

### ج) پرامپت‌ها و قالب‌های پاسخ (MCP Prompts)

هر پرامپت در این معماری **دو نمود (Dual Representation)** دارد که از پنل مدیریت قابل ویرایش است:
1. **`localTemplateFa` (قالب حالت لوکال):** الگوی متنی دارای متغیرهای جایگذاری (`{{topicIntro}}`, `{{knowledgeLine}}`, `{{knowledgeRoot}}`, `{{firstStep}}`, `{{audienceBottleneckHint}}`, `{{closingQuestion}}`) که بدون LLM، پاسخی منسجم و چندلایه می‌سازد.
2. **`llmSystemPromptFa` (دستورالعمل حالت LLM):** پرامپت سیستم که لحن هادیران («اول می‌بینیم، بعد می‌سازیم»، پرهیز از کلی‌گویی، تکیهٔ صرف بر منابع بازیابی‌شده، و پرسیدن یک سؤال شفاف‌ساز در پایان) را به مدل زبانی دیکته می‌کند.

---

## ۴. منطق شخصی‌سازی بر اساس «موضوع» و «دادهٔ مخاطب»

این بخش قلب تجربه‌ای است که ادمین از `/workspace/mcp` کنترل می‌کند:

### ۱) ماتریس سطح دادهٔ مخاطب (Audience Data Level)
ادمین در پنل مدیریت مشخص می‌کند که سرور MCP تا چه سطحی مجاز به استفاده از دادهٔ مخاطب است:

| سطح تنظیم‌شده توسط ادمین | دادهٔ خوانده‌شده توسط `get_audience_context` | رفتار در حالت لوکال | رفتار در حالت LLM |
|---|---|---|---|
| **`none` (فقط پیام فعلی)** | هیچ داده‌ای از کاربر یا نشست قبلی خوانده نمی‌شود. | پاسخ صرفاً بر اساس تطبیق واژگانی پیام فعلی با دانشنامه. | پاسخ تک‌نوبته بر اساس منابع دانشنامه. |
| **`conversation` (حافظهٔ گفتگو)** | ۳ تا ۵ پیام آخر همان `conversationId` از جدول `messages`. | حفظ موضوع پیام قبلی در صورت کوتاه بودن پیام جدید (مثلاً «چطور شروع کنم؟»). | ارسال تاریخچهٔ کوتاه گفتگو به LLM برای پیوستگی مکالمه. |
| **`profile` (هویت پایهٔ عضو)** | تاریخچهٔ گفتگو + `displayName` کاربر لاگین‌شده از `accounts`. | خطاب قرار دادن محترمانهٔ کاربر در ابتدای گفتگو. | لحن شخصی‌تر متناسب با عضو سایت. |
| **`mirror_insights` (هوشمندی کامل + گزارش آینه‌ها)** | موارد بالا + آخرین ردیف `analyzer_reports` کاربر (`coverTitle`, `maturityLabel`, `bottleneckName`) و لایهٔ گلوگاه از `analyzer_report_layers` (`asIsText`, `toBeText`). | افزودن یک بند هوشمند به پاسخ: *«با توجه به اینکه در گزارش آینهٔ شما گلوگاه اصلی «...» تشخیص داده شده، پیشنهاد می‌شود از این زاویه به مسئله نگاه کنید...»* | تزریق خلاصهٔ گلوگاه مخاطب در کانتکست LLM تا تحلیل مقالهٔ دانشنامه را دقیقاً روی گلوگاه واقعی کسب‌وکار آن مخاطب پیاده کند. |

### ۲) قوانین موضوعی (Topic Rules)
ادمین می‌تواند برای هر موضوع در جدول `topics` (مثلاً `ai`, `mcp`, `automation`, `knowledge-graph` یا موضوعات کسب‌وکاری) یک قانون در `mcp_topic_rules` تعریف کند:
- **حالت اجباری موضوع (`modeOverride`):** مثلاً ادمین می‌تواند تعیین کند کل سایت روی حالت `local` باشد، اما اگر کاربری دربارهٔ موضوع خاصی سؤال پرسید، حالت `llm` فعال شود (یا برعکس: برای موضوعات حساس فقط حالت قطعی `local` پاسخ بدهد).
- **آینهٔ پیشنهادی (`preferredAnalyzerSlug`):** مثلاً وقتی موضوع پیام مرتبط با گلوگاه کسب‌وکار است، آینهٔ `casio-ss` را در اولویت پیشنهاد قرار دهد.
- **سبک پاسخ (`responseStyle`):**
  - `clarify_first` (شفاف‌سازی مسئله با طرح سؤال ریشه‌ای `questionFa` و `rootFa`)
  - `action_first` (تمرکز روی گام اول عملی `firstStepFa`)
  - `deep_reference` (خلاصهٔ مفهومی + ارجاع به مقاله و وایت‌پیپر پروژه)

---

## ۵. مدل داده و مایگریشن دیتابیس

یک مایگریشن جدید در `src/db/migrations/0030_mcp_chat_control.sql` (به همراه ثبت در `src/db/migration-files.ts` و تعریف در `src/db/schema.ts`) اضافه می‌شود.

### الف) جدول تنظیمات سراسری MCP (`mcp_configs`)
تک‌ردیفه (Singleton با `id = 'default'`) برای نگهداری وضعیت کلی سرور MCP:

```sql
CREATE TABLE IF NOT EXISTS mcp_configs (
  id VARCHAR(32) PRIMARY KEY DEFAULT 'default',
  -- حالت اجرا: 'local' (فقط لوکال بدون LLM) | 'llm' (متصل به LLM با fallback خودکار به لوکال)
  mode VARCHAR(16) NOT NULL DEFAULT 'local',
  
  -- تنظیمات اتصال به LLM (سازگار با OpenAI / OpenRouter / Anthropic / Ollama)
  llm_provider VARCHAR(32) NOT NULL DEFAULT 'openai_compatible',
  llm_base_url TEXT NOT NULL DEFAULT 'https://api.openai.com/v1',
  llm_model VARCHAR(128) NOT NULL DEFAULT 'gpt-4o-mini',
  llm_api_key_cipher TEXT,
  llm_api_key_hint VARCHAR(8),
  llm_temperature DOUBLE PRECISION NOT NULL DEFAULT 0.3,
  llm_max_tokens INTEGER NOT NULL DEFAULT 700,
  llm_timeout_ms INTEGER NOT NULL DEFAULT 8000,

  -- سطح استفاده از دادهٔ مخاطب: 'none' | 'conversation' | 'profile' | 'mirror_insights'
  audience_context_level VARCHAR(24) NOT NULL DEFAULT 'conversation',
  max_history_turns INTEGER NOT NULL DEFAULT 4,

  -- کلیدهای فعال‌سازی ابزارها و منابع (Tools Toggles)
  enable_knowledge_tool BOOLEAN NOT NULL DEFAULT true,
  enable_article_layers BOOLEAN NOT NULL DEFAULT true,
  enable_projects_tool BOOLEAN NOT NULL DEFAULT true,
  enable_courses_tool BOOLEAN NOT NULL DEFAULT true,
  enable_analyzers_tool BOOLEAN NOT NULL DEFAULT true,
  enable_external_mcp_endpoint BOOLEAN NOT NULL DEFAULT false,
  external_mcp_token_cipher TEXT,
  external_mcp_token_hint VARCHAR(8),

  -- وزن‌های بازیابی (قابل تنظیم از پنل مدیریت)
  weights JSONB NOT NULL DEFAULT '{"title":3,"summary":2,"body":1,"topic":4,"hopBonus":8}'::jsonb,

  -- پرامپت و قالب سراسری پیش‌فرض
  default_system_prompt_fa TEXT,
  default_local_template_fa TEXT,

  -- وضعیت سلامت آخرین فراخوانی LLM
  last_llm_status VARCHAR(32),
  last_llm_error TEXT,
  last_llm_at TIMESTAMPTZ,

  updated_by INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### ب) جدول قوانین موضوعی MCP (`mcp_topic_rules`)
برای تنظیم رفتار اختصاصی به ازای هر موضوع (`topics.slug`):

```sql
CREATE TABLE IF NOT EXISTS mcp_topic_rules (
  id SERIAL PRIMARY KEY,
  topic_slug VARCHAR(64) NOT NULL UNIQUE REFERENCES topics(slug) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT true,
  -- 'inherit' (پیروی از تنظیم سراسری) | 'local' | 'llm'
  mode_override VARCHAR(16) NOT NULL DEFAULT 'inherit',
  -- 'clarify_first' | 'action_first' | 'deep_reference'
  response_style VARCHAR(32) NOT NULL DEFAULT 'clarify_first',
  
  -- دستورالعمل اختصاصی موضوع برای LLM و قالب لوکال
  custom_prompt_fa TEXT,
  custom_local_lead_fa TEXT,
  closing_question_override_fa TEXT,

  -- هدایت هدفمند مخاطب در این موضوع
  preferred_analyzer_slug VARCHAR(64),
  priority_boost INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## ۶. نقشهٔ فایل‌ها و ماژول‌ها (کجا قرار می‌گیرد؟)

تمام کدها درون مخزن فعلی `hadiran-web3` و مطابق ساختار زیر قرار می‌گیرند:

```text
hadiran-web3/
├── src/
│   ├── db/
│   │   ├── migrations/
│   │   │   └── 0030_mcp_chat_control.sql       # مایگریشن جداول تنظیمات و قوانین موضوعی MCP
│   │   ├── migration-files.ts                  # ثبت مایگریشن 0030
│   │   └── schema.ts                           # تعریف Drizzle برای mcpConfigs و mcpTopicRules
│   │
│   ├── lib/
│   │   ├── ai.ts                               # حفظ امضای retrieveForQuery و اتصال آن به orchestrator
│   │   └── mcp/
│   │       ├── types.ts                        # تایپ‌های مشترک Config، ToolResult، AudienceContext
│   │       ├── config.ts                       # خواندن/نوشتن تنظیمات از DB + fallback ایمن وقتی جدول/DB نیست
│   │       ├── context.ts                      # استخراج ایمن دادهٔ مخاطب (نشست، تاریخچه، خلاصهٔ گزارش آینه)
│   │       ├── tools.ts                        # پیاده‌سازی ابزارهای MCP (دانش، موضوع، پروژه، دوره، آینه)
│   │       ├── local-composer.ts               # موتور پاسخ‌ساز لوکال (بدون LLM) با استفاده از لایه‌های مقاله و قانون موضوع
│   │       ├── llm-runner.ts                   # موتور اجرای LLM با Timeout، فراخوانی ابزار و سوییچ خودکار به لوکال
│   │       ├── orchestrator.ts                 # نقطهٔ ورود واحد چت: تشخیص حالت، اجرای ابزارها و انتخاب موتور
│   │       └── server.ts                       # بسته‌بندی استاندارد JSON-RPC برای اندپوینت /api/mcp
│   │
│   ├── app/
│   │   ├── api/
│   │   │   ├── chat/
│   │   │   │   └── route.ts                    # ارسال سشن کاربر + پیام به runMcpChatTurn و ذخیرهٔ گفتگو
│   │   │   ├── mcp/
│   │   │   │   └── route.ts                    # اندپوینت Streamable HTTP (فعالسازی شرطی با توکن ادمین)
│   │   │   └── workspace/
│   │   │       └── mcp/
│   │   │           ├── route.ts                # GET / PUT تنظیمات سراسری MCP (فقط owner)
│   │   │           ├── topics/
│   │   │           │   └── route.ts            # GET / POST / DELETE قوانین موضوعی (فقط owner)
│   │   │           └── preview/
│   │   │               └── route.ts            # POST تست زنده و مقایسهٔ هم‌زمان خروجی لوکال و LLM در میز کار
│   │   │
│   │   └── workspace/
│   │       └── mcp/
│   │           └── page.tsx                    # صفحهٔ مدیریت MCP در میز کار (noindex، فقط owner)
│   │
│   └── components/
│       └── workspace/
│           ├── WorkspaceChrome.tsx             # افزودن آیتم «موتور گفتگو (MCP)» به ownerModules
│           └── McpControlDesk.tsx              # رابط کاربری تنظیمات، قوانین موضوعات و جعبهٔ تست دوحالته
```

---

## ۷. طراحی بخش مدیریت در میز کار (`/workspace/mcp`)

صفحهٔ `/workspace/mcp` با همان زبان بصری بومی میز کار هادیران (`ws-page`، کاشی‌های وضعیت، فرم‌های RTL فارسی و بدون وابستگی بیرونی) شامل **۴ بخش اصلی** خواهد بود:

### ۱) نوار وضعیت (Pulse ردیف بالا)
چهار کاشی وضعیت واقعی:
- **حالت فعال چت:** `لوکال (قطعی)` یا `متصل به LLM (با پشتیبان لوکال)`
- **وضعیت اتصال LLM:** `آماده` / `تنظیم‌نشده` / `خطا در آخرین فراخوانی (به همراه زمان)`
- **سطح دادهٔ مخاطب:** `فقط پیام` / `حافظهٔ نشست` / `پروفایل` / `همراه با گزارش آینه`
- **قوانین موضوعی فعال:** تعداد موضوعاتی که قانون اختصاصی دارند.

### ۲) تنظیمات حالت اجرا و اتصال مدل
- کلید انتخاب حالت:
  - `لوکال (بدون دخالت LLM — پاسخ سریع و قطعی از دانشنامه)`
  - `متصل به LLM (تولید پاسخ از روی دانشنامه با بازگشت خودکار به لوکال در صورت خطا)`
- فرم تنظیمات LLM:
  - `Base URL` (پیش‌فرض قابل تغییر برای OpenAI، OpenRouter، یا سرویس‌های داخلی)،
  - `Model Name`،
  - `API Key` (فیلد رمز؛ در صورت پر شدن با `sealSecret` ذخیره می‌شود و بعد از ذخیره فقط `••••1234` نشان می‌دهد)،
  - `Temperature` و `Timeout (ms)`.

### ۳) کنترل دادهٔ مخاطب و منابع MCP (Privacy & Context Controls)
- انتخابگر سطح دادهٔ مخاطب (`none` / `conversation` / `profile` / `mirror_insights`).
- چک‌باکس‌های فعال‌سازی منابع:
  - استفاده از لایه‌های عمیق مقاله (`lineFa`, `rootFa`, `firstStepFa`, `closingQuestionFa`) در پاسخ‌سازی؛
  - پیشنهاد خودکار آینه‌های باز (`analyzers`) در پاسخ؛
  - پیشنهاد پروژه‌های کارگاه (`projects`) و دوره‌ها (`courses`).
- اسلایدر/ورودی عددی برای وزن‌های بازیابی (`title`, `summary`, `body`, `topic`, `hopBonus`).

### ۴) قوانین موضوعی و آزمایشگاه تست زنده (Topic Rules & Side-by-Side Sandbox)
- **جدول قوانین موضوعات:** انتخاب یک موضوع از `topics`، تعیین سبک پاسخ (`شفاف‌سازی ریشه‌ای` / `گام عملی اول` / `ارجاع دانشی`)، انتخاب آینهٔ مرتبط (مثلاً `casio-ss`) و نوشتن راهنمای اختصاصی آن موضوع.
- **جعبهٔ تست زنده (Sandbox):** ادمین یک پیام نمونه می‌نویسد (و می‌تواند یکی از حساب‌های تستی را به‌عنوان مخاطب شبیه‌سازی کند) و دکمهٔ **«مقایسهٔ دو حالت»** را می‌زند. سیستم در یک نگاه نشان می‌دهد:
  1. کدام موضوعات و ابزارهای MCP فعال شدند؛
  2. خروجی **حالت لوکال** چیست؛
  3. خروجی **حالت LLM** چیست (به همراه زمان پاسخ).

---

## ۸. برش‌های اجرایی برای تیم توسعه (به ترتیب اولویت)

تیم توسعه باید پیاده‌سازی را در **۵ برش مستقل و قابل مرج** انجام دهد تا در هیچ مرحله‌ای بیلد یا پروداکشن نشکند:

### برش ۱ — لایهٔ داده و تنظیمات ایمن (`Database & Config Layer`)
1. ساخت فایل مایگریشن `src/db/migrations/0030_mcp_chat_control.sql` و اجرای `node scripts/generate-migration-files.mjs` (یا ثبت در `src/db/migration-files.ts`).
2. افزودن جداول `mcpConfigs` و `mcpTopicRules` به `src/db/schema.ts`.
3. پیاده‌سازی `src/lib/mcp/config.ts` با الگوی Fail-soft: اگر دیتابیس در دسترس نبود یا مایگریشن `0030` هنوز اجرا نشده بود، یک شیء پیش‌فرض (`mode: 'local'` با وزن‌های فعلی `src/lib/ai.ts`) برگرداند تا سایت هرگز کرش نکند.
- **گیت کنترل:** `npm run typecheck` و `npm run build` سبز.

### برش ۲ — استخراج ابزارهای MCP و موتور لوکال ارتقایافته (`MCP Tools & Enhanced Local Composer`)
1. انتقال و ماژولار کردن منطق بازیابی `src/lib/ai.ts` به داخل `src/lib/mcp/tools.ts` با حفظ کامل `publicKnowledgeFilter`، `publicProjectFilter` و `publicCourseFilter`.
2. افزودن فیلدهای لایه‌ای جدول `knowledge` (`lineFa`, `questionFa`, `rootFa`, `firstStepFa`, `closingQuestionFa`) به کوئری ابزار `search_knowledge`.
3. پیاده‌سازی `src/lib/mcp/context.ts` برای خواندن ایمن نشست کاربر (`getCurrentSessionAccount`) و خلاصهٔ آخرین گزارش آینه از `analyzer_reports` (فقط وقتی `audience_context_level = 'mirror_insights'` باشد).
4. پیاده‌سازی `src/lib/mcp/local-composer.ts` که در حالت لوکال (بدون LLM)، به جای یک جملهٔ ثابت، از لایه‌های مقاله (`rootFa` / `firstStepFa` / `closingQuestionFa`)، قانون موضوع و گلوگاه مخاطب، پاسخی غنی و ساختاریافته بسازد.
- **گیت کنترل:** بدون اتصال LLM، پاسخ‌های چت خانه با لایه‌های مقاله و قوانین موضوع غنی‌تر می‌شوند.

### برش ۳ — موتور LLM با Fallback خودکار و ارکستریتور (`LLM Runner & Orchestrator`)
1. پیاده‌سازی `src/lib/mcp/llm-runner.ts` با استفاده از `fetch` استاندارد Node 22 و `AbortSignal.timeout(config.llmTimeoutMs)` (بدون نیاز به نصب SDKهای سنگین).
2. ساخت پرامپت سیستم از روی منابع بازیابی‌شدهٔ MCP + قانون موضوع + زمینهٔ مخاطب.
3. پیاده‌سازی `src/lib/mcp/orchestrator.ts`:
   - اگر `mode === 'local'` ⬅ اجرای مستقیم `local-composer`.
   - اگر `mode === 'llm'` ⬅ اجرای `llm-runner`؛ در صورت هرگونه خطا یا تایم‌اوت، ثبت خطا در `mcp_configs.last_llm_error` و بازگشت فوری خروجی `local-composer`.
4. اتصال `src/app/api/chat/route.ts` به `orchestrator.ts`.
- **گیت کنترل:** تست حالت LLM با کلید معتبر و تست قطع کلید (اطمینان از بازگشت پاسخ لوکال با کد HTTP 200).

### برش ۴ — میز مدیریت MCP در `/workspace/mcp` (`Admin Control Plane`)
1. ساخت APIهای مدیریتی در `src/app/api/workspace/mcp/route.ts`، `topics/route.ts` و `preview/route.ts` با گارد `requireApiOwner`.
2. ساخت صفحهٔ `src/app/workspace/mcp/page.tsx` و کامپوننت `src/components/workspace/McpControlDesk.tsx`.
3. افزودن لینک `{ href: "/workspace/mcp", fa: "موتور گفتگو (MCP)", en: "Chat MCP", icon: Wrench }` به آرایهٔ `ownerModules` در `src/components/workspace/WorkspaceChrome.tsx`.
- **گیت کنترل:** مالک سایت می‌تواند از `/workspace/mcp` حالت را بین لوکال و LLM تغییر دهد، قوانین موضوع را ویرایش کند و در باکس تست، خروجی دو حالت را کنار هم ببیند.

### برش ۵ (اختیاری) — اندپوینت استاندارد `/api/mcp` برای کلاینت‌های بیرونی
1. پیاده‌سازی `src/lib/mcp/server.ts` و `src/app/api/mcp/route.ts` بر پایهٔ JSON-RPC 2.0 / Streamable HTTP (`initialize`, `tools/list`, `tools/call`, `resources/list`, `resources/read`, `prompts/list`, `prompts/get`).
2. محافظت با توکن Bearer اختصاصی (`external_mcp_token_cipher`) و سوییچ روشن/خاموش `enable_external_mcp_endpoint` از داخل `/workspace/mcp`.

---

## ۹. جدول مؤثر / متأثر (Impact Matrix)

| بخش | مؤثر (چه چیزی تغییر می‌کند) | متأثر (چه چیزی باید دست‌نخورده و امن بماند) |
|---|---|---|
| **چت خانه (`/api/chat`)** | پاسخ‌دهی از طریق ارکستریتور MCP (دو حالت لوکال غنی‌شده و LLM) | کامپوننت `HomeChat.tsx`، ذخیرهٔ `conversations` و `messages`، سرعت بارگذاری صفحهٔ `/` |
| **باغ دانش (`knowledge`)** | خواندن لایه‌های مقاله (`rootFa`, `firstStepFa`, `closingQuestionFa`) در ابزار MCP | چرخهٔ Capture → Promotion؛ رکوردهای `captured` و `private` هرگز دیده نمی‌شوند |
| **آینه‌ها (`analyzer_reports`)** | خواندن فقط-خواندنیِ گلوگاه مخاطبِ لاگین‌شده برای شخصی‌سازی چت | فرم‌ها، نمره‌دهی و اسناد چاپی آینه‌ها بدون تغییر |
| **میز کار (`/workspace`)** | افزودن صفحهٔ `/workspace/mcp` برای `owner` | نقش‌های `author` و `member` به این صفحه دسترسی ندارند؛ ناو عمومی سایت تغییر نمی‌کند |
| **استقرار لیارا و CI** | یک مایگریشن SQL جدید (`0030`) در استارت کانتینر | `liara.json`، پورت `3000`، و `.github/workflows/ci.yml` بدون تغییر |

---

## ۱۰. چک‌لیست پذیرش نهایی (Acceptance Criteria برای تحویل از تیم توسعه)

- [ ] **تست حالت لوکال:** وقتی در `/workspace/mcp` حالت روی `لوکال` است، `/api/chat` بدون هیچ درخواست شبکه‌ای به سرویس LLM، با استفاده از دانش عمومی، لایه‌های مقاله (`rootFa`, `firstStepFa`) و قانون موضوع پاسخ می‌دهد.
- [ ] **تست حالت LLM:** وقتی حالت روی `متصل به LLM` است و کلید معتبر وارد شده، پاسخ توسط LLM و صرفاً بر پایهٔ منابع استخراج‌شده از ابزارهای MCP تولید می‌شود و لینک‌های `references` همچنان دقیق زیر پیام نمایش داده می‌شوند.
- [ ] **تست Fail-soft (قطع بودن LLM):** وقتی حالت روی `متصل به LLM` است اما کلید اشتباه است یا سرویس LLM در دسترس نیست، کاربر در `/` هیچ خطایی نمی‌بیند و پاسخ حالت لوکال را با وضعیت `200 OK` دریافت می‌کند (و خطا فقط در پنل `/workspace/mcp` به `owner` گزارش می‌شود).
- [ ] **تست عدم نشت (Zero Leak):** یک ثبت خام در `/workspace/capture` که هنوز ارتقا (`promote`) نیافته یا `private` است، نه در حالت لوکال و نه در پرامپت ارسالی به LLM مطلقاً حضور ندارد.
- [ ] **تست دادهٔ مخاطب:** وقتی سطح دادهٔ مخاطب روی `mirror_insights` است، برای کاربری که گزارش ثبت‌شده در `analyzer_reports` دارد، گلوگاه او در پاسخ لحاظ می‌شود؛ و وقتی سطح روی `none` است، هیچ داده‌ای از پروفایل یا گزارش او خوانده نمی‌شود.
- [ ] **تست امنیت کلیدها:** در پاسخ `GET /api/workspace/mcp` هرگز متن کامل کلید API برگردانده نمی‌شود (فقط `hasApiKey: true` و `apiKeyHint`).
- [ ] **تست بیلد و تایپ‌چک:** دستورات `npm run typecheck` و `npm run build` بدون خطا اجرا می‌شوند.
