import Link from "next/link";
import { orderStateFa } from "@/lib/shop/states";
import { financeHref, financeMoney, type FinanceSnapshot } from "@/lib/finance/types";

const titles = {
  report: "گزارش مالی",
  orders: "مرکز سفارش",
  personal: "خریدهای من",
} as const;

export function FinanceDesk({ snapshot }: { snapshot: FinanceSnapshot }) {
  const path = snapshot.mode === "personal" ? "/account/purchases" : snapshot.mode === "report" ? "/workspace/finance" : "/workspace/shop/orders";
  const { query } = snapshot;

  return (
    <main className="mx-auto max-w-4xl space-y-8 px-4 py-8">
      <header>
        <h1 className="text-2xl font-bold text-ink">{titles[snapshot.mode]}</h1>
        <p className="mt-2 text-sm leading-7 text-muted">
          مبلغ به تومان از ریال ذخیره‌شده. دوره شمسی، منطقهٔ زمانی تهران. درگاه تازه اضافه نشده است.
        </p>
      </header>

      {snapshot.source !== "live" ? (
        <p className="rounded-[var(--radius-md)] border border-line bg-accent-soft px-4 py-3 text-sm text-ink" role="status">
          داده در دسترس نیست. جمع نمایشی صفر جای خالی نیامده است.
        </p>
      ) : null}

      <form method="get" className="flex flex-wrap gap-3 rounded-[var(--radius-md)] border border-line bg-elev p-4">
        <label className="text-sm text-muted">
          دوره
          <select name="period" defaultValue={query.period} className="ms-2 min-h-11 rounded-[var(--radius-sm)] border border-line bg-paper px-2 text-ink">
            <option value="month">این ماه</option>
            <option value="previous">ماه قبل</option>
            <option value="all">همه</option>
            <option value="custom">سفارشی</option>
          </select>
        </label>
        {snapshot.mode !== "report" ? (
          <label className="text-sm text-muted">
            وضعیت
            <select name="state" defaultValue={query.state} className="ms-2 min-h-11 rounded-[var(--radius-sm)] border border-line bg-paper px-2 text-ink">
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
            <select name="basis" defaultValue={query.basis} className="ms-2 min-h-11 rounded-[var(--radius-sm)] border border-line bg-paper px-2 text-ink">
              <option value="created">تاریخ ثبت</option>
              <option value="settled">تاریخ تسویه</option>
            </select>
          </label>
        ) : (
          <input type="hidden" name="basis" value="settled" />
        )}
        <label className="text-sm text-muted">
          جست‌وجو
          <input name="q" defaultValue={query.q} className="ms-2 min-h-11 rounded-[var(--radius-sm)] border border-line bg-paper px-2 text-ink" />
        </label>
        <button type="submit" className="min-h-11 rounded-[var(--radius-sm)] bg-accent px-4 text-sm font-medium text-accent-fg">
          صافی
        </button>
      </form>

      {snapshot.totals.length ? (
        <ul className="flex flex-wrap gap-3">
          {snapshot.totals.map((item) => (
            <li key={item.currency} className="rounded-[var(--radius-md)] border border-line bg-elev px-4 py-3 text-sm">
              <Link href={item.href} className="text-ink">
                <strong>{financeMoney(item.amount, item.currency)}</strong>
                <span className="ms-2 text-muted">{item.count.toLocaleString("fa-IR")} سفارش</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      {snapshot.rows.length === 0 ? (
        <p className="text-sm text-muted">سفارشی در این صافی نیست.</p>
      ) : (
        <ul className="space-y-2">
          {snapshot.rows.map((row) => (
            <li key={row.id} className="rounded-[var(--radius-md)] border border-line bg-elev p-4">
              <p className="font-medium text-ink">{row.title}</p>
              <p className="mt-1 text-xs text-muted">
                {orderStateFa(row.state)} · {financeMoney(row.amount, row.currency)}
                {row.buyer ? ` · ${row.buyer}` : ""}
                {row.entitled ? " · دسترسی محصول" : ""}
              </p>
            </li>
          ))}
        </ul>
      )}

      {snapshot.total != null && snapshot.total > snapshot.pageSize ? (
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
