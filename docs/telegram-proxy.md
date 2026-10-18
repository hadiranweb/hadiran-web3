# پروکسی تلگرام برای دیتاسنتر ایران (Cloudflare Worker)

برنامهٔ `hadiranweb` روی لیارا داخل ایران است.

- **خروجی:** لیارا به `api.telegram.org` نمی‌رسد. مسیر `/bot…` روی Worker به Bot API می‌رود.
- **ورودی:** سرورهای تلگرام اغلب به مبدأ ایرانی timeout می‌دهند (`Connection timed out`). مسیر `/hook/<botId>` روی همان Worker به وب‌هوک هادیران می‌رسد.

`getUpdates` استفاده نمی‌شود.

## ۱. ساخت / به‌روز کردن Worker

1. [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → Worker موجود یا **Create Worker**.
2. **Edit code** → محتوا را پاک کنید و کل فایل `scripts/telegram-proxy-worker.js` همین ریپو را بگذارید.
3. **Save and Deploy**.
4. آدرس ریشه را کپی کنید (بدون `/` پایانی)، شبیه:
   ```
   https://hadiran-tg.your-name.workers.dev
   ```

اگر `workers.dev` از شبکهٔ شما باز نشد، در تنظیمات همان Worker یک دامنهٔ اختصاصی وصل کنید.

## ۲. متغیر روی لیارا — نه GitHub

کنسول لیارا → برنامهٔ `hadiranweb` → **تنظیمات** → **متغیرها**:

```
TELEGRAM_API_BASE=https://hadiran-tg.your-name.workers.dev
```

`https://` باشد، `/` پایانی نباشد، `/bot` و `/hook` در مقدار نباشد. توکن بات در این متغیر نیست.

با بودن این متغیر، `setWebhook` روی `{TELEGRAM_API_BASE}/hook/{botId}` ثبت می‌شود نه مستقیم روی `hadiranweb.ir`.

توکن در Postgres می‌ماند؛ `HADIRAN_JWT_SECRET` روی لیارا می‌ماند؛ هیچ‌کدام GitHub Secret نیستند.

بعد از ذخیره یک‌بار ری‌استارت یا دیپلوی.

## ۳. اتصال ربات

۱. کد Worker را Save and Deploy کنید.  
۲. صبر کنید هادیران با `webhookUrlFor` جدید دیپلوی شود.  
۳. میز کار → ربات‌ها → **اتصال / ثبت وب‌هوک**.  
۴. در ربات `/start`.

آدرس وب‌هوک در میز باید با `/hook/` شروع شود نه `/api/bots/telegram/`.

## نکته‌ها

- پلن رایگان Cloudflare روزانه ۱۰۰ هزار درخواست است.
- Worker توکن را ذخیره نمی‌کند؛ `/hook/<botId>` شناسهٔ ربات هادیران است نه توکن BotFather.
- Worker را روی `workers.dev` نگه دارید. Route روی کل `hadiranweb.ir/*` نگذارید (حلقه).
- متغیر اختیاری Worker: `HADIRAN_ORIGIN=https://hadiranweb.ir` (secret نیست).
- آدرس واقعی Worker را در گیت نگذارید.
- تلگرام به مبدأ ایرانی timeout می‌دهد؛ مسیر `/hook` را حذف نکنید.
