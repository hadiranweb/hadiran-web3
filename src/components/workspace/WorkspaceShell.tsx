"use client";

import { previewFetch as fetch } from "@/lib/auth/preview-fetch";

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import Link from "./WorkspaceLink";
import { usePathname, useRouter } from "next/navigation";
import { UserRound, ChartNoAxesCombined, BookOpen, LayoutDashboard, FlaskConical, Users, ShoppingBag, Settings, PanelLeftClose, PanelLeftOpen, Menu, X, Search, ExternalLink, LogOut, Languages, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { HadiranMark } from "@/components/HadiranMark";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { clearDraftsByPrefix } from "@/lib/ui/draft";
import { PREVIEW_SESSION_KEY } from "@/lib/auth/preview-client";
import { WorkspaceContext, type Locale } from "./WorkspaceContext";
import type { SessionAccount } from "@/lib/auth/session";

const modules = [
  { href: "/workspace", fa: "نمای کلی", en: "Overview", icon: LayoutDashboard },
  { href: "/workspace/knowledge", fa: "دانشنامه", en: "Knowledge", icon: BookOpen },
  { href: "/workspace/projects", fa: "پروژه‌ها", en: "Projects", icon: FlaskConical },
  { href: "/workspace/collaborations", fa: "همکاری‌ها", en: "Collaborations", icon: Users },
  { href: "/workspace/shop", fa: "فروشگاه", en: "Shop", icon: ShoppingBag },
  { href: "/workspace/analyzers", fa: "تحلیلگرها", en: "Analyzers", icon: ChartNoAxesCombined },
  { href: "/account", fa: "حساب من", en: "My account", icon: UserRound },
  { href: "/workspace/settings", fa: "تنظیمات", en: "Settings", icon: Settings },
];

function subscribeSidebar(callback: () => void) {
  window.addEventListener("storage", callback); window.addEventListener("hadiran-sidebar-change", callback);
  return () => { window.removeEventListener("storage", callback); window.removeEventListener("hadiran-sidebar-change", callback); };
}
function sidebarSnapshot() { try { return localStorage.getItem("hadiran-sidebar") === "collapsed"; } catch { return false; } }

export function WorkspaceShell({ children, account, initialLocale, demo }: { children: ReactNode; account: SessionAccount; initialLocale: Locale; demo: boolean }) {
  const [locale, setLocaleState] = useState(initialLocale);
  const collapsed = useSyncExternalStore(subscribeSidebar, sidebarSnapshot, () => false);
  const [mobile, setMobile] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState(false);
  const path = usePathname();
  const router = useRouter();
  const searchDialog = useRef<HTMLDialogElement>(null);
  const sidebar = useRef<HTMLElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const [search, setSearch] = useState("");
  const t = (fa: string, en: string) => locale === "fa" ? fa : en;
  const active = modules.find((item) => item.href === "/workspace" ? path === item.href : path.startsWith(item.href)) || modules[1];
  const capture = path === "/workspace/capture";
  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, [path]);

  useEffect(() => {
    const html = document.documentElement;
    const oldLang = html.lang, oldDir = html.dir;
    html.lang = locale; html.dir = locale === "fa" ? "rtl" : "ltr";
    return () => { html.lang = oldLang; html.dir = oldDir; };
  }, [locale]);
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault(); searchDialog.current?.showModal();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);
  useEffect(() => {
    if (!mobile) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    sidebar.current?.querySelector<HTMLButtonElement>(".ws-mobile-close")?.focus();
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setMobile(false); menuButton.current?.focus(); }
      if (event.key === "Tab" && !searchDialog.current?.open) {
        const nodes = sidebar.current?.querySelectorAll<HTMLElement>('a[href],button:not([disabled])');
        if (!nodes?.length) return;
        const first = nodes[0], last = nodes[nodes.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", handler);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", handler); };
  }, [mobile]);

  function setLocale(value: Locale) {
    setLocaleState(value);
    document.cookie = `hadiran-workspace-locale=${value}; Path=/; Max-Age=31536000; SameSite=Lax`;
  }
  function toggleCollapsed() {
    const next = !collapsed;
    try { localStorage.setItem("hadiran-sidebar", next ? "collapsed" : "expanded"); window.dispatchEvent(new Event("hadiran-sidebar-change")); } catch {}
  }
  async function logout() {
    setLoggingOut(true); setLogoutError(false);
    try {
      let ticket = account.previewTicket || "";
      if (!ticket) { try { ticket = sessionStorage.getItem(PREVIEW_SESSION_KEY) || ""; } catch {} }
      const response = await fetch("/api/auth/logout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(ticket ? { preview_ticket: ticket } : {}) });
      if (!response.ok) throw new Error();
      for (const prefix of ["account", "onboarding", "casio", "capture"]) clearDraftsByPrefix(prefix);
      try { sessionStorage.removeItem(PREVIEW_SESSION_KEY); } catch {}
      router.replace("/signin?next=/workspace"); router.refresh();
    } catch { setLoggingOut(false); setLogoutError(true); }
  }
  const closeMobile = () => { setMobile(false); menuButton.current?.focus(); };
  const Arrow = locale === "fa" ? ChevronLeft : ChevronRight;

  return (
    <WorkspaceContext.Provider value={{ locale, setLocale, demo, previewTicket: account.previewTicket || "" }}>
      <div className={`ws-shell ${collapsed ? "ws-is-collapsed" : ""} ${mobile ? "ws-mobile-open" : ""}`} dir={locale === "fa" ? "rtl" : "ltr"} lang={locale}>
        <a className="ws-skip" href="#workspace-content">{t("رفتن به محتوا", "Skip to content")}</a>
        {mobile ? <button className="ws-backdrop" aria-label={t("بستن منو", "Close navigation")} onClick={closeMobile} /> : null}
        <aside className="ws-sidebar" id="workspace-navigation" ref={sidebar} aria-label={t("ناوبری فضای کار", "Workspace navigation")} role={mobile ? "dialog" : undefined} aria-modal={mobile || undefined}>
          <div className="ws-brand-row">
            <Link className="ws-brand" href="/workspace" onClick={() => setMobile(false)}><HadiranMark size={29} /><span className="ws-sidebar-text">{t("هادیران", "Hadiran")}<small>{t("فضای مدیریت", "Management workspace")}</small></span></Link>
            <button className="ws-icon-button ws-mobile-close" onClick={closeMobile} aria-label={t("بستن منو", "Close navigation")}><X size={18} /></button>
          </div>
          <button className="ws-sidebar-search" onClick={() => searchDialog.current?.showModal()} title={t("جست‌وجوی بخش‌ها", "Find a module")}><Search size={17} /><span className="ws-sidebar-text">{t("جست‌وجوی بخش‌ها", "Find a module")}</span><kbd className="ws-sidebar-text">⌘ K</kbd></button>
          <p className="ws-nav-label ws-sidebar-text">{t("فضای کار", "WORKSPACE")}</p>
          <nav className="ws-navigation">{modules.map((item) => <Link key={item.href} href={item.href} onClick={() => setMobile(false)} className={`ws-nav-item ${(capture ? item.href === "/workspace/knowledge" : active.href === item.href) ? "is-active" : ""}`} aria-current={(capture ? item.href === "/workspace/knowledge" : active.href === item.href) ? "page" : undefined} title={t(item.fa, item.en)}><item.icon size={19} strokeWidth={1.7} /><span className="ws-sidebar-text">{t(item.fa, item.en)}</span></Link>)}</nav>
          <div className="ws-sidebar-bottom">
            <Link className="ws-nav-item" href="/" title={t("مشاهده سایت", "View website")}><ExternalLink size={18} /><span className="ws-sidebar-text">{t("مشاهده سایت", "View website")}</span></Link>
            <button className="ws-nav-item ws-collapse" onClick={toggleCollapsed} aria-expanded={!collapsed} title={t(collapsed ? "بازکردن سایدبار" : "جمع‌کردن سایدبار", collapsed ? "Expand sidebar" : "Collapse sidebar")}>{collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}<span className="ws-sidebar-text">{t("جمع‌کردن منو", "Collapse sidebar")}</span></button>
            <div className="ws-account"><span className="ws-avatar">{account.displayName?.slice(0, 1) || "H"}</span><div className="ws-sidebar-text"><strong>{account.id === 0 ? t("مالک آزمایشی", "Preview owner") : account.displayName || account.phone}</strong><small>{t("دسترسی مالک", "Owner access")}</small></div><button className="ws-icon-button" disabled={loggingOut} onClick={() => void logout()} title={t("خروج", "Sign out")} aria-label={t("خروج از حساب", "Sign out")}><LogOut size={17} /></button></div>
            {logoutError ? <p role="alert" className="ws-error">{t("خروج انجام نشد؛ دوباره تلاش کنید.", "Sign out failed. Try again.")}</p> : null}
          </div>
        </aside>
        <div className="ws-main" inert={mobile || undefined}>
          <header className="ws-topbar">
            <div className="ws-topbar-start"><button className="ws-icon-button ws-mobile-toggle" ref={menuButton} onClick={() => setMobile(true)} aria-label={t("بازکردن منو", "Open navigation")} aria-expanded={mobile} aria-controls="workspace-navigation"><Menu size={20} /></button><nav className="ws-breadcrumb" aria-label={t("مسیر صفحه", "Breadcrumb")}><Link href="/workspace">{t("فضای کار", "Workspace")}</Link><Arrow size={13} /><span aria-current="page">{capture ? t("یادداشت جدید", "New note") : t(active.fa, active.en)}</span></nav></div>
            <div className="ws-topbar-actions"><button className="ws-icon-button" onClick={() => searchDialog.current?.showModal()} aria-label={t("جست‌وجوی بخش‌ها", "Find a module")}><Search size={18} /></button><button className="ws-language" onClick={() => setLocale(locale === "fa" ? "en" : "fa")} aria-label={t("تغییر زبان به انگلیسی", "Switch language to Persian")}><Languages size={16} /><span>{locale === "fa" ? "EN" : "فا"}</span></button><ThemeSwitcher locale={locale} /><Link className="ws-quick-new" href="/workspace/capture"><Plus size={17} /><span>{t("یادداشت جدید", "New note")}</span></Link></div>
          </header>
          {demo ? <div className="ws-environment"><span />{t("محیط نمایشی", "Demo workspace")}<span className="ws-environment-detail">{t("داده‌های نمونه؛ ثبت و تحلیل موقتِ همین نشست است و هیچ انتشار یا پرداخت واقعی انجام نمی‌شود.", "Sample data. Captures and analyses are temporary. No real publication or payment.")}</span></div> : null}
          <div id="workspace-content" className="ws-content" tabIndex={-1}>{children}</div>
        </div>
        <dialog className="ws-search-dialog" ref={searchDialog} onClick={(event) => { if (event.target === event.currentTarget) event.currentTarget.close(); }}>
          <div className="ws-dialog-header"><h2>{t("رفتن به بخش…", "Jump to a module…")}</h2><button className="ws-icon-button" onClick={() => searchDialog.current?.close()} aria-label={t("بستن", "Close")}><X size={18} /></button></div>
          <label className="ws-search"><Search size={17} /><input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("نام بخش را جست‌وجو کن…", "Search modules…")} aria-label={t("جست‌وجوی بخش‌ها", "Search modules")} /></label>
          <div className="ws-search-results">{modules.filter((item) => `${item.fa} ${item.en}`.toLowerCase().includes(search.toLowerCase())).map((item) => <Link key={item.href} href={item.href} onClick={() => { searchDialog.current?.close(); setMobile(false); }}><item.icon size={18} /><span>{t(item.fa, item.en)}</span><Arrow size={15} /></Link>)}{!modules.some((item) => `${item.fa} ${item.en}`.toLowerCase().includes(search.toLowerCase())) ? <p className="ws-empty">{t("بخشی پیدا نشد.", "No modules found.")}</p> : null}</div>
        </dialog>
      </div>
    </WorkspaceContext.Provider>
  );
}
