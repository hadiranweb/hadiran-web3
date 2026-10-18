"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpLeft, ArrowUpRight, FileCheck, FlaskConical, Receipt, RefreshCw } from "lucide-react";
import Link from "@/components/workspace/WorkspaceLink";
import { useWorkspace } from "@/components/workspace/WorkspaceContext";
import { personalKinds, type PersonalItem, type PersonalKind, type PersonalSnapshot } from "@/lib/workspace/role-home-types";
import { orderStateFa } from "@/lib/shop/states";
import "@/components/workspace/role-home.css";
const labels: Record<PersonalKind, [string,string]> = { orders: ["سفارش‌های من","My orders"], inProgress: ["آزمون‌های ناتمام","Unfinished assessments"], reports: ["گزارش‌های من","My reports"] };
const icons = { orders: Receipt, inProgress: FlaskConical, reports: FileCheck };
export function PersonalOverview({ snapshot, listOnly = false }: { snapshot: PersonalSnapshot; listOnly?: boolean }) {
  const { t, number, locale } = useWorkspace();
  const router = useRouter(); const [busy, refresh] = useTransition();
  const live = snapshot.source === "live"; const Arrow = locale === "fa" ? ArrowUpLeft : ArrowUpRight;
  const date = (value: string | null) => value ? new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : "en-GB", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(value)) : "—";
  function row(item: PersonalItem) {
    const Icon = icons[item.kind];
    const state = item.kind === "orders" ? orderStateFa(item.status) : item.kind === "reports" ? t("آخرین نوبت ثبت‌شده", "Latest submitted attempt") : t("ادامهٔ آزمون", "Continue assessment");
    const content = <><span className="rh-icon"><Icon size={18}/></span><span className="rh-copy"><strong>{item.title}</strong><small>{state}{item.amount != null ? ` · ${number(item.amount)} ${item.currency === "IRR" ? t("ریال","IRR") : item.currency}` : ""}{!item.href ? ` · ${t("فعلاً در دسترس نیست", "Currently unavailable")}` : ""}</small></span><time dateTime={item.updatedAt || undefined}>{date(item.updatedAt)}</time>{item.href ? <Arrow size={16}/> : null}</>;
    return <li key={item.key} data-personal-key={item.key}>{item.href ? <Link className="rh-row" href={item.href}>{content}</Link> : <div className="rh-row">{content}</div>}</li>;
  }
  return <section className="rh-home personal-home" data-source={snapshot.source} aria-busy={busy}>
    <header className="rh-heading"><h2>{listOnly ? t("فهرست من","My records") : t("کارهای من","My workspace")}</h2><div className="rh-tools"><Link className="rh-button" href={listOnly ? "/account" : "#account-profile"}>{listOnly ? t("خانهٔ من","My home") : t("حساب من","My account")}</Link><button className="rh-button" disabled={busy} onClick={()=>refresh(()=>router.refresh())}><RefreshCw size={15}/>{t("به‌روزرسانی","Refresh")}</button></div></header>
    {!live ? <p className="rh-warning" role="status">{t("داده‌ها در دسترس نیستند؛ دادهٔ نمونه جایگزین نشده است.","Data is unavailable; no sample records have been substituted.")}</p> : null}
    <div className="rh-metrics">{personalKinds.map(kind=><Link className="rh-metric" data-personal-metric={kind} href={`/account/activity?kind=${kind}`} key={kind}><span>{t(...labels[kind])}<Arrow size={16}/></span><strong>{snapshot.counts[kind] == null ? "—" : number(snapshot.counts[kind]!)}</strong></Link>)}</div>
    <div className="rh-groups">{(listOnly && snapshot.filter ? [snapshot.filter] : personalKinds).map(kind=><section className="rh-panel" key={kind}><div className="rh-section-heading"><h2>{t(...labels[kind])}</h2>{!listOnly ? <Link href={`/account/activity?kind=${kind}`}>{t("همه","View all")}</Link> : null}</div>{snapshot.items.some(item=>item.kind===kind) ? <ul className="rh-list">{snapshot.items.filter(item=>item.kind===kind).map(row)}</ul> : <p className="rh-empty">{live ? t("رکوردی در این فهرست نیست.","No records in this list.") : "—"}</p>}</section>)}</div>
    {listOnly && snapshot.filter && live ? <nav className="rh-pages" aria-label={t("صفحه‌ها","Pages")}>{snapshot.page>1 ? <Link className="rh-button" href={`/account/activity?kind=${snapshot.filter}&page=${snapshot.page-1}`}>{t("قبلی","Previous")}</Link> : null}<span>{t("صفحه","Page")} {number(snapshot.page)}</span>{snapshot.page*snapshot.pageSize < (snapshot.counts[snapshot.filter] ?? 0) ? <Link className="rh-button" href={`/account/activity?kind=${snapshot.filter}&page=${snapshot.page+1}`}>{t("بعدی","Next")}</Link> : null}</nav> : null}
    <p className="rh-source">{t("آخرین دریافت موفق","Last successful read")}: {date(snapshot.asOf)}{snapshot.asOf ? " UTC" : ""} · {t("آزمون‌ها: نوبت جاری هر آزمون","Assessments: current attempt per instrument")}</p>
  </section>;
}
