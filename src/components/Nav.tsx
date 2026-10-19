"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, BookOpen, FlaskConical, GraduationCap, Layers, Menu, X, ShoppingBag, ScanSearch } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { SessionMenu } from "@/components/auth/SessionMenu";
import { ThemeToggle } from "@/components/ThemeToggle";
import { HadiranWordmark } from "@/components/HadiranMark";
import { rooms } from "@/lib/copy";

const primaryLinks = [
  { href: rooms.house.href, label: rooms.house.label, icon: Layers },
  { href: rooms.person.href, label: rooms.person.label, icon: User },
  { href: rooms.knowledge.href, label: rooms.knowledge.label, icon: BookOpen },
  { href: rooms.lab.href, label: rooms.lab.label, icon: FlaskConical },
  { href: rooms.mirrors.href, label: rooms.mirrors.label, icon: ScanSearch },
  { href: rooms.courses.href, label: rooms.courses.label, icon: GraduationCap },
  { href: rooms.shop.href, label: rooms.shop.label, icon: ShoppingBag },
];

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      const root = headerRef.current;
      if (root && event.target instanceof Node && root.contains(event.target)) return;
      setOpen(false);
    }
    function onScroll() {
      setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("scroll", onScroll, { capture: true });
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
    <header ref={headerRef} className="print-hide sticky top-0 z-50 border-b border-line bg-paper/95 print:hidden">
      <div className="relative z-50 mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <HadiranWordmark className="text-lg" markClassName="h-8 w-8" />
        </Link>

        <nav className="hidden items-center gap-0.5 lg:flex">
          {primaryLinks.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-3 py-2 text-sm transition ${
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
          <div className="hidden lg:block">
            <SessionMenu />
          </div>
          <button
            className="rounded-[var(--radius-sm)] p-2 text-muted hover:bg-elev hover:text-ink lg:hidden"
            onClick={() => setOpen(!open)}
            aria-label="منو"
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="relative z-50 border-t border-line bg-paper px-4 py-3 lg:hidden">
          <nav className="flex flex-col gap-1">
            {primaryLinks.map((link) => {
              const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium ${
                    active ? "bg-accent-soft text-ink" : "text-muted"
                  }`}
                >
                  <link.icon className="h-4 w-4" strokeWidth={1.5} />
                  {link.label}
                </Link>
              );
            })}
            <div className="mt-2 border-t border-line pt-2">
              <SessionMenu />
            </div>
          </nav>
        </div>
      )}
    </header>
    {open ? (
      <button
        type="button"
        aria-label="بستن منو"
        className="fixed inset-0 z-40 bg-transparent lg:hidden"
        onClick={() => setOpen(false)}
      />
    ) : null}
    </>
  );
}
