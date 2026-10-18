"use client";

import { useEffect, useState } from "react";
import Link from "@/components/workspace/WorkspaceLink";
import { usePathname } from "next/navigation";
import { ChartNoAxesCombined, BookOpen, FlaskConical, GraduationCap, Layers, Menu, ShoppingBag, User, X } from "lucide-react";
import { HadiranMark } from "@/components/HadiranMark";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { SessionMenu } from "@/components/auth/SessionMenu";

const primaryLinks = [
  { href: "/ecosystem", label: "اکوسیستم", icon: Layers },
  { href: "/hadiran", label: "درباره من", icon: User },
  { href: "/knowledge", label: "دانشنامه", icon: BookOpen },
  { href: "/lab", label: "آزمایشگاه", icon: FlaskConical },
  { href: "/courses", label: "دوره‌ها", icon: GraduationCap },
  { href: "/analyzers", label: "تحلیلگرها", icon: ChartNoAxesCombined },
  { href: "/shop", label: "فروشگاه", icon: ShoppingBag },
];

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="site-header sticky top-3 z-50 px-3 sm:px-5">
      <div className="nav-pill mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-3 sm:px-4">
        <Link href="/" className="brand-link flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <HadiranMark size={28} className="brand-mark" />
          <span className="brand-name text-[0.95rem] font-black">هادیران</span>
        </Link>

        <nav aria-label="ناوبری اصلی" className="hidden items-center gap-0.5 xl:flex">
          {primaryLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.href);
            return (
              <Link key={link.href} href={link.href} className="nav-link" aria-current={active ? "page" : undefined}>
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1.5">
          <ThemeSwitcher />
          <div className="hidden xl:block">
            <SessionMenu />
          </div>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="nav-menu-toggle inline-flex h-9 w-9 items-center justify-center rounded-full border xl:hidden"
            aria-label={open ? "بستن منو" : "باز کردن منو"}
            aria-expanded={open}
            aria-controls="mobile-navigation"
          >
            {open ? <X className="h-4 w-4" aria-hidden="true" /> : <Menu className="h-4 w-4" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {open ? (
        <div id="mobile-navigation" className="nav-pill mx-auto mt-2 max-w-6xl space-y-1 rounded-3xl p-2 xl:hidden">
          {primaryLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="nav-link flex items-center gap-3 rounded-2xl py-3"
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {link.label}
              </Link>
            );
          })}
          <div className="mobile-session-divider border-t px-2 pt-2">
            <SessionMenu />
          </div>
        </div>
      ) : null}
    </header>
  );
}
