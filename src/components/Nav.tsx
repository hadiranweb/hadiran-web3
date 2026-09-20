"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brain, User, BookOpen, FlaskConical, GraduationCap, Layers, Menu, X } from "lucide-react";
import { useState } from "react";
import { SessionMenu } from "@/components/auth/SessionMenu";

const primaryLinks = [
  { href: "/ecosystem", label: "اکوسیستم", icon: Layers },
  { href: "/hadiran", label: "درباره من", icon: User },
  { href: "/knowledge", label: "دانشنامه", icon: BookOpen },
  { href: "/lab", label: "آزمایشگاه", icon: FlaskConical },
  { href: "/courses", label: "دوره‌ها", icon: GraduationCap },
];

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <Brain className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          <span className="text-lg font-bold text-slate-900 dark:text-slate-100">هادیران</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {primaryLinks.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-slate-100"
                }`}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1">
          <div className="hidden md:block">
            <SessionMenu />
          </div>
          <button
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900 md:hidden"
            onClick={() => setOpen(!open)}
            aria-label="منو"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950 md:hidden">
          <nav className="flex flex-col gap-1">
            {primaryLinks.map((link) => {
              const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                    active
                      ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                      : "text-slate-600 dark:text-slate-300"
                  }`}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
            <div className="mt-2 border-t border-slate-100 pt-2 dark:border-slate-800">
              <SessionMenu />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
