"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpLeft, ArrowUpRight, Check, ChevronLeft, ChevronRight, CircleAlert, Clock3, FileText, Network, Receipt, RefreshCw, X } from "lucide-react";
import Link from "../WorkspaceLink";
import { useWorkspace } from "../WorkspaceContext";
import { GraphPreview } from "./GraphPreview";
import { OrdersPreview } from "./OrdersPreview";
import { members, orders, settledAmount, snapshotAt, stateLabels, type SampleMember, type SampleOrder } from "./fixtures";

type Section = "home" | "graph" | "orders";
type ViewState = "ready" | "loading" | "empty" | "error";
type Detail = { kind: "order"; order: SampleOrder } | { kind: "member"; member: SampleMember } | { kind: "draft" };

export function DeskPreview() {
  const { t, locale, number } = useWorkspace();
  const [section, setSection] = useState<Section>("home");
  const [viewState, setViewState] = useState<ViewState>("ready");
  const [orderState, setOrderState] = useState("all");
  const [query, setQuery] = useState("");
  const [days, setDays] = useState(30);
  const [detail, setDetail] = useState<Detail | null>(null);
  const content = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const Arrow = locale === "fa" ? ArrowUpLeft : ArrowUpRight;
  const Chevron = locale === "fa" ? ChevronLeft : ChevronRight;
  const pending = orders.filter((order) => order.state === "awaiting_confirmation");
  const money = (amount: number) => `${number(amount)} ${t("ریال", "IRR")}`;
  const date = (value: string) => new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : "en-GB", { day: "numeric", month: "short", timeZone: "Asia/Tehran" }).format(new Date(value));
  function showOrders(state: string) { setOrderState(state); setQuery(""); setDays(30); setSection("orders"); setViewState("ready"); }
  useEffect(() => {
    if (!content.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const animation = content.current.animate([{ opacity: 0, transform: "translateY(5px)" }, { opacity: 1, transform: "translateY(0)" }], { duration: 180, easing: "ease-out" });
    return () => animation.cancel();
  }, [section, viewState]);
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (detail && !element.open) element.showModal();
    if (!detail && element.open) element.close();
  }, [detail]);
  const title = section === "home" ? t("میزکار", "Workspace") : section === "graph" ? t("روابط", "Relationships") : t("سفارش‌ها و دریافت‌ها", "Orders & receipts");
  const detailTitle = detail?.kind === "order" ? t("جزئیات سفارش", "Order details") : detail?.kind === "member" ? t(detail.member.name.fa, detail.member.name.en) : t("آزمون مسیر رشد", "Growth path assessment");

  return <main className="dp-preview" data-section={section}>
    <header className="dp-heading"><div><div className="dp-eyebrow"><span className="dp-sample">{t("دادهٔ نمونه", "SAMPLE DATA")}</span><span>{t("پیش‌نمایش طراحی", "Design preview")}</span></div><h1>{title}</h1></div><div className="wo-heading-actions"><Link className="ws-button" href="/workspace">{t("میزکار متصل", "Connected overview")}</Link><span className="dp-heading-date">{date(snapshotAt)}</span></div></header>
    <div className="dp-navigation"><nav aria-label={t("نماهای پیش‌نمایش", "Preview views")}>{([
      ["home", t("نمای کلی", "Overview"), Clock3], ["graph", t("روابط", "Relationships"), Network], ["orders", t("سفارش‌ها", "Orders"), Receipt],
    ] as const).map(([key, label, Icon]) => <button key={key} aria-pressed={section === key} onClick={() => { setSection(key); setViewState("ready"); }}><Icon size={16} />{label}</button>)}</nav>
      <label className="dp-view-state"><span className="dp-sr">{t("حالت نمایش", "Display state")}</span><select value={viewState} onChange={(event) => setViewState(event.target.value as ViewState)}><option value="ready">{t("حالت عادی", "Ready")}</option><option value="loading">{t("در حال دریافت", "Loading")}</option><option value="empty">{t("بدون داده", "Empty")}</option><option value="error">{t("خطا", "Error")}</option></select></label>
    </div>
    <div ref={content} data-view-state={viewState}>
      {viewState !== "ready" ? <section className="dp-panel dp-state" role="status" aria-live="polite" aria-busy={viewState === "loading"}>
        {viewState === "loading" ? <><div className="dp-skeleton" /><div className="dp-skeleton dp-skeleton-short" /><p>{t("در حال دریافت…", "Loading…")}</p></> : viewState === "empty" ? <><FileText size={28} /><h2>{t("هنوز چیزی اینجا نیست", "Nothing here yet")}</h2><button className="ws-button" onClick={() => setViewState("ready")}>{t("بازگشت به نمونه", "Back to sample")}</button></> : <><CircleAlert size={28} /><h2>{t("دریافت اطلاعات انجام نشد", "Could not load data")}</h2><p>{t("دادهٔ نامشخص", "Data unavailable")} <span>—</span></p><button className="ws-button" onClick={() => setViewState("ready")}><RefreshCw size={15} />{t("تلاش دوباره", "Try again")}</button></>}
      </section> : <>
        {section === "home" ? <>
          <section className="dp-metrics" aria-label={t("شاخص‌های نمونه", "Sample metrics")}>
            <button onClick={() => showOrders("awaiting_confirmation")}><span>{t("منتظر تأیید شما", "Awaiting your review")}<Arrow size={16} /></span><strong>{number(pending.length)}<small>{t("سفارش", "orders")}</small></strong><p>{money(pending.reduce((sum, order) => sum + order.amount, 0))}</p></button>
            <button onClick={() => showOrders("settled")}><span>{t("دریافت تسویه‌شده", "Settled receipts")}<Arrow size={16} /></span><strong>{number(settledAmount(orders))}</strong><p>{t("ریال · ۳۰ روز اخیر", "IRR · last 30 days")}</p></button>
            <button onClick={() => setSection("graph")}><span>{t("اعضای درخت معرف", "Members in referral tree")}<Arrow size={16} /></span><strong>{number(members.length)}<small>{t("حساب", "accounts")}</small></strong><p>{number(members.length - 1)} {t("رابطهٔ معرف", "referral links")}</p></button>
          </section>
          <div className="dp-home-grid">
            <section className="dp-panel dp-actions"><div className="dp-panel-heading"><div><p className="dp-eyebrow">{t("اولویت امروز", "TODAY’S PRIORITIES")}</p><h2>{t("نیازمند اقدام", "Needs your attention")}</h2></div><span className="dp-count">{number(pending.length + 1)}</span></div>
              <ul>{pending.map((order) => <li key={order.code}><button onClick={() => setDetail({ kind: "order", order })}><span className="dp-action-icon"><Receipt size={18} /></span><span className="dp-action-copy"><strong>{t("بررسی دریافت وجه", "Review payment receipt")}</strong><span>{t(order.buyer.fa, order.buyer.en)} · {money(order.amount)}</span></span><span className="dp-action-tag">{t("سفارش", "Order")}</span><Chevron size={16} /></button></li>)}
                <li><button onClick={() => setDetail({ kind: "draft" })}><span className="dp-action-icon dp-action-blue"><FileText size={18} /></span><span className="dp-action-copy"><strong>{t("تکمیل آزمون مسیر رشد", "Complete the growth assessment")}</strong><span>{t("پیش‌نویس آمادهٔ بازبینی", "Draft ready for review")}</span></span><span className="dp-action-tag">{t("آزمون", "Assessment")}</span><Chevron size={16} /></button></li>
              </ul>
              <div className="dp-panel-foot"><Check size={14} /><span>{t("اقدام‌ها به رکورد مبدأ می‌رسند", "Every action opens its source record")}</span></div>
            </section>
            <section className="dp-panel dp-map-card"><div className="dp-panel-heading"><div><p className="dp-eyebrow">{t("آدم‌ها و ارتباط‌ها", "PEOPLE & CONNECTIONS")}</p><h2>{t("درخت معرف", "Referral tree")}</h2></div><Network size={19} /></div>
              <svg viewBox="0 0 280 150" aria-hidden="true" className="dp-mini-graph"><path d="M140 32C140 72 65 55 65 100M140 32C140 72 215 55 215 100M65 100L28 135M65 100L100 135M215 100L180 135M215 100L250 135" /><circle cx="140" cy="32" r="13" /><circle cx="65" cy="100" r="10" /><circle cx="215" cy="100" r="10" />{[28,100,180,250].map((x) => <circle key={x} cx={x} cy="135" r="6" />)}</svg>
              <button className="dp-map-link" onClick={() => setSection("graph")}>{t("دیدن روابط", "Explore relationships")}<Arrow size={16} /></button>
            </section>
          </div>
          <section className="dp-panel dp-activity"><div className="dp-panel-heading"><h2>{t("آخرین فعالیت‌ها", "Recent activity")}</h2><span>{t("در نمونهٔ نمایشی", "In this sample")}</span></div><ol>{[orders[0],orders[2]].map((order) => <li key={order.code}><span className={`dp-activity-dot ${order.state === "settled" ? "dp-dot-settled" : ""}`} /><span><strong>{order.state === "settled" ? t("دسترسی محصول صادر شد", "Product access granted") : t("پیگیری پرداخت ثبت شد", "Payment reference submitted")}</strong><small>{t(order.buyer.fa, order.buyer.en)}</small></span><time dateTime={order.createdAt}>{date(order.createdAt)}</time><button onClick={() => setDetail({ kind: "order", order })} aria-label={`${t("جزئیات سفارش", "Order details")} ${order.code}`}><Arrow size={16} /></button></li>)}</ol></section>
        </> : section === "graph" ? <GraphPreview onSelect={(member) => setDetail({ kind: "member", member })} /> : <>
          <div className="dp-section-summary"><span>{t("دریافت تسویه‌شدهٔ نمونه", "Sample settled receipts")}</span><strong>{money(settledAmount(orders))}</strong><span>{t("۳۰ روز · مبلغ سفارش، نه سود", "30 days · order amount, not profit")}</span></div>
          <OrdersPreview state={orderState} setState={setOrderState} query={query} setQuery={setQuery} days={days} setDays={setDays} onSelect={(order) => setDetail({ kind: "order", order })} />
        </>}
      </>}
    </div>
    <footer className="dp-footer"><span>{t("پیش‌نمایش · بدون ثبت واقعی", "Preview · no live writes")}</span><span>{t("زمان دادهٔ نمونه", "Sample snapshot")}: {date(snapshotAt)}</span></footer>
    <dialog ref={dialog} className="dp-detail" aria-labelledby="dp-detail-title" onCancel={() => setDetail(null)} onClose={() => setDetail(null)} onClick={(event) => { if (event.target === event.currentTarget) setDetail(null); }}>
      <div className="dp-detail-inner"><header><span className="dp-sample">{t("دادهٔ نمونه", "SAMPLE DATA")}</span><button onClick={() => setDetail(null)} aria-label={t("بستن جزئیات", "Close details")}><X size={20} /></button></header><h2 id="dp-detail-title">{detailTitle}</h2>
        {detail?.kind === "order" ? <><p className="dp-detail-code" dir="ltr">{detail.order.code}</p><span className={`dp-status dp-status-${detail.order.state}`}>{t(stateLabels[detail.order.state].fa, stateLabels[detail.order.state].en)}</span><dl><div><dt>{t("محصول", "Product")}</dt><dd>{t(detail.order.product.fa, detail.order.product.en)}</dd></div><div><dt>{t("خریدار", "Buyer")}</dt><dd>{t(detail.order.buyer.fa, detail.order.buyer.en)}</dd></div><div><dt>{t("مبلغ سفارش", "Order amount")}</dt><dd>{money(detail.order.amount)}</dd></div><div><dt>{t("تاریخ ثبت", "Created")}</dt><dd>{date(detail.order.createdAt)}</dd></div>{detail.order.settledAt ? <div><dt>{t("زمان تسویه", "Settled")}</dt><dd>{date(detail.order.settledAt)}</dd></div> : null}</dl><button className="ws-button" onClick={() => { const order = detail.order; setDetail(null); showOrders("all"); setQuery(order.code); }}>{t("نمایش در فهرست", "Show in list")}<Arrow size={15} /></button></> : detail?.kind === "member" ? <><p className="dp-detail-code" dir="ltr">{detail.member.code}</p><dl><div><dt>{t("نوع رابطه", "Relationship")}</dt><dd>{t("معرف", "Referral")}</dd></div><div><dt>{t("کد معرف", "Referrer code")}</dt><dd dir="ltr">{detail.member.parent || "—"}</dd></div><div><dt>{t("معرفی مستقیم", "Direct referrals")}</dt><dd>{number(members.filter((member) => member.parent === detail.member.code).length)}</dd></div></dl></> : detail?.kind === "draft" ? <><span className="dp-status">{t("پیش‌نویس", "Draft")}</span><dl><div><dt>{t("اقدام بعدی", "Next action")}</dt><dd>{t("بازبینی سؤال‌ها و رضایت‌نامه", "Review questions and consent")}</dd></div><div><dt>{t("انتشار", "Publication")}</dt><dd>{t("منتشر نشده", "Not published")}</dd></div></dl></> : null}
      </div>
    </dialog>
  </main>;
}
