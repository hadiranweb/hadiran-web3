"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogIn, LogOut, PenLine } from "lucide-react";

type Account = { id: number; displayName: string | null; phone: string; role: string };

export function SessionMenu() {
  const pathname = usePathname();
  const router = useRouter();
  const [account, setAccount] = useState<Account | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me")
      .then(async (res) => {
        if (!res.ok) return null;
        const data = (await res.json()) as { account: Account | null };
        return data.account;
      })
      .then((next) => {
        if (!cancelled) setAccount(next);
      })
      .catch(() => {
        if (!cancelled) setAccount(null);
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setAccount(null);
    router.refresh();
  }

  if (pathname === "/signin") return null;
  if (account === undefined) return <span className="h-9 w-16" />;

  if (!account) {
    const next = pathname.startsWith("/") ? pathname : "/";
    return (
      <Link
        href={`/signin?next=${encodeURIComponent(next)}`}
        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"
      >
        <LogIn className="h-4 w-4" />
        ورود
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {account.role === "owner" ? (
        <Link
          href="/workspace"
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"
        >
          <PenLine className="h-4 w-4" />
          میز کار
        </Link>
      ) : null}
      <button
        type="button"
        onClick={() => void logout()}
        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"
      >
        <LogOut className="h-4 w-4" />
        خروج
      </button>
    </div>
  );
}
