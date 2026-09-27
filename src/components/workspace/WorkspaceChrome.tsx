"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HadiranMark } from "@/components/HadiranMark";

const links = [
  { href: "/workspace", label: "نمای کلی", exact: true },
  { href: "/workspace/capture", label: "ثبت جدید", exact: false },
  { href: "/workspace/shop", label: "فروشگاه", exact: false },
];

export function WorkspaceChrome() {
  const pathname = usePathname();

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-4">
        <div>
          <p className="text-xs text-slate-500">فقط owner · ایندکس نمی‌شود</p>
          <Link href="/workspace" className="inline-flex items-center gap-2 text-xl font-bold text-slate-900">
            <HadiranMark className="h-7 w-7" />
            میز کار
          </Link>
        </div>
        <Link
          href="/workspace/capture"
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white"
        >
          ثبت جدید
        </Link>
      </div>
      <nav className="mx-auto flex max-w-3xl gap-4 px-4 pb-3 text-sm">
        {links.map((link) => {
          const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={active ? "font-medium text-indigo-700" : "text-slate-500 hover:text-indigo-600"}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
