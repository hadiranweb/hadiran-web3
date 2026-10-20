"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Hash,
  Home,
  Layers,
  Menu,
  PenLine,
  Pin,
  PinOff,
  Plus,
  ScanSearch,
  Search,
  ShoppingBag,
  User,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { HadiranMark } from "@/components/HadiranMark";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SessionMenu } from "@/components/auth/SessionMenu";

type Locale = "fa" | "en";
type NavMode = "expanded" | "minimal";
type ModuleLink = {
  href: string;
  fa: string;
  en: string;
  icon: typeof Layers;
  exact?: boolean;
};

const LOCALE_COOKIE = "hadiran-workspace-locale";
const NAV_STORAGE = "hadiran-workspace-nav";

const ownerModules: ModuleLink[] = [
  { href: "/workspace", fa: "نمای کلی", en: "Overview", icon: Layers, exact: true },
  { href: "/workspace/capture", fa: "ثبت جدید", en: "New capture", icon: PenLine },
  { href: "/workspace/knowledge", fa: "دانش میز", en: "Knowledge desk", icon: BookOpen },
  { href: "/workspace/projects", fa: "پروژه‌ها", en: "Projects", icon: Layers },
  { href: "/workspace/collaborations", fa: "همکاری‌ها", en: "Collaborations", icon: Users },
  { href: "/workspace/actions", fa: "اقدام‌ها", en: "Work queue", icon: PenLine },
  { href: "/workspace/analyzers", fa: "آینه‌ها", en: "Mirrors", icon: ScanSearch },
  { href: "/workspace/documents", fa: "سندساز", en: "Documents", icon: BookOpen },
  { href: "/workspace/bots", fa: "ربات‌ها", en: "Bots", icon: Wrench },
  { href: "/workspace/people", fa: "اعضا", en: "People", icon: Users },
  { href: "/workspace/referrals", fa: "معرف‌ها", en: "Referrals", icon: Users },
  { href: "/workspace/network", fa: "درخت", en: "Referral tree", icon: Hash, exact: true },
  { href: "/workspace/shop", fa: "فروشگاه", en: "Shop", icon: ShoppingBag },
  { href: "/workspace/finance", fa: "گزارش مالی", en: "Finance", icon: Hash },
  { href: "/workspace/discounts", fa: "تخفیف", en: "Discounts", icon: Hash },
  { href: "/workspace/settings", fa: "تنظیمات", en: "Settings", icon: User },
  { href: "/account", fa: "حساب من", en: "My account", icon: User },
];

const authorModules: ModuleLink[] = [
  { href: "/workspace/analyzers", fa: "میز آزمون‌ساز", en: "Exam desk", icon: ScanSearch },
  { href: "/workspace/documents", fa: "سندساز", en: "Documents", icon: BookOpen },
  { href: "/workspace/referrals", fa: "معرف‌های من", en: "My referrals", icon: Users },
  { href: "/workspace/settings", fa: "تنظیمات", en: "Settings", icon: User },
  { href: "/account", fa: "حساب من", en: "My account", icon: User },
];

const grantedModules: ModuleLink[] = [
  { href: "/workspace/analyzers", fa: "میز آزمون", en: "Exam desk", icon: ScanSearch },
  { href: "/workspace/documents", fa: "سندساز", en: "Documents", icon: BookOpen },
  { href: "/workspace/settings", fa: "تنظیمات", en: "Settings", icon: User },
  { href: "/account", fa: "حساب من", en: "My account", icon: User },
];

function readLocale(): Locale {
  try {
    const match = document.cookie.match(/(?:^|; )hadiran-workspace-locale=([^;]*)/);
    return match?.[1] === "en" ? "en" : "fa";
  } catch {
    return "fa";
  }
}

function writeLocale(value: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${value}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

function readNavMode(): NavMode {
  try {
    return localStorage.getItem(NAV_STORAGE) === "minimal" ? "minimal" : "expanded";
  } catch {
    return "expanded";
  }
}

function writeNavMode(value: NavMode) {
  try {
    localStorage.setItem(NAV_STORAGE, value);
  } catch {
    /* ignore */
  }
}

function isActive(pathname: string, link: ModuleLink) {
  return link.exact ? pathname === link.href : pathname === link.href || pathname.startsWith(`${link.href}/`);
}

export function WorkspaceChrome({ children }: { children?: ReactNode }) {
  const pathname = usePathname();
  const [account, setAccount] = useState<{ role?: string; analyzerDesk?: boolean } | null>(null);
  const [locale, setLocale] = useState<Locale>("fa");
  const [navMode, setNavMode] = useState<NavMode>("expanded");
  const [drawer, setDrawer] = useState(false);
  const [query, setQuery] = useState("");
  const searchDialog = useRef<HTMLDialogElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setLocale(readLocale());
    setNavMode(readNavMode());
  }, []);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then(async (res) =>
        res.ok ? ((await res.json()) as { account?: { role?: string; analyzerDesk?: boolean } | null }) : null,
      )
      .then((data) => setAccount(data?.account ?? null))
      .catch(() => setAccount(null));
  }, [pathname]);

  useEffect(() => {
    setDrawer(false);
  }, [pathname]);

  useEffect(() => {
    if (!drawer) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDrawer(false);
        menuButton.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [drawer]);

  const role = account?.role ?? null;
  const modules = role === "author" ? authorModules : role === "member" ? grantedModules : ownerModules;
  const home = role === "owner" || role == null ? "/workspace" : "/workspace/analyzers";
  const showCreate = role === "author" || role === "owner" || role == null;
  const t = (fa: string, en: string) => (locale === "en" ? en : fa);
  const dir = locale === "fa" ? "rtl" : "ltr";
  const matches = modules.filter((item) => `${item.fa} ${item.en}`.toLowerCase().includes(query.trim().toLowerCase()));
  const current = modules.find((item) => isActive(pathname, item));
  const minimal = navMode === "minimal";
  const labelsOpen = drawer || !minimal;

  function toggleLocale() {
    const next: Locale = locale === "fa" ? "en" : "fa";
    setLocale(next);
    writeLocale(next);
  }

  function setMode(next: NavMode) {
    setNavMode(next);
    writeNavMode(next);
    if (next === "expanded") setDrawer(false);
  }

  function onHamburger() {
    if (drawer) {
      setDrawer(false);
      return;
    }
    setDrawer(true);
  }

  function NavList({ showLabels }: { showLabels: boolean }) {
    return (
      <nav className="flex-1 space-y-1 overflow-y-auto px-2 pb-4">
        {modules.map((link) => {
          const active = isActive(pathname, link);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              title={t(link.fa, link.en)}
              aria-current={active ? "page" : undefined}
              onClick={() => setDrawer(false)}
              className={`flex min-h-11 items-center gap-3 rounded-[var(--radius-sm)] px-3 text-sm ${
                showLabels ? "" : "justify-center px-0"
              } ${active ? "bg-accent-soft font-medium text-ink" : "text-muted hover:bg-paper hover:text-ink"}`}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={1.7} />
              {showLabels ? <span>{t(link.fa, link.en)}</span> : <span className="sr-only">{t(link.fa, link.en)}</span>}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <div className="flex min-h-[calc(100dvh-0px)] bg-paper" dir={dir} lang={locale}>
      <a href="#workspace-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[80] focus:bg-elev focus:px-3 focus:py-2">
        {t("رفتن به محتوا", "Skip to content")}
      </a>
      {drawer ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-ink/40"
          aria-label={t("بستن فهرست", "Close navigation")}
          onClick={() => {
            setDrawer(false);
            menuButton.current?.focus();
          }}
        />
      ) : null}

      <aside
        id="workspace-navigation"
        className={`print-hide print:hidden z-50 flex flex-col border-line bg-elev transition-[transform,width] ${
          dir === "rtl" ? "border-s" : "border-e"
        } ${
          drawer
            ? "fixed inset-y-0 w-64 translate-x-0 " + (dir === "rtl" ? "right-0" : "left-0")
            : `fixed inset-y-0 hidden xl:flex ${dir === "rtl" ? "right-0" : "left-0"} ${minimal ? "w-[4.5rem]" : "w-64"}`
        }`}
        aria-label={t("ناوبری فضای کار", "Workspace navigation")}
      >
        <div className={`flex items-center gap-2 px-3 py-4 ${labelsOpen ? "justify-between" : "justify-center"}`}>
          <Link href={home} className="flex min-w-0 items-center gap-2" onClick={() => setDrawer(false)}>
            <HadiranMark className="h-8 w-8 shrink-0" />
            {labelsOpen ? (
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold text-ink">{t("هادیران", "Hadiran")}</span>
                <span className="block truncate text-xs text-muted">
                  {t(role === "author" || role === "member" ? "میز آزمون" : "میز کار", role === "author" || role === "member" ? "Exam desk" : "Workspace")}
                </span>
              </span>
            ) : (
              <span className="sr-only">{t("هادیران", "Hadiran")}</span>
            )}
          </Link>
          {drawer ? (
            <button
              type="button"
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-[var(--radius-sm)] text-muted hover:bg-paper hover:text-ink"
              aria-label={t("بستن منو", "Close navigation")}
              onClick={() => {
                setDrawer(false);
                menuButton.current?.focus();
              }}
            >
              <X className="h-5 w-5" />
            </button>
          ) : null}
        </div>

        <button
          type="button"
          className={`mx-3 mb-3 flex min-h-11 items-center gap-2 rounded-[var(--radius-sm)] border border-line bg-paper px-3 text-sm text-muted hover:text-ink ${
            labelsOpen ? "" : "justify-center px-0"
          }`}
          onClick={() => searchDialog.current?.showModal()}
          aria-label={t("جست‌وجوی بخش‌ها", "Find a module")}
        >
          <Search className="h-4 w-4 shrink-0" />
          {labelsOpen ? <span>{t("جست‌وجوی بخش‌ها", "Find a module")}</span> : null}
        </button>

        <NavList showLabels={labelsOpen} />

        <div className="space-y-1 border-t border-line p-2">
          <button
            type="button"
            className={`flex min-h-11 w-full items-center gap-3 rounded-[var(--radius-sm)] px-3 text-sm text-muted hover:bg-paper hover:text-ink ${
              labelsOpen ? "" : "justify-center px-0"
            }`}
            onClick={() => setMode(minimal ? "expanded" : "minimal")}
            aria-pressed={!minimal}
            title={minimal ? t("پین با نام بخش‌ها", "Pin with labels") : t("فقط آیکون", "Icons only")}
          >
            {minimal ? <Pin className="h-4 w-4" /> : <PinOff className="h-4 w-4" />}
            {labelsOpen ? <span>{minimal ? t("پین با نام", "Pin labels") : t("حالت مینیمال", "Minimal")}</span> : null}
          </button>
          <Link
            href="/"
            className={`flex min-h-11 w-full items-center gap-3 rounded-[var(--radius-sm)] px-3 text-sm text-muted hover:bg-paper hover:text-ink ${
              labelsOpen ? "" : "justify-center px-0"
            }`}
            title={t("خروج به سایت", "Back to site")}
          >
            <Home className="h-4 w-4 shrink-0" />
            {labelsOpen ? <span>{t("خروج به سایت", "Back to site")}</span> : <span className="sr-only">{t("خروج به سایت", "Back to site")}</span>}
          </Link>
        </div>
      </aside>

      <div className={`flex min-w-0 flex-1 flex-col ${minimal ? "xl:ms-[4.5rem]" : "xl:ms-64"}`}>
        <header className="print-hide sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-line bg-paper/95 px-3 py-2 print:hidden">
          <div className="flex min-w-0 items-center gap-2">
            <button
              ref={menuButton}
              type="button"
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-[var(--radius-sm)] text-muted hover:bg-elev hover:text-ink"
              aria-label={t("باز کردن فهرست", "Open navigation")}
              aria-expanded={drawer}
              aria-controls="workspace-navigation"
              onClick={onHamburger}
            >
              <Menu className="h-5 w-5" />
            </button>
            <p className="truncate text-sm font-medium text-ink">{current ? t(current.fa, current.en) : t("میز کار", "Workspace")}</p>
          </div>
          <div className="flex items-center gap-1">
            <Link
              href="/"
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-[var(--radius-sm)] text-muted hover:bg-elev hover:text-ink"
              aria-label={t("خروج به سایت", "Back to site")}
              title={t("خروج به سایت", "Back to site")}
            >
              <Home className="h-5 w-5" strokeWidth={1.6} />
            </Link>
            <button
              type="button"
              className="inline-flex min-h-11 items-center gap-1 rounded-[var(--radius-sm)] px-3 text-xs font-medium text-muted hover:bg-elev hover:text-ink"
              onClick={toggleLocale}
              aria-label={t("تغییر زبان به انگلیسی", "Switch language to Persian")}
            >
              {locale === "fa" ? "EN" : "فا"}
            </button>
            <ThemeToggle />
          </div>
        </header>
        <div id="workspace-content" className="flex-1" tabIndex={-1}>
          {children}
        </div>
      </div>

      <div className="ws-float-dock print-hide print:hidden">
        <SessionMenu />
        {showCreate ? (
          <Link
            href={role === "author" ? "/workspace/analyzers/new" : "/workspace/capture"}
            className="ws-float-capture"
          >
            <Plus className="h-4 w-4" />
            <span>{t(role === "author" ? "آزمون تازه" : "ثبت جدید", role === "author" ? "New exam" : "New capture")}</span>
          </Link>
        ) : null}
      </div>

      <dialog
        ref={searchDialog}
        className="w-[min(28rem,calc(100vw-2rem))] rounded-[var(--radius-md)] border border-line bg-elev p-0 text-ink shadow-[var(--shadow-sm)]"
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="text-sm font-medium">{t("رفتن به بخش…", "Jump to a module…")}</h2>
          <button
            type="button"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-[var(--radius-sm)] text-muted hover:text-ink"
            aria-label={t("بستن", "Close")}
            onClick={() => searchDialog.current?.close()}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <label className="flex items-center gap-2 border-b border-line px-4 py-2">
          <Search className="h-4 w-4 text-muted" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("نام بخش را جست‌وجو کن…", "Search modules…")}
            aria-label={t("جست‌وجوی بخش‌ها", "Search modules")}
            className="min-h-11 w-full bg-transparent text-sm outline-none"
          />
        </label>
        <div className="max-h-80 overflow-y-auto p-2">
          {matches.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex min-h-11 items-center gap-3 rounded-[var(--radius-sm)] px-3 text-sm hover:bg-paper"
                onClick={() => {
                  searchDialog.current?.close();
                  setDrawer(false);
                }}
              >
                <Icon className="h-4 w-4" strokeWidth={1.7} />
                {t(item.fa, item.en)}
              </Link>
            );
          })}
          {matches.length === 0 ? <p className="px-3 py-6 text-sm text-muted">{t("بخشی پیدا نشد.", "No modules found.")}</p> : null}
        </div>
      </dialog>
    </div>
  );
}
