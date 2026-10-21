import Link from "next/link";
import { orderStateFa } from "@/lib/shop/states";
import { financeDateFa } from "@/lib/finance/period";
import { financeHref, financeMoney, type FinanceSnapshot } from "@/lib/finance/types";

const titles = {
  report: "گزارش تسویه",
  orders: "مرکز سفارش",
  personal: "خریدهای من",
} as const;

export function FinanceDesk({
  snapshot,
  filterError,
}: {
  snapshot: FinanceSnapshot;
  filterError?: string | null;
}) {
  const path =
    snapshot.mode === "personal"
      ? "/account/purchases"
      : snapshot.mode === "report"
        ? "/workspace/finance"
        : "/workspace/shop/orders";
  const { query } = snapshot;
  const live = snapshot.source === "live";
  const unknown = !live;

  return (
    <main className="mx-auto max-w-4xl space-y-8 px-4 py-8">
      <header>
        <h1 className="text-2xl font-bold text-ink">{titles[snapshot.mode]}</h1>
        <p className="mt-2 text-sm leading-7 text-muted">
          {snapshot.mode === "report"
            ? "بر اساس زمان تسویه؛ تومان دقیق از ریال ذخیره‌شده. واحدها جدا می‌مانند. کیف پول یا سود خالص نیست."
            : "مبلغ به تومان از ریال ذخیره‌شده. دوره شمسی، منطقهٔ زمانی تهران. درگاه تازه اضافه نشده است."}
        </p>
        <p className="mt-1 text-xs text-muted">
          تقویم شمسی · وقت تهران
          {query.period === "all" ? " · همهٔ زمان‌ها" : query.from && query.to ? ` · ${query.from} — ${query.to}` : ""}
          {query.basis === "settled" ? " · مبنای تاریخ: تسویه" : " · مبنای تاریخ: ثبت سفارش"}
        </p>
      </header>

      {filterError ? (
        <p className="rounded-[var(--radius-md)] border border-line bg-accent-soft px-4 py-3 text-sm text-ink" role="alert">
          بازه یا صافی نامعتبر است. به ماه جاری برنگشتیم.
        </p>
      ) : snapshot.source === "error" ? (
        <p className="rounded-[var(--radius-md)] border border-line bg-accent-soft px-4 py-3 text-sm text-ink" role="status">
          خواندن گزارش انجام نشد. جمع و شمار نامشخص است؛ فهرست خالی جای خطا نیامده.
        </p>
      ) : unknown ? (
        <p className="rounded-[var(--radius-md)] border border-line bg-accent-soft px-4 py-3 text-sm text-ink" role="status">
          داده در دسترس نیست. مبلغ و شمار نامشخص است و دادهٔ نمونه جای خالی نیامده.
        </p>
      ) : null}

      {live && snapshot.undatedSettled ? (
        <p className="rounded-[var(--radius-md)] border border-line bg-elev px-4 py-3 text-sm text-muted" role="status">
          {snapshot.undatedSettled.toLocaleString("fa-IR")} سفارش تسویه‌شده تاریخ تسویه ندارد؛ در گزارش بازه‌دارِ مبنای
          تسویه وارد دوره نمی‌شود.
        </p>
      ) : null}

      <form method="get" action={path} className="flex flex-wrap gap-3 rounded-[var(--radius-md)] border border-line bg-elev p-4">
        <label className="text-sm text-muted">
          دورهٔ شمسی
          <select
            name="period"
            defaultValue={query.period}
            className="ms-2 min-h-11 rounded-[var(--radius-sm)] border border-line bg-paper px-2 text-ink"
          >
            <option value="month">این ماه</option>
            <option value="previous">ماه قبل</option>
            <option value="all">همه</option>
            <option value="custom">سفارشی</option>
          </select>
        </label>
        <label className="text-sm text-muted">
          از
          <input
            name="from"
            defaultValue={query.from}
            placeholder="1405-01-01"
            dir="ltr"
            maxLength={10}
            className="ms-2 min-h-11 rounded-[var(--radius-sm)] border border-line bg-paper px-2 text-ink"
          />
        </label>
        <label className="text-sm text-muted">
          تا · شامل این روز
          <input
            name="to"
            defaultValue={query.to}
            placeholder="1405-01-31"
            dir="ltr"
            maxLength={10}
            className="ms-2 min-h-11 rounded-[var(--radius-sm)] border border-line bg-paper px-2 text-ink"
          />
        </label>
        {snapshot.mode !== "report" ? (
          <label className="text-sm text-muted">
            وضعیت
            <select
              name="state"
              defaultValue={query.state}
              className="ms-2 min-h-11 rounded-[var(--radius-sm)] border border-line bg-paper px-2 text-ink"
            >
              <option value="all">همه</option>
              <option value="awaiting_payment_reference">در انتظار پیگیری</option>
              <option value="awaiting_confirmation">در انتظار تأیید</option>
              <option value="settled">تسویه</option>
              <option value="declined">رد شده</option>
              <option value="cancelled">لغو</option>
            </select>
          </label>
        ) : (
          <input type="hidden" name="state" value="settled" />
        )}
        {snapshot.mode !== "report" ? (
          <label className="text-sm text-muted">
            مبنا
            <select
              name="basis"
              defaultValue={query.basis}
              className="ms-2 min-h-11 rounded-[var(--radius-sm)] border border-line bg-paper px-2 text-ink"
            >
              <option value="created">تاریخ ثبت</option>
              <option value="settled">تاریخ تسویه</option>
            </select>
          </label>
        ) : (
          <input type="hidden" name="basis" value="settled" />
        )}
        <label className="text-sm text-muted">
          محصول · شناسه یا اسلاگ
          <input
            name="product"
            defaultValue={query.product}
            maxLength={128}
            className="ms-2 min-h-11 rounded-[var(--radius-sm)] border border-line bg-paper px-2 text-ink"
          />
        </label>
        <label className="text-sm text-muted">
          واحد ذخیره‌شده
          <input
            name="currency"
            defaultValue={query.currency}
            maxLength={8}
            placeholder="IRR / USD"
            dir="ltr"
            className="ms-2 min-h-11 rounded-[var(--radius-sm)] border border-line bg-paper px-2 text-ink"
          />
        </label>
        <label className="text-sm text-muted">
          جست‌وجو
          <input
            name="q"
            defaultValue={query.q}
            maxLength={80}
            className="ms-2 min-h-11 rounded-[var(--radius-sm)] border border-line bg-paper px-2 text-ink"
          />
        </label>
        <button type="submit" className="min-h-11 rounded-[var(--radius-sm)] bg-accent px-4 text-sm font-medium text-accent-fg">
          اعمال فیلتر
        </button>
        <Link href={path} className="inline-flex min-h-11 items-center text-sm text-accent">
          پاک‌کردن
        </Link>
      </form>

      {snapshot.totals.length ? (
        <ul className="flex flex-wrap gap-3">
          {snapshot.totals.map((item) => (
            <li key={item.currency} className="rounded-[var(--radius-md)] border border-line bg-elev px-4 py-3 text-sm">
              <Link href={item.href} className="text-ink">
                <strong>{financeMoney(item.amount, item.currency)}</strong>
                <span className="ms-2 text-muted">{item.count.toLocaleString("fa-IR")} سفارش</span>
                <span className="mt-1 block text-xs text-muted">
                  تخفیف ثبت‌شده: {financeMoney(item.discount, item.currency)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">{live ? "جمع مبلغ: صفر؛ سفارشی با این فیلتر نیست." : "جمع مبلغ: —"}</p>
      )}

      {live && snapshot.rows.length === 0 ? (
        <p className="text-sm text-muted">سفارشی با این فیلتر پیدا نشد.</p>
      ) : null}

      {live && snapshot.rows.length ? (
        <ul className="space-y-2">
          {snapshot.rows.map((row) => (
            <li key={row.id} className="rounded-[var(--radius-md)] border border-line bg-elev p-4">
              <p className="font-medium text-ink">{row.title}</p>
              <p className="mt-1 text-xs text-muted" dir="ltr">
                {row.id}
              </p>
              <p className="mt-1 text-xs text-muted">
                {orderStateFa(row.state)} · {financeMoney(row.amount, row.currency)}
                {row.buyer ? ` · ${row.buyer}` : ""}
                {row.entitled ? " · دسترسی صادر شده" : " · دسترسی صادر نشده"}
              </p>
              <p className="mt-1 text-xs text-muted">
                ثبت {financeDateFa(row.createdAt)}
                {row.settledAt ? ` · تسویه ${financeDateFa(row.settledAt)}` : ""}
              </p>
            </li>
          ))}
        </ul>
      ) : null}

      {!live && !filterError ? <p className="text-sm text-muted">فهرست: —</p> : null}

      {live && snapshot.total != null && snapshot.total > snapshot.pageSize ? (
        <p className="text-sm text-muted">
          صفحه {query.page.toLocaleString("fa-IR")} از {Math.ceil(snapshot.total / snapshot.pageSize).toLocaleString("fa-IR")}
          {query.page > 1 ? (
            <>
              {" · "}
              <Link href={financeHref(path, query, { page: query.page - 1 })} className="text-accent">
                قبل
              </Link>
            </>
          ) : null}
          {query.page * snapshot.pageSize < snapshot.total ? (
            <>
              {" · "}
              <Link href={financeHref(path, query, { page: query.page + 1 })} className="text-accent">
                بعد
              </Link>
            </>
          ) : null}
        </p>
      ) : null}
    </main>
  );
}
