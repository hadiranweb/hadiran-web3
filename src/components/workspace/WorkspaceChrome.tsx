"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Hash,
  Home,
  Layers,
  Menu,
  PanelLeftClose,
  PenLine,
  Pin,
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
type NavMode = "pinned" | "open" | "icons";
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
  { href: "/workspace/knowledge", fa: "باغ دانش", en: "Knowledge garden", icon: BookOpen },
  { href: "/workspace/content", fa: "متن و نام", en: "Copy & theme", icon: PenLine },
  { href: "/workspace/projects", fa: "پروژه‌ها", en: "Projects", icon: Layers },
  { href: "/workspace/collaborations", fa: "همکاری‌ها", en: "Collaborations", icon: Users },
  { href: "/workspace/actions", fa: "اقدام‌ها", en: "Work queue", icon: PenLine },
  { href: "/workspace/analyzers", fa: "آینه‌ها", en: "Mirrors", icon: ScanSearch },
  { href: "/workspace/documents", fa: "سندساز", en: "Documents", icon: BookOpen },
  { href: "/workspace/bots", fa: "ربات‌ها", en: "Bots", icon: Wrench },
  { href: "/workspace/mcp", fa: "موتور گفتگو (MCP)", en: "Chat MCP", icon: Wrench },
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
    const stored = localStorage.getItem(NAV_STORAGE);
    if (stored === "open") return "open";
    if (stored === "minimal" || stored === "icons") return "icons";
    return "pinned";
  } catch {
    return "pinned";
  }
}

function writeNavMode(value: NavMode) {
  try {
    localStorage.setItem(NAV_STORAGE, value);
  } catch {
    /* ignore */
  }
}

/* Locale و navMode در کوکی/localStorage می‌مانند. خواندنشان با useSyncExternalStore
   انجام می‌شود تا نه setState داخل effect لازم باشد و نه هیدریشن به‌هم بخورد. */
const localeListeners = new Set<() => void>();
let localeCache: Locale | null = null;
const navListeners = new Set<() => void>();
let navCache: NavMode | null = null;

function subscribeLocale(listener: () => void) {
  localeListeners.add(listener);
  return () => localeListeners.delete(listener);
}

function getLocaleSnapshot(): Locale {
  if (localeCache === null) localeCache = readLocale();
  return localeCache;
}

function getLocaleServerSnapshot(): Locale {
  return "fa";
}

function setLocaleValue(next: Locale) {
  localeCache = next;
  writeLocale(next);
  for (const listener of localeListeners) listener();
}

function subscribeNavMode(listener: () => void) {
  navListeners.add(listener);
  return () => navListeners.delete(listener);
}

function getNavModeSnapshot(): NavMode {
  if (navCache === null) navCache = readNavMode();
  return navCache;
}

function getNavModeServerSnapshot(): NavMode {
  return "pinned";
}

function setNavModeValue(next: NavMode) {
  navCache = next;
  writeNavMode(next);
  for (const listener of navListeners) listener();
}

function isActive(pathname: string, link: ModuleLink) {
  return link.exact ? pathname === link.href : pathname === link.href || pathname.startsWith(`${link.href}/`);
}

const DESKTOP_NAV = "(min-width: 48rem)";

function subscribeDesktop(listener: () => void) {
  const media = window.matchMedia(DESKTOP_NAV);
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
}

function getDesktopSnapshot() {
  return window.matchMedia(DESKTOP_NAV).matches;
}

function getDesktopServerSnapshot() {
  return false;
}

function useDesktopNav() {
  return useSyncExternalStore(subscribeDesktop, getDesktopSnapshot, getDesktopServerSnapshot);
}

function NavList({
  modules,
  pathname,
  labeled,
  label,
  translate,
  onNavigate,
}: {
  modules: ModuleLink[];
  pathname: string;
  labeled: boolean;
  label: string;
  translate: (fa: string, en: string) => string;
  onNavigate: () => void;
}) {
  return (
    <nav className="ws-rail-nav" aria-label={label}>
      {modules.map((link) => {
        const active = isActive(pathname, link);
        const Icon = link.icon;
        const itemLabel = translate(link.fa, link.en);
        return (
          <Link
            key={link.href}
            href={link.href}
            title={itemLabel}
            data-label={itemLabel}
            aria-current={active ? "page" : undefined}
            onClick={onNavigate}
            className={`ws-rail-link ${active ? "is-active" : ""} ${labeled ? "is-labeled" : "is-icon"}`}
          >
            <Icon className="h-4 w-4 shrink-0" strokeWidth={1.7} />
            {labeled ? <span>{itemLabel}</span> : <span className="sr-only">{itemLabel}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

export function WorkspaceChrome({ children }: { children?: ReactNode }) {
  const pathname = usePathname();
  const [account, setAccount] = useState<{ role?: string; analyzerDesk?: boolean } | null>(null);
  const locale = useSyncExternalStore(subscribeLocale, getLocaleSnapshot, getLocaleServerSnapshot);
  const desktop = useDesktopNav();
  const navMode = useSyncExternalStore(subscribeNavMode, getNavModeSnapshot, getNavModeServerSnapshot);
  const [drawerPath, setDrawerPath] = useState<string | null>(null);
  // کشو با مسیر کلید می‌خورد: با رفتن به صفحهٔ دیگر خودبه‌خود بسته است و desktop آن را نادیده می‌گیرد.
  const drawer = drawerPath === pathname && !desktop;
  const setDrawer = (open: boolean) => setDrawerPath(open ? pathname : null);
  const [query, setQuery] = useState("");
  const searchDialog = useRef<HTMLDialogElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then(async (res) =>
        res.ok ? ((await res.json()) as { account?: { role?: string; analyzerDesk?: boolean } | null }) : null,
      )
      .then((data) => setAccount(data?.account ?? null))
      .catch(() => setAccount(null));
  }, [pathname]);

  useEffect(() => {
    if (!drawer) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setDrawerPath(null);
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
  const overlay = !desktop && drawer;
  const showLabels = overlay || navMode === "pinned";
  const cycle =
    navMode === "pinned"
      ? { next: "icons" as const, Icon: Pin, fa: "پین؛ بزن تا فقط آیکون شود", en: "Pinned; click for icons only" }
      : navMode === "icons"
        ? { next: "open" as const, Icon: PanelLeftClose, fa: "فقط آیکون؛ بزن تا بسته شود", en: "Icons only; click to close" }
        : { next: "pinned" as const, Icon: Menu, fa: "فهرست بسته؛ بزن تا پین شود", en: "Closed; click to pin" };
  const control = desktop
    ? cycle
    : drawer
      ? { Icon: X, fa: "بستن فهرست", en: "Close navigation" }
      : { Icon: Menu, fa: "باز کردن فهرست", en: "Open navigation" };

  function toggleLocale() {
    setLocaleValue(locale === "fa" ? "en" : "fa");
  }

  function onNavControl() {
    if (!desktop) {
      setDrawer(!drawer);
      return;
    }
    setNavModeValue(cycle.next);
  }

  function closeOverlay() {
    setDrawer(false);
    menuButton.current?.focus();
  }

  return (
    <div className="ws-shell" dir={dir} lang={locale} data-nav-mode={navMode} data-nav-open={overlay ? "true" : "false"}>
      <a href="#workspace-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[80] focus:bg-elev focus:px-3 focus:py-2">
        {t("رفتن به محتوا", "Skip to content")}
      </a>

      {overlay ? (
        <button type="button" className="ws-scrim" aria-label={t("بستن فهرست", "Close navigation")} onClick={closeOverlay} />
      ) : null}

      <aside id="workspace-navigation" className="ws-rail print-hide print:hidden">
        <div className={`ws-rail-brand ${showLabels ? "is-labeled" : ""}`}>
          <Link href={home} className="flex min-w-0 items-center gap-2" onClick={() => setDrawer(false)}>
            <HadiranMark className="h-8 w-8 shrink-0" />
            {showLabels ? (
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
          {overlay ? (
            <button
              type="button"
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-[var(--radius-sm)] text-muted hover:bg-paper hover:text-ink"
              aria-label={t("بستن منو", "Close navigation")}
              onClick={closeOverlay}
            >
              <X className="h-5 w-5" />
            </button>
          ) : null}
        </div>

        <button
          type="button"
          className={`ws-rail-search ${showLabels ? "is-labeled" : ""}`}
          onClick={() => searchDialog.current?.showModal()}
          aria-label={t("جست‌وجوی بخش‌ها", "Find a module")}
        >
          <Search className="h-4 w-4 shrink-0" />
          {showLabels ? <span>{t("جست‌وجوی بخش‌ها", "Find a module")}</span> : null}
        </button>

        <NavList
          modules={modules}
          pathname={pathname}
          labeled={showLabels}
          label={t("ناوبری فضای کار", "Workspace navigation")}
          translate={t}
          onNavigate={() => setDrawer(false)}
        />

        <div className="ws-rail-foot">
          <Link
            href="/"
            className={`ws-rail-link ${showLabels ? "is-labeled" : "is-icon"}`}
            title={t("خروج به سایت", "Back to site")}
          >
            <Home className="h-4 w-4 shrink-0" />
            {showLabels ? <span>{t("خروج به سایت", "Back to site")}</span> : <span className="sr-only">{t("خروج به سایت", "Back to site")}</span>}
          </Link>
        </div>
      </aside>

      <div className="ws-main">
        <header className="ws-topbar print-hide print:hidden">
          <div className="ws-topbar-start">
            <button
              ref={menuButton}
              type="button"
              className="nav-menu-toggle"
              aria-label={t(control.fa, control.en)}
              title={t(control.fa, control.en)}
              aria-expanded={overlay}
              aria-controls="workspace-navigation"
              onClick={onNavControl}
            >
              <control.Icon size={19} aria-hidden="true" />
            </button>
            <p className="min-w-0 truncate text-sm font-medium text-ink">
              {current ? t(current.fa, current.en) : t("میز کار", "Workspace")}
            </p>
          </div>
          <div className="ws-topbar-tools">
            <button
              type="button"
              className="ws-tool"
              onClick={toggleLocale}
              aria-label={t("تغییر زبان به انگلیسی", "Switch language to Persian")}
            >
              {locale === "fa" ? "EN" : "فا"}
            </button>
            <ThemeToggle locale={locale} className="theme-trigger" />
            <SessionMenu chrome="site" />
          </div>
        </header>
        <div id="workspace-content" className="ws-content" tabIndex={-1}>
          {children}
        </div>
      </div>

      {showCreate ? (
        <div className="ws-float-dock print-hide print:hidden">
          <Link
            href={role === "author" ? "/workspace/analyzers/new" : "/workspace/capture"}
            className="ws-float-capture"
          >
            <Plus className="h-4 w-4" />
            <span>{t(role === "author" ? "آزمون تازه" : "ثبت جدید", role === "author" ? "New exam" : "New capture")}</span>
          </Link>
        </div>
      ) : null}

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
                onClick={() => searchDialog.current?.close()}
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
