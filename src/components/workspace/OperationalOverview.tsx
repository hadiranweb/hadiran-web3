"use client";

import { useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpLeft, ArrowUpRight, Bot, Check, CircleAlert, FileText, FlaskConical, Receipt, RefreshCw, Users } from "lucide-react";
import Link from "./WorkspaceLink";
import { useWorkspace } from "./WorkspaceContext";
import { actionKinds, type ActionKind, type OperationalItem, type OperationalSnapshot } from "@/lib/workspace/operations-types";

const labels: Record<ActionKind, [string, string]> = {
  orders: ["بررسی دریافت وجه", "Review payment receipts"],
  notes: ["بازبینی یادداشت‌ها", "Review notes"],
  collaborations: ["درخواست‌های همکاری", "Collaboration requests"],
  analyzers: ["تکمیل آزمون‌های من", "Complete my draft assessments"],
  bots: ["بررسی خطای ربات‌ها", "Review bot errors"],
};
const icons = { orders: Receipt, notes: FileText, collaborations: Users, analyzers: FlaskConical, bots: Bot };

export function OperationalOverview({ snapshot, children, listOnly = false }: { snapshot: OperationalSnapshot; children?: ReactNode; listOnly?: boolean }) {
  const { t, locale, number } = useWorkspace();
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();
  const live = snapshot.source === "live";
  const Arrow = locale === "fa" ? ArrowUpLeft : ArrowUpRight;
  const refresh = () => startRefresh(() => router.refresh());
  const total = live ? actionKinds.reduce((sum, kind) => sum + (snapshot.counts[kind] ?? 0), 0) : null;
  const date = (value: string | null) => value ? new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : "en-GB", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC" }).format(new Date(value)) : "—";
  function itemRow(item: OperationalItem) {
    const Icon = icons[item.kind];
    return <li key={item.key}><Link href={item.href} className="wo-action" data-action-kind={item.kind}>
      <span className="dp-action-icon"><Icon size={18} /></span><span className="dp-action-copy"><strong>{item.title}</strong><span>{t(...labels[item.kind])}{item.amount != null ? ` · ${number(item.amount)} ${item.currency === "IRR" ? t("ریال", "IRR") : item.currency}` : ""}</span></span><Arrow size={16} />
    </Link></li>;
  }
  return <main className="dp-preview wo-overview" data-source={snapshot.source} aria-busy={refreshing}>
    <header className="dp-heading"><div><div className="dp-eyebrow"><span className="dp-sample">{live ? t("دادهٔ پایگاه", "DATABASE DATA") : t("بدون اتصال داده", "DATA UNAVAILABLE")}</span></div><h1>{listOnly ? t("نیازمند اقدام", "Needs your attention") : t("میز کار", "Overview")}</h1></div><div className="wo-heading-actions"><Link className="ws-button" href="/workspace/preview">{t("نمونهٔ بصری مرحلهٔ ۲", "Stage 2 visual preview")}</Link><button className="ws-button" onClick={refresh} disabled={refreshing}><RefreshCw size={15} />{t("به‌روزرسانی", "Refresh")}</button></div></header>
    {!live ? <section className="wo-unavailable" role="status"><CircleAlert size={20} /><div><strong>{snapshot.source === "preview" ? t("این محیط به پایگاه داده وصل نیست", "This environment has no database") : t("داده‌ها در دسترس نیستند", "Data is unavailable")}</strong><p>{t("دادهٔ نمونه جایگزین اطلاعات واقعی نشده است.", "Sample data has not replaced real records.")}</p></div></section> : null}
    {!listOnly ? <section className="dp-metrics wo-metrics" aria-label={t("کارهای منتظر بررسی", "Pending work")}>
      {(["orders", "notes", "collaborations"] as const).map((kind) => <Link key={kind} href={`/workspace/actions?kind=${kind}`} data-metric={kind}><span>{t(...labels[kind])}<Arrow size={16} /></span><strong>{snapshot.counts[kind] == null ? "—" : number(snapshot.counts[kind]!)}</strong><p>{t("مشاهدهٔ رکوردهای مبدأ", "View source records")}</p></Link>)}
    </section> : null}
    <div className={listOnly ? "" : "dp-home-grid wo-home-grid"}>
      <section className="dp-panel dp-actions"><div className="dp-panel-heading"><div><p className="dp-eyebrow">{t("صف کارها", "WORK QUEUE")}</p><h2>{listOnly && snapshot.filter ? t(...labels[snapshot.filter]) : t("نیازمند اقدام", "Needs your attention")}</h2></div><span className="dp-count">{listOnly && snapshot.filter ? snapshot.counts[snapshot.filter] == null ? "—" : number(snapshot.counts[snapshot.filter]!) : total == null ? "—" : number(total)}</span></div>
        {listOnly ? <nav className="wo-filter-nav" aria-label={t("نوع اقدام", "Action type")}>{actionKinds.map((kind) => <Link key={kind} href={`/workspace/actions?kind=${kind}`} aria-current={snapshot.filter === kind ? "page" : undefined}>{t(...labels[kind])}<span>{snapshot.counts[kind] == null ? "—" : number(snapshot.counts[kind]!)}</span></Link>)}</nav> : null}
        {snapshot.actions.length ? <ul>{snapshot.actions.map(itemRow)}</ul> : <div className="wo-empty">{live ? <><Check size={24} /><p>{t("در این فهرست کاری منتظر بررسی نیست", "No work pending in this list")}</p></> : <p>—</p>}</div>}
        {listOnly && snapshot.filter && live ? <nav className="wo-pagination" aria-label={t("صفحه‌های اقدام", "Queue pages")}>
          {snapshot.page > 1 ? <Link className="ws-button" href={`/workspace/actions?kind=${snapshot.filter}&page=${snapshot.page - 1}`}>{t("قبلی", "Previous")}</Link> : null}<span>{t("صفحه", "Page")} {number(snapshot.page)}</span>{snapshot.page * snapshot.pageSize < (snapshot.counts[snapshot.filter] ?? 0) ? <Link className="ws-button" href={`/workspace/actions?kind=${snapshot.filter}&page=${snapshot.page + 1}`}>{t("بعدی", "Next")}</Link> : null}
        </nav> : <div className="dp-panel-foot">{t("ابتدا پرداخت‌ها؛ سپس یادداشت‌ها، همکاری‌ها، آزمون‌ها و ربات‌ها", "Payments first, then notes, collaborations, assessments and bots")}</div>}
      </section>
      {!listOnly ? <section className="dp-panel wo-queue-directory"><div className="dp-panel-heading"><h2>{t("همهٔ اقدام‌ها", "All pending work")}</h2></div><ul>{actionKinds.map((kind) => { const Icon = icons[kind]; return <li key={kind}><Link href={`/workspace/actions?kind=${kind}`}><Icon size={17} /><span>{t(...labels[kind])}</span><strong>{snapshot.counts[kind] == null ? "—" : number(snapshot.counts[kind]!)}</strong></Link></li>; })}</ul></section> : null}
    </div>
    {!listOnly ? <section className="dp-panel dp-activity wo-activity"><div className="dp-panel-heading"><h2>{t("آخرین تغییر یادداشت‌های من", "My recently updated notes")}</h2><Link href="/workspace/knowledge">{t("همهٔ یادداشت‌ها", "All notes")}</Link></div>{snapshot.recent.length ? <ol>{snapshot.recent.map((item) => <li key={item.key}><span className="dp-activity-dot dp-dot-settled" /><span><strong>{item.title}</strong></span><time dateTime={item.updatedAt || undefined}>{date(item.updatedAt)}</time><Link className="ws-icon-button" href={item.href} aria-label={`${t("بازکردن", "Open")} ${item.title}`}><Arrow size={16} /></Link></li>)}</ol> : <div className="wo-empty"><p>{live ? t("یادداشتی ثبت نشده است", "No notes yet") : "—"}</p></div>}</section> : null}
    {children}
    <footer className="dp-footer"><span>{live ? t("آخرین دریافت موفق", "Last successful read") : t("دادهٔ نامشخص، نه صفر", "Unavailable, not zero")}: {date(snapshot.asOf)}{snapshot.asOf ? " UTC" : ""}</span><Link href={listOnly ? "/workspace" : "/workspace/capture"}>{listOnly ? t("بازگشت به میزکار", "Back to overview") : t("ثبت یادداشت", "Create a note")}</Link></footer>
  </main>;
}
