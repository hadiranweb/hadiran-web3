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
import type { ChromeCopy } from "@/lib/content/registry";

function primaryLinks(copy: ChromeCopy) {
  return [
    { href: copy.rooms.house.href, label: copy.rooms.house.label, icon: Layers, note: copy.notes.house },
    { href: copy.rooms.person.href, label: copy.rooms.person.label, icon: User, note: copy.notes.person },
    { href: copy.rooms.knowledge.href, label: copy.rooms.knowledge.label, icon: BookOpen, note: copy.notes.knowledge },
    { href: copy.rooms.lab.href, label: copy.rooms.lab.label, icon: FlaskConical, note: copy.notes.lab },
    { href: copy.rooms.mirrors.href, label: copy.rooms.mirrors.label, icon: ScanSearch, note: copy.notes.mirrors },
    { href: copy.rooms.courses.href, label: copy.rooms.courses.label, icon: GraduationCap, note: copy.notes.courses },
    { href: copy.rooms.shop.href, label: copy.rooms.shop.label, icon: ShoppingBag, note: copy.notes.shop },
  ];
}

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Nav({ copy }: { copy: ChromeCopy }) {
  const pathname = usePathname();
  const links = primaryLinks(copy);
  const { id, open, visible, panel, trigger, toggle, close } = useDisclosure();

  useEffect(() => {
    close();
  }, [pathname, close]);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 80rem)");
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
          <div className="site-nav-start">
            <Link href="/" className="brand-link" onClick={() => close()}>
              <HadiranMark className="brand-mark h-7 w-7" />
              <span className="brand-name">{copy.site.nameFa}</span>
            </Link>
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
          <nav aria-label="اتاق‌ها" className="site-desktop-navigation">
            {links.map((link) => (
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
              {links.map((link) => (
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
            <Link href={copy.rooms.contact.href} onClick={() => close()}>
              {copy.rooms.contact.label}
              <ArrowUpLeft size={15} />
            </Link>
            <Link href={copy.rooms.privacy.href} onClick={() => close()}>
              {copy.rooms.privacy.label}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
