"use client";

import { RefreshCw, ArrowUpLeft, ReceiptText } from "lucide-react";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "@/components/workspace/WorkspaceLink";
import { useWorkspace } from "@/components/workspace/WorkspaceContext";
import { ORDER_STATES, orderStateFa } from "@/lib/shop/states";
import { financeHref, financeMoney, type FinanceSnapshot } from "@/lib/finance/types";
import "./finance.css";

const stateEn: Record<string,string> = {
  awaiting_payment_reference:"Awaiting reference",awaiting_confirmation:"Awaiting confirmation",
  settled:"Settled",declined:"Declined",cancelled:"Cancelled",
};
export function FinanceCenter({ snapshot }: { snapshot: FinanceSnapshot }) {
  const { t,locale,number } = useWorkspace();
  const router = useRouter(), [busy,refresh] = useTransition();
  const { query,mode } = snapshot, live = snapshot.source === "live";
  const personal = mode === "personal", report = mode === "report";
  const path = personal ? "/account/purchases" : report ? "/workspace/finance" : "/workspace/shop/orders";
  const state = (value:string) => t(orderStateFa(value),stateEn[value] || value);
  const date = (value:string|null, time=false) => value ? new Intl.DateTimeFormat(locale === "fa" ? "fa-IR-u-ca-persian" : "en-GB-u-ca-persian", {
    timeZone:"Asia/Tehran",dateStyle:"medium",...(time ? {timeStyle:"short" as const} : {}),
  }).format(new Date(value)) : "—";
  return (
    <main className={`fc-page ${personal ? "fc-personal" : "ws-page"}`} data-source={snapshot.source} aria-busy={busy}>
      <header className="fc-heading">
        <div><p className="ws-overline">{t("سفارش و دسترسی","ORDERS & ACCESS")}</p>
          <h1>{personal ? t("خریدهای من","My purchases") : report ? t("گزارش تسویه‌ها","Settlement report") : t("مرکز سفارش","Order center")}</h1>
          <p>{report ? t("بر اساس زمان تسویه؛ نه شمارهٔ پیگیری و نه سود خالص.","Based on settlement time, not submitted references or net profit.") : t("وضعیت واقعی سفارش، مبلغ ثبت‌شده و دسترسی صادرشده.","Recorded order state, purchase amount and issued access.")}</p>
        </div>
        <div className="fc-tools">{snapshot.mode === "report" && <Link className="ws-button" href="/workspace/finance/lab">{t("آزمایشگاه معماری مالی", "Finance architecture lab")}</Link>}
          {personal ? <Link prefetch={false} className="ws-button" href="/account">{t("حساب من","My account")}</Link> : <Link prefetch={false} className="ws-button" href={report ? "/workspace/shop/orders?period=all" : "/workspace/finance"}>{report ? t("مرکز سفارش","Order center") : t("گزارش مالی","Financial report")}</Link>}
          {!personal ? <Link prefetch={false} className="ws-button" href="/workspace/shop">{t("مدیریت کالاها","Manage products")}</Link> : null}
          <button className="ws-button" disabled={busy} onClick={()=>refresh(()=>router.refresh())}><RefreshCw size={15}/>{t("به‌روزرسانی","Refresh")}</button>
        </div>
      </header>
      <form className="fc-filters ws-panel" action={path} key={JSON.stringify(query)}>
        <label>{t("دورهٔ شمسی","Persian period")}<select name="period" defaultValue={query.period}>
          <option value="month">{t("ماه جاری","Current month")}</option><option value="previous">{t("ماه قبل","Previous month")}</option>
          <option value="all">{t("همهٔ زمان‌ها","All time")}</option><option value="custom">{t("بازهٔ دلخواه","Custom dates")}</option>
        </select></label>
        <label>{t("از · برای بازهٔ دلخواه","From · custom period")}<input name="from" defaultValue={query.from} placeholder="1405-01-01" dir="ltr" maxLength={10}/></label>
        <label>{t("تا · شامل این روز","Through · inclusive")}<input name="to" defaultValue={query.to} placeholder="1405-01-31" dir="ltr" maxLength={10}/></label>
        {report ? <><input type="hidden" name="state" value="settled"/><input type="hidden" name="basis" value="settled"/></> : <>
          <label>{t("وضعیت","Status")}<select name="state" defaultValue={query.state}><option value="all">{t("همه","All")}</option>{ORDER_STATES.map(value=><option key={value} value={value}>{state(value)}</option>)}</select></label>
          <label>{t("مبنای تاریخ","Date basis")}<select name="basis" defaultValue={query.basis}><option value="created">{t("ثبت سفارش","Order creation")}</option><option value="settled">{t("تسویه","Settlement")}</option></select></label>
        </>}
        <label>{t("محصول · شناسه یا اسلاگ","Product ID or slug")}<input name="product" defaultValue={query.product} maxLength={128}/></label>
        <label>{t("واحد ذخیره‌شده","Stored currency")}<input name="currency" defaultValue={query.currency} maxLength={8} placeholder="IRR / USD" dir="ltr"/></label>
        <label>{t("عنوان یا شمارهٔ سفارش","Title or order reference")}<input name="q" defaultValue={query.q} maxLength={80}/></label>
        <div className="fc-filter-actions"><button className="ws-button ws-primary" type="submit">{t("اعمال فیلتر","Apply filters")}</button><Link prefetch={false} className="ws-text-link" href={path}>{t("پاک‌کردن","Reset")}</Link></div>
      </form>
      <p className="fc-source">{t("تقویم شمسی · وقت تهران","Persian calendar · Tehran time")} · {query.period === "all" ? t("همهٔ زمان‌ها","All time") : <bdi dir="ltr">{query.from} — {query.to}</bdi>} · {query.basis === "settled" ? t("مبنای تاریخ: تسویه","Date basis: settlement") : t("مبنای تاریخ: ثبت سفارش","Date basis: creation")}<br/>{t("مبلغ IRR با تبدیل دقیق به تومان نمایش داده می‌شود؛ سایر واحدها جدا هستند.","IRR is displayed exactly in toman; other currencies remain separate.")}</p>
      {!live ? <p className="fc-notice" role="status">{t("داده‌ها در دسترس نیستند؛ مبلغ و شمارش نامشخص است و دادهٔ نمونه جایگزین نشده.","Data is unavailable. Amounts and counts are unknown; no sample data was substituted.")}</p> : null}
      {snapshot.undatedSettled ? <p className="fc-notice" role="status">{number(snapshot.undatedSettled)} {t("سفارش تسویه‌شده تاریخ تسویه ندارد؛ در گزارش زمان تسویهٔ محدود به دوره وارد نمی‌شود.","settled orders have no settlement timestamp and are excluded from date-bounded settlement reports.")}</p> : null}
      {!report ? <section aria-label={t("تفکیک وضعیت در بازه، پیش از فیلتر وضعیت","Status breakdown before status filter")} className="fc-states">{ORDER_STATES.map(value=><Link prefetch={false} key={value} href={financeHref(path,query,{state:value,page:1})} className="ws-panel fc-state" aria-current={query.state===value ? "page" : undefined} data-finance-state={value}><span>{state(value)}</span><strong>{live ? number(snapshot.stateCounts?.[value] || 0) : "—"}</strong></Link>)}</section> : null}
      <section className="fc-money" aria-label={t("جمع مبلغ به تفکیک واحد","Amounts by currency")}>
        {snapshot.totals.map(total=><Link prefetch={false} key={total.currency} href={total.href} className="ws-panel fc-money-card" data-currency={total.currency}>
          <span>{report ? t("مبلغ تسویه‌شده","Settled amount") : t("جمع مبلغ این سفارش‌ها","Amount of matching orders")} · {total.currency}</span>
          <strong><bdi dir="auto">{financeMoney(total.amount,total.currency,locale)}</bdi></strong>
          <small>{number(total.count)} {t("سفارش","orders")} · {t("تخفیف ثبت‌شده","Recorded discount")}: {financeMoney(total.discount,total.currency,locale)}</small>
          <span className="fc-drill">{t("سفارش‌های مبدأ","Source orders")} <ArrowUpLeft size={15}/></span>
        </Link>)}
        {!snapshot.totals.length ? <p className="fc-empty">{live ? t("جمع مبلغ: صفر؛ سفارشی با این فیلتر نیست.","Amount: zero; no orders match these filters.") : t("جمع مبلغ: —","Amount: —")}</p> : null}
      </section>
      {!report ? <p className="fc-source">{t("جمع بالا شامل سفارش‌های تسویه‌نشده هم هست؛ گزارش مالی فقط تسویه‌ها را جدا می‌کند.","The totals above include unsettled orders. Financial reporting isolates settlements.")}</p> : null}
      <section className="ws-panel fc-orders" aria-labelledby="fc-list-title">
        <div className="fc-list-heading"><h2 id="fc-list-title">{t("سفارش‌های مبدأ","Source orders")}</h2><span>{snapshot.total == null ? "—" : number(snapshot.total)} {t("نتیجه","results")}</span></div>
        <ol>{snapshot.rows.map(row=><li key={row.id} data-finance-order={row.id}>
          <div className="fc-order-title"><ReceiptText size={19}/><div><h3><Link prefetch={false} href={personal ? `/shop/orders/${encodeURIComponent(row.id)}` : `/workspace/shop/orders/${encodeURIComponent(row.id)}`}>{row.title}</Link></h3><span dir="ltr">{row.id}</span>{!personal ? <small>{row.buyer}</small> : null}</div></div>
          <dl><div><dt>{t("وضعیت","Status")}</dt><dd>{state(row.state)}</dd></div><div><dt>{t("مبلغ ثبت‌شده","Recorded amount")}</dt><dd>{financeMoney(row.amount,row.currency,locale)}</dd></div><div><dt>{t("تخفیف ثبت‌شده","Recorded discount")}</dt><dd>{financeMoney(row.discount,row.currency,locale)}</dd></div><div><dt>{t("دسترسی محصول","Product access")}</dt><dd>{row.entitled ? t("صادر شده","Issued") : t("صادر نشده","Not issued")}</dd></div><div><dt>{t("ثبت","Created")}</dt><dd>{date(row.createdAt)}</dd></div><div><dt>{t("تسویه","Settled")}</dt><dd>{date(row.settledAt)}</dd></div></dl>
          <Link prefetch={false} className="ws-text-link" href={personal ? `/shop/orders/${encodeURIComponent(row.id)}` : `/workspace/shop/orders/${encodeURIComponent(row.id)}`}>{t("جزئیات و پیگیری","Details & history")} <ArrowUpLeft size={14}/></Link>
        </li>)}</ol>
        {!snapshot.rows.length ? <p className="fc-empty">{live ? t("سفارشی با این فیلتر پیدا نشد.","No orders match these filters.") : "—"}</p> : null}
      </section>
      {live ? <nav className="fc-pages" aria-label={t("صفحه‌های سفارش","Order pages")}>{query.page>1 ? <Link prefetch={false} className="ws-button" href={financeHref(path,query,{page:query.page-1})}>{t("قبلی","Previous")}</Link> : null}<span>{t("صفحه","Page")} {number(query.page)}</span>{query.page*snapshot.pageSize < (snapshot.total || 0) ? <Link prefetch={false} className="ws-button" href={financeHref(path,query,{page:query.page+1})}>{t("بعدی","Next")}</Link> : null}</nav> : null}
      <p className="fc-source">{t("آخرین دریافت موفق","Last successful read")}: {date(snapshot.asOf,true)} · Asia/Tehran</p>
    </main>
  );
}
