"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { BookOpen, FlaskConical, GraduationCap, Layers, Menu, ScanSearch, ShoppingBag, User, X } from "lucide-react";
import { SessionMenu } from "@/components/auth/SessionMenu";
import { ThemeToggle } from "@/components/ThemeToggle";
import { HadiranWordmark } from "@/components/HadiranMark";
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
    const media = window.matchMedia("(min-width: 1280px)");
    const onChange = () => {
      if (media.matches) close();
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [close]);

  return (
    <header className="print-hide sticky top-0 z-50 border-b border-line bg-paper/95 print:hidden">
      <div className="relative z-50 mx-auto max-w-7xl px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <Link href="/" className="flex min-h-11 items-center gap-2">
            <HadiranWordmark className="text-lg" markClassName="h-8 w-8" />
          </Link>

          <nav className="hidden items-center gap-0.5 xl:flex" aria-label="اتاق‌ها">
            {primaryLinks.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`relative px-3 py-2.5 text-sm transition ${
                    active ? "font-semibold text-ink" : "font-medium text-muted hover:text-ink"
                  }`}
                >
                  {link.label}
                  {active ? <span className="absolute inset-x-3 bottom-0 h-px bg-mark" /> : null}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1">
            <ThemeToggle />
            <SessionMenu />
            <button
              ref={trigger}
              type="button"
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-[var(--radius-sm)] p-2 text-muted hover:bg-elev hover:text-ink xl:hidden"
              aria-label={open ? "بستن فهرست اتاق‌ها" : "باز کردن فهرست اتاق‌ها"}
              aria-expanded={open}
              aria-controls={id}
              onClick={toggle}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div
          id={id}
          ref={panel}
          hidden={!visible}
          inert={!open || undefined}
          className="absolute inset-x-4 top-full z-50 mt-2 max-h-[min(28rem,calc(100dvh-5rem))] overflow-y-auto rounded-[var(--radius-md)] border border-line bg-paper p-3 shadow-[var(--shadow-sm)] xl:hidden"
        >
          <nav className="flex flex-col gap-1" aria-label="اتاق‌ها">
            {primaryLinks.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => close()}
                  className={`flex min-h-11 items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium ${
                    active ? "bg-accent-soft text-ink" : "text-muted hover:bg-elev hover:text-ink"
                  }`}
                >
                  <link.icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                  <span className="flex min-w-0 flex-col">
                    <span>{link.label}</span>
                    <span className="text-xs font-normal text-muted">{link.note}</span>
                  </span>
                </Link>
              );
            })}
          </nav>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 border-t border-line pt-3 text-xs text-muted">
            <Link href={rooms.contact.href} className="min-h-11 inline-flex items-center hover:text-ink" onClick={() => close()}>
              {rooms.contact.label}
            </Link>
            <Link href={rooms.privacy.href} className="min-h-11 inline-flex items-center hover:text-ink" onClick={() => close()}>
              {rooms.privacy.label}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
