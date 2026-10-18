"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogIn, LogOut, PenLine, User } from "lucide-react";
import { clearDraftsByPrefix, subscribeAccount } from "@/lib/ui/draft";

type Account = {
  id: number;
  displayName: string | null;
  givenName?: string | null;
  familyName?: string | null;
  phone: string;
  role: string;
  needsPassword?: boolean;
};

const itemClass =
  "flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-right text-sm font-medium text-ink hover:bg-elev";

function initialsOf(account: Account) {
  const given = account.givenName?.trim()?.[0];
  const family = account.familyName?.trim()?.[0];
  if (given && family) return `${given}${family}`;
  const fromDisplay = account.displayName?.trim().replace(/\s+/g, "");
  if (fromDisplay && fromDisplay.length >= 2) return fromDisplay.slice(0, 2);
  if (fromDisplay) return fromDisplay;
  return "";
}

export function SessionMenu() {
  const pathname = usePathname();
  const router = useRouter();
  const [account, setAccount] = useState<Account | null | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      const root = rootRef.current;
      if (root && event.target instanceof Node && root.contains(event.target)) return;
      setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    clearDraftsByPrefix("account");
    clearDraftsByPrefix("onboarding");
    clearDraftsByPrefix("casio");
    setAccount(null);
    setOpen(false);
    router.refresh();
  }

  if (pathname === "/signin") return null;
  if (account === undefined) return <span className="h-9 w-9" />;

  if (!account) {
    const next = pathname.startsWith("/") ? pathname : "/";
    return (
      <Link
        href={`/signin?next=${encodeURIComponent(next)}`}
        className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium text-muted hover:bg-elev hover:text-ink"
      >
        <LogIn className="h-4 w-4" strokeWidth={1.5} />
        ورود
      </Link>
    );
  }

  const initials = initialsOf(account);
  const needsPassword = account.needsPassword === true;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={needsPassword ? "حساب — رمز ثابت هنوز تنظیم نشده" : "حساب"}
        className="relative flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-ink"
      >
        {initials ? (
          <span>{initials}</span>
        ) : (
          <User className="h-4 w-4" strokeWidth={1.5} />
        )}
        {needsPassword ? (
          <span
            className="absolute top-0 end-0 h-2.5 w-2.5 rounded-full bg-mark ring-2 ring-paper"
            aria-hidden
          />
        ) : null}
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute end-0 z-50 mt-2 w-52 overflow-hidden rounded-[var(--radius-md)] border border-line bg-paper py-1 shadow-[var(--shadow-sm)]"
        >
          <Link href="/account" role="menuitem" className={itemClass} onClick={() => setOpen(false)}>
            <User className="h-4 w-4" strokeWidth={1.5} />
            حساب
          </Link>
          {needsPassword ? (
            <Link
              href="/account#password"
              role="menuitem"
              className={itemClass}
              onClick={() => setOpen(false)}
            >
              <span className="inline-flex h-4 w-4 items-center justify-center">
                <span className="h-2 w-2 rounded-full bg-mark" />
              </span>
              تنظیم رمز ثابت
            </Link>
          ) : null}
          {account.role === "owner" || account.role === "author" ? (
            <Link
              href={account.role === "author" ? "/workspace/analyzers" : "/workspace"}
              role="menuitem"
              className={itemClass}
              onClick={() => setOpen(false)}
            >
              <PenLine className="h-4 w-4" strokeWidth={1.5} />
              میز کار
            </Link>
          ) : null}
          <button type="button" role="menuitem" onClick={() => void logout()} className={itemClass}>
            <LogOut className="h-4 w-4" strokeWidth={1.5} />
            خروج
          </button>
        </div>
      ) : null}
    </div>
  );
}
