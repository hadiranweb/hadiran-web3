"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogIn, LogOut, PenLine, User } from "lucide-react";
import { clearDraftsByPrefix, subscribeAccount } from "@/lib/ui/draft";

type Account = { id: number; displayName: string | null; phone: string; role: string };

const itemClass =
  "inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium text-muted hover:bg-elev hover:text-ink";

export function SessionMenu() {
  const pathname = usePathname();
  const router = useRouter();
  const [account, setAccount] = useState<Account | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    function load() {
      fetch("/api/auth/me", { cache: "no-store" })
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
    }
    load();
    const stop = subscribeAccount(() => load());
    return () => {
      cancelled = true;
      stop();
    };
  }, [pathname]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    clearDraftsByPrefix("account");
    clearDraftsByPrefix("onboarding");
    clearDraftsByPrefix("casio");
    setAccount(null);
    router.refresh();
  }

  if (pathname === "/signin") return null;
  if (account === undefined) return <span className="h-9 w-16" />;

  if (!account) {
    const next = pathname.startsWith("/") ? pathname : "/";
    return (
      <Link href={`/signin?next=${encodeURIComponent(next)}`} className={itemClass}>
        <LogIn className="h-4 w-4" strokeWidth={1.5} />
        ورود
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Link href="/account" className={itemClass}>
        <User className="h-4 w-4" strokeWidth={1.5} />
        حساب
      </Link>
      {account.role === "owner" || account.role === "author" ? (
        <Link href={account.role === "author" ? "/workspace/analyzers" : "/workspace"} className={itemClass}>
          <PenLine className="h-4 w-4" strokeWidth={1.5} />
          میز کار
        </Link>
      ) : null}
      <button type="button" onClick={() => void logout()} className={itemClass}>
        <LogOut className="h-4 w-4" strokeWidth={1.5} />
        خروج
      </button>
    </div>
  );
}
