"use client";
import { previewFetch as fetch } from "@/lib/auth/preview-fetch";

import Link from "@/components/workspace/WorkspaceLink";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { HadiranMark } from "@/components/HadiranMark";

const ownerLinks = [
  { href: "/workspace", label: "نمای کلی", exact: true },
  { href: "/workspace/capture", label: "ثبت جدید", exact: false },
  { href: "/workspace/bots", label: "ربات‌ها", exact: false },
  { href: "/workspace/analyzers", label: "آینه‌ها", exact: false },
  { href: "/workspace/shop", label: "فروشگاه", exact: false },
  { href: "/workspace/referrals", label: "معرف‌ها", exact: false },
  { href: "/workspace/network", label: "درخت", exact: true },
  { href: "/workspace/discounts", label: "تخفیف", exact: false },
];

const authorLinks = [
  { href: "/workspace/analyzers", label: "میز آزمون‌ساز", exact: false },
  { href: "/workspace/referrals", label: "معرف‌های من", exact: false },
];

const grantedLinks = [{ href: "/workspace/analyzers", label: "میز آزمون", exact: false }];

export function WorkspaceChrome() {
  const pathname = usePathname();
  const [account, setAccount] = useState<{ role?: string; analyzerDesk?: boolean } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then(async (res) => (res.ok ? ((await res.json()) as { account?: { role?: string; analyzerDesk?: boolean } | null }) : null))
      .then((data) => setAccount(data?.account ?? null))
      .catch(() => setAccount(null));
  }, [pathname]);

  const role = account?.role ?? null;
  const links = role === "author" ? authorLinks : role === "member" ? grantedLinks : ownerLinks;
  const home = role === "owner" || role == null ? "/workspace" : "/workspace/analyzers";
  const showCreate = role === "author" || role === "owner" || role == null;

  return (
    <header className="border-b border-line bg-elev">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-4">
        <div>
          <p className="text-xs text-muted">
            {role === "owner" ? "میز کار · ایندکس نمی‌شود" : "میز آزمون‌ساز · ایندکس نمی‌شود"}
          </p>
          <Link href={home} className="inline-flex items-center gap-2 text-xl font-bold text-ink">
            <HadiranMark className="h-7 w-7" />
            {role === "owner" ? "میز کار" : "میز آزمون‌ساز"}
          </Link>
        </div>
        {showCreate ? (
          <Link
            href={role === "author" ? "/workspace/analyzers/new" : "/workspace/capture"}
            className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-fg"
          >
            {role === "author" ? "آزمون تازه" : "ثبت جدید"}
          </Link>
        ) : null}
      </div>
      <nav className="mx-auto flex max-w-3xl flex-wrap gap-4 px-4 pb-3 text-sm">
        {links.map((link) => {
          const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={active ? "font-medium text-mark" : "text-muted hover:text-mark"}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
