"use client";
import Link from "./WorkspaceLink";
import { ArrowUpLeft, ArrowUpRight, BookOpen, FlaskConical, Users, ShoppingBag, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { useWorkspace } from "./WorkspaceContext";
import { demoKeys, useDemoItems } from "./useDemoItems";
import type { PulseCounts } from "@/lib/workspace/pulse";
import type { WorkspaceData } from "@/lib/workspace/types";

export function Overview({ data, pulse }: { data: WorkspaceData; pulse: PulseCounts }) {
  const { t, locale, number, demo } = useWorkspace();
  const { items: knowledge } = useDemoItems(demoKeys.knowledge, data.knowledge, false);
  const { items: projects } = useDemoItems(demoKeys.projects, data.projects, demo);
  const { items: collaborations } = useDemoItems(demoKeys.collaborations, data.collaborations, demo);

  const Arrow = locale === "fa" ? ArrowUpLeft : ArrowUpRight;
  const Chevron = locale === "fa" ? ChevronLeft : ChevronRight;
  const modules = [
    { fa: "دانشنامه", en: "Knowledge", icon: BookOpen, count: knowledge.length, href: "/workspace/knowledge", note: t("یادداشت‌ها و محتوای ثبت‌شده", "Your notes and published knowledge"), tone: "teal" },
    { fa: "پروژه‌ها", en: "Projects", icon: FlaskConical, count: projects.length, href: "/workspace/projects", note: t("مسیر ایده تا اجرا", "From ideas to delivery"), tone: "blue" },
    { fa: "همکاری‌ها", en: "Collaborations", icon: Users, count: collaborations.length, href: "/workspace/collaborations", note: t("پیشنهادها و درخواست‌های دریافتی", "Incoming applications and proposals"), tone: "amber" },
    { fa: "محصولات", en: "Products", icon: ShoppingBag, count: data.productCount ?? null, href: "/workspace/shop", note: t("کالا، سفارش و تنظیمات دریافت", "Listings, orders and payment settings"), tone: "purple" },
  ];
  return <main className="ws-page">
    <div className="ws-page-heading"><div><p className="ws-overline">{t("همه‌چیز در یک نگاه", "YOUR WORKSPACE AT A GLANCE")}</p><h1>{t("میز کار", "Overview")}</h1><p>{t("یک فضای متمرکز برای دانش، پروژه‌ها و کارهای پیش رو.", "A focused home for your knowledge, projects and next steps.")}</p></div><Link className="ws-button ws-primary" href="/workspace/capture"><Plus size={17} />{t("ثبت یادداشت", "Create a note")}</Link></div>
    {data.source === "error" ? <p className="ws-notice ws-error" role="alert">{t("دریافت داده‌ها ممکن نشد؛ اطلاعات نمونه جایگزین داده واقعی نشده‌اند.", "Data could not be loaded. Sample data has not replaced your real records.")}</p> : null}
    <section className="ws-canonical-pulse" aria-label={t("چرخهٔ دانش", "Knowledge lifecycle")}>{([
      [t("ثبت خام", "Captured"), pulse.captured, "/workspace/knowledge"],
      [t("آمادهٔ ارتقا", "Ready to promote"), pulse.readyToPromote, "/workspace/knowledge"],
      [t("حافظهٔ عمومی", "Public memory"), pulse.publicMemory, "/knowledge"],
      [t("نمود دانشنامه", "Knowledge projections"), pulse.knowledgeProjections, "/knowledge"],
    ] as const).map(([label,value,href]) => <Link href={href} key={label}><span>{label}</span><strong>{value == null ? "—" : number(value)}</strong></Link>)}</section>
    <div className="ws-metrics">{modules.map((m) => <Link href={m.href} className="ws-metric" key={m.href}><div><span className={`ws-module-icon ws-tone-${m.tone}`}><m.icon size={20} /></span><Arrow size={16} className="ws-muted" /></div><strong>{data.source === "error" && m.href !== "/workspace/shop" ? "—" : m.count == null ? "—" : number(m.count)}</strong><h2>{t(m.fa, m.en)}</h2><p>{m.note}</p></Link>)}</div>
    <div className="ws-overview-grid"><section className="ws-panel"><div className="ws-panel-title"><h2>{t("آخرین یادداشت‌ها", "Recent notes")}</h2><Link href="/workspace/knowledge">{t("همه یادداشت‌ها", "View all")}<Chevron size={14} /></Link></div>{knowledge.length ? knowledge.slice(0, 5).map((item) => <Link href={item.editUrl || "/workspace/knowledge"} className="ws-recent-row" key={item.id}><span className="ws-record-icon"><BookOpen size={17} /></span><span><strong>{locale === "en" ? item.titleEn || item.title : item.title}</strong><small>{({ article: t("مقاله", "Article"), note: t("یادداشت", "Note"), research: t("پژوهش", "Research"), idea: t("ایده", "Idea"), wiki: t("ویکی", "Wiki") } as Record<string, string>)[item.category] || item.category}</small></span><Chevron size={16} /></Link>) : <p className="ws-empty">{t("هنوز یادداشتی ثبت نشده است.", "No notes yet.")}</p>}</section>
    <section className="ws-panel ws-next-steps"><p className="ws-overline">{t("گام بعدی", "NEXT STEP")}</p><h2>{t("چیزی برای ثبت‌کردن داری؟", "Something worth capturing?")}</h2><p>{t("ایده‌ها را به یادداشت تبدیل کن؛ بعد می‌توانی آن‌ها را کامل‌تر کنی.", "Turn an idea into a note. You can refine it as your thinking develops.")}</p><Link className="ws-button ws-primary" href="/workspace/capture"><Plus size={16} />{t("یادداشت جدید", "New note")}</Link><Link className="ws-text-link" href="/workspace/projects">{t("مرور پروژه‌ها", "Explore projects")}<Chevron size={15} /></Link></section></div>
    <section className="ws-panel ws-bottom-panel"><div className="ws-panel-title"><h2>{t("پیشنهادهای همکاری", "Collaboration inbox")}</h2><Link href="/workspace/collaborations">{t("بازکردن صندوق", "Open inbox")}<Chevron size={14} /></Link></div><div className="ws-inbox-summary"><span className="ws-module-icon ws-tone-amber"><Users size={22} /></span><div><strong>{number(collaborations.filter((i) => i.status === "submitted").length)} {t("درخواست تازه", "new applications")}</strong><p>{t("درخواست‌ها را بخوان و مرحلهٔ بررسی را مشخص کن.", "Read applications and move them to the next review stage.")}</p></div></div></section>
  </main>;
}
