# پروکسی تلگرام برای دیتاسنتر ایران (Cloudflare Worker)

برنامهٔ `hadiranweb` روی لیارا داخل ایران است و به `api.telegram.org` دسترسی ندارد.
دکمهٔ اتصال ربات در `/workspace/bots` بدون پروکسی با خطای «تلگرام در دسترس نبود» می‌ماند.

**راه‌حل:** یک Worker رایگان روی Cloudflare (خارج از ایران) و متغیر `TELEGRAM_API_BASE` روی لیارا.
برنامه به‌جای تلگرام به Worker درخواست می‌زند؛ Worker آن را به Bot API می‌رساند.

وب‌هوک ورودی ربطی به این پروکسی ندارد. تلگرام خودش به
`https://hadiranweb.ir/api/bots/telegram/[id]/webhook` می‌زند (خارج→داخل؛ این مسیر باز است).
پروکسی فقط برای درخواست‌های برنامه→تلگرام است: `getMe`، `setWebhook`، `getWebhookInfo`، `deleteWebhook`.
`getUpdates` استفاده نمی‌شود.

## ۱. ساخت Worker

1. [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Create Worker**.
2. نامی مثل `hadiran-tg` بگذارید → **Deploy** → **Edit code**.
3. محتوای ادیتور را پاک کنید و کل فایل `scripts/telegram-proxy-worker.js` همین ریپو را بگذارید.
4. **Save and Deploy**.
5. آدرس را کپی کنید (بدون `/` پایانی)، شبیه:
   ```
   https://hadiran-tg.your-name.workers.dev
   ```

اگر `workers.dev` از شبکهٔ شما باز نشد، در تنظیمات همان Worker یک دامنهٔ اختصاصی وصل کنید.

## ۲. متغیر روی لیارا — نه GitHub

کنسول لیارا → برنامهٔ `hadiranweb` → **تنظیمات** → **متغیرها**:

```
TELEGRAM_API_BASE=https://hadiran-tg.your-name.workers.dev
```

`https://` باشد، `/` پایانی نباشد. توکن بات در این متغیر نیست.
توکن در Postgres می‌ماند؛ `HADIRAN_JWT_SECRET` روی لیارا می‌ماند؛ هیچ‌کدام GitHub Secret نیستند.

بعد از ذخیره یک‌بار ری‌استارت یا دیپلوی.

## ۳. اتصال ربات

میز کار → ربات‌ها → ربات → توکن BotFather → **اتصال**.
باید `getMe` و `setWebhook` از مسیر پروکسی سبز شوند.

## نکته‌ها

- پلن رایگان Cloudflare روزانه ۱۰۰ هزار درخواست است.
- Worker فقط مسیر `/bot…` را پاس می‌دهد؛ به‌تنهایی به بات شما دسترسی ندارد.
- آدرس واقعی Worker را در گیت نگذارید.
