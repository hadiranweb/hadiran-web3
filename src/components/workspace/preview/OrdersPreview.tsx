"use client";

import { ArrowUpLeft, ArrowUpRight, Search } from "lucide-react";
import { useWorkspace } from "../WorkspaceContext";
import { filterOrders, stateLabels, type SampleOrder } from "./fixtures";

export function OrdersPreview({ state, setState, query, setQuery, days, setDays, onSelect }: {
  state: string; setState: (value: string) => void; query: string; setQuery: (value: string) => void;
  days: number; setDays: (value: number) => void; onSelect: (order: SampleOrder) => void;
}) {
  const { t, locale, number } = useWorkspace();
  const rows = filterOrders(state, query, days);
  const Arrow = locale === "fa" ? ArrowUpLeft : ArrowUpRight;
  return <section className="dp-panel" aria-label={t("فهرست سفارش‌های نمونه", "Sample order list")}>
    <div className="dp-filters">
      <label className="dp-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("جست‌وجوی سفارش یا نام", "Search orders or names")} aria-label={t("جست‌وجوی سفارش", "Search orders")} /></label>
      <label><span className="dp-sr">{t("وضعیت سفارش", "Order status")}</span><select value={state} onChange={(event) => setState(event.target.value)}><option value="all">{t("همهٔ وضعیت‌ها", "All statuses")}</option>{Object.entries(stateLabels).map(([key, label]) => <option value={key} key={key}>{t(label.fa, label.en)}</option>)}</select></label>
      <label><span className="dp-sr">{t("بازهٔ زمانی", "Date range")}</span><select value={days} onChange={(event) => setDays(Number(event.target.value))}><option value={30}>{t("۳۰ روز اخیر", "Last 30 days")}</option><option value={7}>{t("۷ روز اخیر", "Last 7 days")}</option></select></label>
    </div>
    <div className="dp-list-caption"><span>{number(rows.length)} {t("سفارش", "orders")}</span><span>{t("واحد: ریال", "Currency: IRR")}</span></div>
    {rows.length ? <ul className="dp-order-list">{rows.map((order) => <li key={order.code}><button className="dp-order-row" onClick={() => onSelect(order)}>
      <span className="dp-order-name"><small dir="ltr">{order.code}</small><strong>{t(order.product.fa, order.product.en)}</strong><span>{t(order.buyer.fa, order.buyer.en)}</span></span>
      <span className={`dp-status dp-status-${order.state}`}>{t(stateLabels[order.state].fa, stateLabels[order.state].en)}</span>
      <span className="dp-order-amount"><strong>{number(order.amount)}</strong><small>{t("ریال", "IRR")}</small></span><Arrow size={17} className="dp-muted" />
    </button></li>)}</ul> : <div className="dp-state"><Search size={24} /><h2>{t("سفارشی پیدا نشد", "No matching orders")}</h2><button className="ws-button" onClick={() => { setQuery(""); setState("all"); setDays(30); }}>{t("پاک‌کردن فیلترها", "Clear filters")}</button></div>}
  </section>;
}
