"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  ArrowUpLeft,
  BookOpen,
  FlaskConical,
  GraduationCap,
  Layers,
  Menu,
  ScanSearch,
  ShoppingBag,
  User,
  X,
} from "lucide-react";
import { SessionMenu } from "@/components/auth/SessionMenu";
import { ThemeToggle } from "@/components/ThemeToggle";
import { HadiranMark } from "@/components/HadiranMark";
import { useDisclosure } from "@/components/navigation/useDisclosure";
import { rooms } from "@/lib/copy";

const primaryLinks = [
  { href: rooms.house.href, label: rooms.house.label, icon: Layers, note: "نگاه یکپارچه به هادیران" },
  { href: rooms.person.href, label: rooms.person.label, icon: User, note: "مسیر و نگاه هادی" },
  { href: rooms.knowledge.href, label: rooms.knowledge.label, icon: BookOpen, note: "از نهال تا درخت" },
  { href: rooms.lab.href, label: rooms.lab.label, icon: FlaskConical, note: "ظرف‌ها و پروژه‌های باز" },
  { href: rooms.mirrors.href, label: rooms.mirrors.label, icon: ScanSearch, note: "تصویری از خودت" },
  { href: rooms.courses.href, label: rooms.courses.label, icon: GraduationCap, note: "مسیر یادگیری" },
  { href: rooms.shop.href, label: rooms.shop.label, icon: ShoppingBag, note: "محصولات هادیران" },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Nav() {
  const pathname = usePathname();
  const { id, open, visible, panel, trigger, toggle, close } = useDisclosure();

  useEffect(() => {
    close();
  }, [pathname, close]);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 90rem)");
    const onChange = () => {
      if (media.matches) close();
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [close]);

  useEffect(() => {
    if (!open) return;
    const onScroll = (event: Event) => {
      if (event.target instanceof Node && panel.current?.contains(event.target)) return;
      close();
    };
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    return () => window.removeEventListener("scroll", onScroll, { capture: true });
  }, [open, close, panel]);

  return (
    <header className="site-header print-hide sticky top-3 z-50 px-3 sm:px-5 print:hidden">
      <div className="nav-anchor mx-auto max-w-7xl">
        <div className="nav-pill site-nav-bar">
          <Link href="/" className="brand-link" onClick={() => close()}>
            <HadiranMark className="brand-mark h-7 w-7" />
            <span className="brand-name">هادیران</span>
          </Link>
          <nav aria-label="اتاق‌ها" className="site-desktop-navigation">
            {primaryLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="nav-link"
                aria-current={isActive(pathname, link.href) ? "page" : undefined}
              >
                <link.icon size={14} aria-hidden="true" />
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="site-nav-actions">
            <ThemeToggle className="theme-trigger" />
            <SessionMenu chrome="site" />
            <button
              ref={trigger}
              type="button"
              onClick={toggle}
              className="nav-menu-toggle"
              aria-label={open ? "بستن فهرست اتاق‌ها" : "باز کردن فهرست اتاق‌ها"}
              aria-expanded={open}
              aria-controls={id}
            >
              {open ? <X size={19} aria-hidden="true" /> : <Menu size={19} aria-hidden="true" />}
            </button>
          </div>
        </div>
        <div
          id={id}
          ref={panel}
          className="site-nav-dropdown"
          hidden={!visible}
          inert={!open || undefined}
          aria-hidden={!open}
        >
          <div className="site-nav-dropdown-heading">
            <span>مسیرت را انتخاب کن</span>
            <small>فضای هادیران</small>
          </div>
          <nav aria-label="ناوبری بازشونده">
            <ul className="site-nav-grid">
              {primaryLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => close()}
                    aria-current={isActive(pathname, link.href) ? "page" : undefined}
                  >
                    <span className="site-nav-icon">
                      <link.icon size={20} aria-hidden="true" />
                    </span>
                    <span>
                      <strong>{link.label}</strong>
                      <small>{link.note}</small>
                    </span>
                    <ArrowUpLeft size={16} className="site-nav-arrow" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="site-nav-dropdown-foot">
            <Link href={rooms.contact.href} onClick={() => close()}>
              {rooms.contact.label}
              <ArrowUpLeft size={15} />
            </Link>
            <Link href={rooms.privacy.href} onClick={() => close()}>
              {rooms.privacy.label}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
