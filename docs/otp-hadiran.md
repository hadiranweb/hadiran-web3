# OTP هادیران — الهام از کاغذ‌و‌باد، بدون نام و مسیر آن

ورود بی‌رمز با موبایل ایرانی و قالب Verify در [SMS.ir](https://sms.ir). سشن httpOnly است، نه token در localStorage.

## چه چیزی از کاغذ‌و‌باد آمده

- نرمال‌سازی شماره (`+98` / `0098` / ارقام فارسی)
- کد ۶رقمی، هش SHA-256، مقایسهٔ timing-safe
- TTL ۱۲۰ ثانیه، حداکثر ۵ تلاش
- نرخ: ۱ ارسال / شماره / دقیقه؛ ۵ ارسال / IP / ۱۰ دقیقه؛ ۱۰ تأیید / جفت شماره+IP / ۱۰ دقیقه
- اگر پیامک نرود، چالش OTP باطل می‌شود
- رویدادهای auth بدون ذخیرهٔ کد یا توکن
- API Verify: `https://api.sms.ir/v1/send/verify`

## چه چیزی مال هادیران است

| کاغذ‌و‌باد | هادیران |
|---|---|
| `/auth` + ایمیل/رمز + Google/GitHub | فقط `/signin` و OTP موبایل |
| Bearer در localStorage | کوکی `hadiran_session` |
| جدول `users` + نقش‌های editor/admin | `accounts` با `owner` / `member` |
| ایمیل ساختگی `@phone.kaghazbaad.local` | فقط ستون `phone` |
| Fastify جدا | Route Handlerهای Next |

## موثرها (OTP روی چه چیزی اثر می‌گذارد)

- **دانشنامهٔ نوشتن/ویرایش/حذف:** بدون نشست ۴۰۱ یا ریدایرکت به `/signin?next=`
- **ناوبری:** لینک ورود / خروج
- **robots / sitemap:** `/signin` ایندکس نمی‌شود
- **SMS.ir:** بدون `SMSIR_API_KEY` و `SMSIR_TEMPLATE_ID` در production ارسال قطع است؛ در development کد در پاسخ و لاگ می‌آید

## متاثرها (چه چیزی OTP را شکل می‌دهد)

- قالب Verify پنل SMS.ir باید پارامتر `CODE` (یا `SMSIR_CODE_PARAMETER`) داشته باشد
- `HADIRAN_OWNER_PHONES` نقش owner را هنگام اولین ورود می‌سازد
- جدول‌های `accounts`, `otp_challenges`, `sessions`, `auth_events`, `rate_limit_buckets`

## هنوز عمومی مانده

خانه (چت)، فهرست/جزئیات دانش، آزمایشگاه، دوره‌ها، اکوسیستم، `/hadiran`، فرم همکاری.

## هنوز نیاورده‌ایم

ایمیل/رمز، OAuth، RBAC چهارنقشه، LiveKit، درایو ۱۵گیگ، زرین‌پال.

## راه‌اندازی

```bash
npm run db:push
# یا src/db/migrations/0003_auth_otp.sql
```

قالب پیامک SMS.ir نمونه: `کد ورود هادیران: {CODE}`
