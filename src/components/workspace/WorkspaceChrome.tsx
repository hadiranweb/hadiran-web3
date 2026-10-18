"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { HadiranMark } from "@/components/HadiranMark";

const ownerLinks = [
  { href: "/workspace", label: "نمای کلی", exact: true },
  { href: "/workspace/capture", label: "ثبت جدید", exact: false },
  { href: "/workspace/bots", label: "ربات‌ها", exact: false },
  { href: "/workspace/analyzers", label: "تحلیلگر‌ها", exact: false },
  { href: "/workspace/shop", label: "فروشگاه", exact: false },
  { href: "/workspace/referrals", label: "معرف‌ها", exact: false },
  { href: "/workspace/network", label: "درخت", exact: true },
  { href: "/workspace/discounts", label: "تخفیف", exact: false },
];

const authorLinks = [
  { href: "/workspace/analyzers", label: "تحلیلگر‌ها", exact: false },
  { href: "/workspace/referrals", label: "معرف‌های من", exact: false },
];

export function WorkspaceChrome() {
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then(async (res) => (res.ok ? ((await res.json()) as { account?: { role?: string } | null }) : null))
      .then((data) => setRole(data?.account?.role ?? null))
      .catch(() => setRole(null));
  }, [pathname]);

  const links = role === "author" ? authorLinks : ownerLinks;
  const home = role === "author" ? "/workspace/analyzers" : "/workspace";

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-4">
        <div>
          <p className="text-xs text-slate-500">
            {role === "author" ? "آزمون‌ساز · ایندکس نمی‌شود" : "میز کار · ایندکس نمی‌شود"}
          </p>
          <Link href={home} className="inline-flex items-center gap-2 text-xl font-bold text-slate-900">
            <HadiranMark className="h-7 w-7" />
            میز کار
          </Link>
        </div>
        <Link
          href={role === "author" ? "/workspace/analyzers/new" : "/workspace/capture"}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white"
        >
          {role === "author" ? "آزمون تازه" : "ثبت جدید"}
        </Link>
      </div>
      <nav className="mx-auto flex max-w-3xl flex-wrap gap-4 px-4 pb-3 text-sm">
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
