# استپ B — گیت‌های CI هادیران

وضعیت: **قفل‌شده.** YAML گیت‌ها در برش F.۲ نوشته می‌شود؛ job دیپلوی در این استپ نیست.  
تاریخ قفل: ۲۰۲۶-۰۹-۲۰  
الهام: الگوی کاغذ (`typecheck`/`build` مسدود، lint مشورتی). نام jobها و Appهای کاغذ کپی نمی‌شود.

وابسته به A: Node **۲۲**، یک App Next، بدون Fastify/installer/AI.

---

## ۱. چه چیزی باید سبز باشد تا CD حق اجرا داشته باشد

| Job | دستور | مسدودکننده؟ | چرا |
|---|---|---|---|
| `typecheck` | `npm run typecheck` (`tsc --noEmit`) | **بله** | قرارداد تایپ؛ بدون اجرای DB |
| `build` | `npm run build` (`next build`) | **بله** | همان چیزی که لیارا روی پلتفرم Next اجرا می‌کند |
| `lint-diagnostics` | `npm run lint` | **خیر** (advisory) | مثل کاغذ: بدهی کیفیت گزارش می‌شود، merge/deploy را نمی‌بندد |

`needs` دیپلوی (استپ C) فقط: **`typecheck` + `build`.** lint داخل `needs` نمی‌آید.

---

## ۲. چه چیزی گیت نیست

| مورد کاغذ / وسوسه | هادیران |
|---|---|
| `npm test` / تست Fastify | اسکریپت تست نداریم؛ ساخته نمی‌شود |
| `verify:seo` | مال کاغذ است |
| Windows installer | بیرون از توپولوژی |
| AI stack contract | بیرون از توپولوژی |
| `migrate:dry-run` | اسکریپت نداریم؛ migrate روی لیارا است نه CI |
| `npm audit` به‌عنوان گیت | در B قفل نشد |
| `db:push` در CI | به Postgres واقعی وصل نمی‌شویم |

---

## ۳. محیط اجرای گیت‌ها

- Runner: `ubuntu-latest`
- Node: **۲۲** (هم‌تراز قفل A)
- نصب: `npm ci` از `package-lock.json`
- Trigger CI: `push` به `main`، `pull_request` به `main`، `workflow_dispatch`
- concurrency CI: گروه روی `ref`؛ run قدیمی **کنسل می‌شود** (دیپلوی جدا و کنسل نمی‌شود)

`src/db/index.ts` اگر `DATABASE_URL` نباشد در import پرتاب می‌کند. صفحات `force-dynamic`اند پس در بیلد کوئری نمی‌زنند، ولی ماژول لود می‌شود.

env **فقط برای job بیلد** (مقدار جعلی؛ به دیتابیس واقعی وصل نمی‌شود):

```
DATABASE_URL=postgresql://ci:ci@127.0.0.1:5432/ci
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

SMS.ir و مالک در CI ست نمی‌شوند.

---

## ۴. موثر / متاثر B

| | موثر | متاثر |
|---|---|---|
| `typecheck` یا `build` قرمز | دیپلوی `main` اجرا نمی‌شود | استپ C (`needs`) |
| lint قرمز | فقط هشدار و summary | merge و CD |
| عوض شدن `package.json` اسکریپت‌ها | همین جدول باید به‌روز شود | workflow F.۲ |
| نبود `DATABASE_URL` در بیلد | `next build` ممکن است با throw ماژول DB بشکند | env جعلی بالا |
| Node غیر ۲۲ | اختلاف با لیارا | قفل A |

---

## ۵. خارج از B

- job `deploy`
- secret لیارا
- نصب CLI
- بالا آوردن Postgres در GitHub Actions
