# استپ C — قرارداد CD فقط روی `main`

وضعیت: **قفل‌شده.** YAML دیپلوی در `.github/workflows/ci.yml` job `deploy` (F.۳).  
تاریخ قفل: ۲۰۲۶-۰۹-۲۰  
وابسته به A: App `hadiranweb`، پلتفرم Next، پورت ۳۰۰۰.  
وابسته به B: `needs: [typecheck, build]`.

---

## ۱. قرارداد workflow

| مورد | مقدار قفل‌شده |
|---|---|
| Trigger دیپلوی | فقط `push` به `main` |
| `workflow_dispatch` | برای کل workflow هست؛ **دیپلوی نه** (`if` زیر) |
| شرط job دیپلوی | `github.event_name == 'push' && github.ref == 'refs/heads/main'` |
| PR | هیچ `liara deploy` |
| `needs` | `typecheck` و `build` — نه lint |
| `environment` | `production` |
| App | **یک** `hadiranweb` |
| پلتفرم CLI | Next (نه `--dockerfile`) |
| پورت | `3000` |
| CLI | `@liara/cli@9.5.1` (پین؛ نه `@latest`) |
| لاگ بعد از دیپلوی | `--no-app-logs` |
| پیام | `GitHub ${GITHUB_SHA}` |
| concurrency دیپلوی | گروه `liara-production-hadiranweb`؛ **`cancel-in-progress: false`** |
| Secret گیت‌هاب | `LIARA_API_TOKEN` (اجباری). `LIARA_TEAM_ID` اگر تیم باشد |
| Runtime | روی کنسول لیارا؛ در گیت نه |

دستور هدف (F.۳؛ هنوز اجرا نمی‌شود):

```
liara deploy \
  --app hadiranweb \
  --api-token "$LIARA_API_TOKEN" \
  --port 3000 \
  --no-app-logs \
  --message "GitHub ${GITHUB_SHA}"
```

اگر `LIARA_TEAM_ID` ست بود `--team-id` اضافه می‌شود. نام App کاغذ ممنوع.

---

## ۲. موثر / متاثر C

| | موثر | متاثر |
|---|---|---|
| merge به `main` بعد از گیت سبز | بیلد/استارت روی لیارا | App از قبل در کنسول ساخته شده باشد |
| PR | صفر دیپلوی | فقط گزارش B |
| نبود `LIARA_API_TOKEN` | job دیپلوی fail | استپ E |
| دیپلوی وسط کار | کنسل نمی‌شود | concurrency |
| عوض کردن شناسه App | باید همین فایل و CLI عوض شوند | قفل A |

---

## ۳. خارج از C

- دیپلوی از sandbox
- استک AI / ورکر / سه App
- نوشتن token در YAML
