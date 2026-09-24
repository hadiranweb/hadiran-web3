# هادیران | Hadiran

### فضای هم‌فکری، شفاف‌سازی مسئله و طراحی سیستم‌ها
### A conversational space for ontology, complex problems, autonomous intelligence, and Web3 architecture

[![Next.js](https://img.shields.io/badge/Next.js-16_App_Router-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Drizzle_ORM-336791.svg)](https://orm.drizzle.team/)
[![UI](https://img.shields.io/badge/UI-RTL_Persian-emerald.svg)](#-معرفی-فارسی)
[![Auth](https://img.shields.io/badge/Auth-OTP_SMS.ir-violet.svg)](#-ورود-بی‌رمز)

```yaml
project:
  name_fa: هادیران
  name_en: Hadiran
  repo: hadiranweb/hadiran-web3
  product: conversational ecosystem — not a marketing landing on /
  language: fa (RTL)
  philosophy:
    - ontology first, interface second
    - everything is connected
    - a project is a vessel, not a portfolio card
    - each document has one job
    - content is written to be readable by humans and machines

home:
  path: /
  intent: think together — state a problem, structure it, retrieve related knowledge

worlds:
  person:     { path: /hadiran,    role: who Hadiran is }
  knowledge:  { path: /knowledge,  role: published projection of approved public memory }
  workspace:  { path: /workspace,  role: owner capture desk, noindex, not in primary nav }
  lab:        { path: /lab,        role: projects, documents, collaboration }
  academy:    { path: /courses,    role: courses and lessons }
  ecosystem:  { path: /ecosystem,  role: map of the four worlds }

bridges:
  topics:  { path: /topics,  role: graph hub — not a fifth world in primary nav }
  contact: { path: /contact, role: contact methods only, no inbox form }

auth:
  path: /signin
  method: Iranian mobile OTP via SMS.ir Verify
  session: httpOnly cookie hadiran_session
  roles: [owner, member]

stack:
  app: Next.js App Router + React
  data: PostgreSQL + Drizzle ORM
  sms: SMS.ir
  search: retrieval over knowledge, projects, courses, topics

out_of_scope:
  - LiveKit / realtime workshops
  - 15GB personal drive
  - Zarinpal billing
  - /about (person page is /hadiran)
  - bilingual /fa /en URL split
```

---

## 🇮🇷 معرفی فارسی

**هادیران** اکوسیستم شخصی هادی است برای **هم‌فکری مستقیم**: مسئله را بگو، با هم شفافش کنیم، به دانش و پروژه و دورهٔ مرتبط وصلش کنیم.

خانهٔ محصول یک لندینگ آماری نیست. **`/` خودِ گفتگو است** — رابط مکالمه‌ای با بازیابی از دانشنامه، آزمایشگاه، آکادمی و گراف موضوع. نقشهٔ اکوسیستم جدا روی **`/ecosystem`** می‌ماند تا با خانه رقابت نکند.

چهار جهان محتوا، یک هویت، و یک پل موضوع:

| جهان | مسیر | نیت |
|---|---|---|
| گفتگو | `/` | شفاف‌سازی مسئله و هم‌فکری |
| اکوسیستم | `/ecosystem` | نقشهٔ چهار جهان و اتصال‌ها |
| شخص | `/hadiran` | کیست، مسیر، دیدگاه، مهارت |
| دانشنامه | `/knowledge` | نمود عمومی حافظهٔ تأییدشده |
| میز کار | `/workspace` | ثبت خام owner؛ noindex؛ خارج ناو اصلی |
| آزمایشگاه | `/lab` | پروژه به‌عنوان ظرف: مسئله، چشم‌انداز، اسناد، همکاری |
| آکادمی | `/courses` | دوره و درس |
| موضوعات | `/topics` | پل گراف؛ جهان پنجم در نوار اصلی نیست |
| تماس | `/contact` | روش‌های ارتباط؛ بدون فرم پیام |

اصول محتوا:

1. **ابتدا هستی‌شناسی، سپس رابط کاربری.** موجودیت پایدار است؛ صفحه فقط نمای آن است.
2. **یک URL = یک نیت.** خانه، اکوسیستم، شخص و مقاله با هم cannibalize نمی‌کنند.
3. **موضوع پل است نه محصول جدا.** چیپ موضوع و ارجاع چت به `/topics/[slug]` می‌روند.
4. **پروژه کارت نمونه‌کار نیست.** وایت‌پیپر، بلوپرینت، رودمپ و گانت هر کدام کار خود را دارند.
5. **تماس ≠ همکاری ≠ بیوگرافی.** `/contact` روش‌هاست؛ همکاری روی `/lab/[slug]/collaborate` است؛ شخص روی `/hadiran` است. `/about` ساخته نمی‌شود.

---

## 🇬🇧 English Overview

**Hadiran** is a personal ecosystem for **direct collaboration on hard problems**: ontology of systems, autonomous intelligence, automation, and Web3 architecture.

The product home is the conversation itself (`/`). The former marketing landing lives at `/ecosystem`. Knowledge, lab projects, and courses are first-class entities with stable Latin slugs. Topics are a **graph bridge** across those silos, not a fifth primary navigation world.

Capture happens at `/workspace` (owner). The public graph only shows approved public memory.

---

## 🌐 نقشهٔ مسیرها

```
/                         conversational home
/ecosystem                ecosystem map (four worlds)

/hadiran                  person / about
/signin                   OTP sign-in (noindex)

/knowledge                knowledge index (approved public memory only)
/knowledge/new            redirects to /workspace/capture
/knowledge/[slug]         projection of a memory item
/knowledge/[slug]/edit    redirects to the source record when linked

/workspace                owner desk (noindex)
/workspace/capture        new semantic record
/workspace/records/[id]   edit + explicit promote

/lab                      projects
/lab/[slug]               one project
/lab/[slug]/whitepaper    why / what
/lab/[slug]/blueprint     architecture
/lab/[slug]/roadmap       path
/lab/[slug]/gantt         time
/lab/[slug]/collaborate   collaboration request (noindex)

/courses                  academy
/courses/[slug]           one course

/topics                   topic index
/topics/[slug]            topic hub: related knowledge + lab + courses

/contact                  contact methods (no message form)
```

`?topic=` only filters a list. Canonical topic pages are `/topics/[slug]`. UUIDs never appear in public paths.

Primary nav: home, ecosystem, person, knowledge, lab, courses, sign-in.  
Footer: topics, contact.

---

## 💬 گفتگو و بازیابی

چت URL جدا ندارد. سؤال از `/api/chat` می‌گذرد:

- نرمال‌سازی متن (ارقام فارسی، علائم)
- بازیابی وزن‌دار روی عنوان / خلاصه / بدنهٔ دانش، پروژه، دوره
- تطبیق موضوع و hop از جدول‌های اتصال
- پاسخ قالبی با ارجاع به `/knowledge/[slug]`، `/lab/[slug]`، `/courses/[slug]`، `/topics/[slug]`
- ذخیره در `conversations` و `messages` (عمومی ایندکس نمی‌شود)

---

## 🔐 ورود بی‌رمز

- مسیر: `/signin`
- فقط موبایل ایرانی + قالب Verify در [SMS.ir](https://sms.ir)
- کد ۶رقمی، هش SHA-256، TTL کوتاه، سقف تلاش، نرخ ارسال
- نشست: کوکی httpOnly `hadiran_session` (۳۰ روز) — نه token در `localStorage`
- نقش‌ها: `owner` / `member` — شمارهٔ مالک از `HADIRAN_OWNER_PHONES` در ورود اول
- نوشتن/ویرایش دانش بدون نشست به `/signin?next=` می‌رود
- در development اگر پیامک تنظیم نباشد، کد در پاسخ توسعه دیده می‌شود؛ در production بدون کلید SMS ارسال قطع است

---

## 🗃️ مدل داده (خلاصه)

موجودیت‌های پایدار در PostgreSQL با Drizzle:

- `person`, `topics`, `knowledge` (+ `knowledge_slides`)
- `projects` + اسناد (`whitepaper` / `blueprint` / `roadmap` / `gantt`)
- `courses`, `lessons`
- جدول‌های اتصال موضوع / مهارت / نقش / سازمان
- `collaborations` برای درخواست همکاری روی پروژه
- `accounts`, `otp_challenges`, `sessions`, `auth_events`, `rate_limit_buckets`
- `conversations`, `messages`

مایگریشن‌ها در `src/db/migrations/` به ترتیب اعمال می‌شوند.

---

## 🛠️ پشته

| لایه | انتخاب |
|---|---|
| اپ | Next.js 16 App Router، React 19، TypeScript |
| UI | Tailwind CSS 4، RTL، فونت وزیرمتن |
| داده | PostgreSQL، Drizzle ORM، `pg` |
| پیامک | SMS.ir Verify |
| سئو | `sitemap.ts`، `robots.ts`، JSON-LD روی صفحات موجودیت، `lang=fa` `dir=rtl` |

یک برنامه است، نه فرانت و API جدا.

**عمداً در این محصول نیست:** پخش زنده، درایو فایل شخصی، درگاه پرداخت، داشبورد ادمین چندنقشی، نسخهٔ انگلیسی با URL جدا.

---

## 🚀 اجرای محلی

پیش‌نیاز: Node.js 22 و PostgreSQL.

```bash
git clone https://github.com/hadiranweb/hadiran-web3.git
cd hadiran-web3
npm ci
cp .env.example .env
```

`.env` را با `DATABASE_URL` واقعی پر کنید، سپس:

```bash
npm run db:migrate
npm run dev
```

سایت روی [http://localhost:3000](http://localhost:3000).

| اسکریپت | کار |
|---|---|
| `npm run dev` | سرور توسعه |
| `npm run build` / `npm start` | بیلد و اجرای تولید |
| `npm run typecheck` | TypeScript |
| `npm run lint` | ESLint |
| `npm run db:migrate` | اعمال SQLهای `src/db/migrations/` |
| `npm run db:push` | همگام‌سازی schema با Drizzle — برای پروداکشن پیش‌فرض نیست |

Seed نمونه در `src/db/seed.ts` است (دانش، پروژه، دوره، شخص). روی دیتابیس خالی، صفحات فهرست بدون seed تهی‌اند؛ schema ورود بعد از مایگریشن آماده است.

---

## 🔑 متغیرهای محیطی

مقدارها را در git نگذارید. فایل مرجع: `.env.example`.

| متغیر | نقش |
|---|---|
| `DATABASE_URL` | اتصال PostgreSQL |
| `NEXT_PUBLIC_SITE_URL` | مبنای canonical و لینک مطلق (در زمان build داخل باندل می‌رود) |
| `SMSIR_API_KEY` | کلید Verify — فقط سرور |
| `SMSIR_TEMPLATE_ID` | شناسهٔ قالب پیامک |
| `SMSIR_CODE_PARAMETER` | نام پارامتر کد در قالب (پیش‌فرض `CODE`) |
| `SMSIR_TIMEOUT_MS` | مهلت درخواست پیامک |
| `OTP_TTL_SECONDS` | عمر کد (پیش‌فرض ۱۲۰) |
| `OTP_MAX_ATTEMPTS` | سقف تلاش تأیید |
| `HADIRAN_OWNER_PHONES` | شماره‌های مالک، جداشده با ویرگول |

قالب پیامک نمونه: `کد ورود هادیران: {CODE}`

---

## 📁 ساختار مخزن

```
hadiran-web3/
├── src/app/                 # App Router — هر پوشه یک URL
│   ├── page.tsx             # /
│   ├── ecosystem/           # /ecosystem
│   ├── hadiran/             # /hadiran
│   ├── knowledge/           # دانشنامه
│   ├── lab/                 # آزمایشگاه
│   ├── courses/             # آکادمی
│   ├── topics/              # هب موضوع
│   ├── contact/             # تماس
│   ├── signin/              # ورود
│   └── api/                 # chat, auth/otp, knowledge, health, …
├── src/components/          # Nav, chat, knowledge composer, auth
├── src/db/                  # schema, seed, migrations
├── src/lib/                 # site, auth, retrieval, markdown
├── scripts/apply-migrations.mjs
├── liara.json
└── .env.example
```

---

## 📄 تماس

صفحهٔ شخص: [`/hadiran`](https://github.com/hadiranweb/hadiran-web3) در خودِ محصول.  
مخزن: [github.com/hadiranweb/hadiran-web3](https://github.com/hadiranweb/hadiran-web3)
