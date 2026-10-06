"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, BookOpen, FlaskConical, GraduationCap, Layers, Menu, X, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { SessionMenu } from "@/components/auth/SessionMenu";
import { HadiranWordmark } from "@/components/HadiranMark";

const primaryLinks = [
  { href: "/ecosystem", label: "اکوسیستم", icon: Layers },
  { href: "/hadiran", label: "درباره من", icon: User },
  { href: "/knowledge", label: "دانشنامه", icon: BookOpen },
  { href: "/lab", label: "آزمایشگاه", icon: FlaskConical },
  { href: "/courses", label: "دوره‌ها", icon: GraduationCap },
  { href: "/shop", label: "فروشگاه", icon: ShoppingBag },
];

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper/95">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <HadiranWordmark className="text-lg" markClassName="h-8 w-8" />
        </Link>

        <nav className="hidden items-center gap-0.5 md:flex">
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
          <div className="hidden md:block">
            <SessionMenu />
          </div>
          <button
            className="rounded-[var(--radius-sm)] p-2 text-muted hover:bg-elev hover:text-ink md:hidden"
            onClick={() => setOpen(!open)}
            aria-label="منو"
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-line bg-paper px-4 py-3 md:hidden">
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
  );
}
