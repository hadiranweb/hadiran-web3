"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, LogIn } from "lucide-react";
import { defaultAvatarVariant, type AccountAvatar } from "@/lib/account/avatar";
import { roleFa } from "@/lib/auth/roles";
import { subscribeAccount } from "@/lib/ui/draft";
import { useDisclosure } from "@/components/navigation/useDisclosure";
import { UserAvatar } from "./UserAvatar";

type MeAccount = {
  id: number;
  givenName: string | null;
  familyName: string | null;
  displayName: string | null;
  role: string;
  needsPassword: boolean;
  analyzerDesk?: boolean;
  avatar?: AccountAvatar;
};

function accountLabel(account: MeAccount) {
  const parts = [account.givenName, account.familyName].filter(Boolean).join(" ").trim();
  return parts || account.displayName || "حساب";
}

export function SessionMenu({ chrome = "default" }: { chrome?: "default" | "site" }) {
  const pathname = usePathname();
  const router = useRouter();
  const [account, setAccount] = useState<MeAccount | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const { id, open, visible, panel, trigger, toggle, close } = useDisclosure();

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data: { account: MeAccount | null }) => {
        if (!cancelled) setAccount(data.account);
      })
      .catch(() => {
        if (!cancelled) setAccount(null);
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return subscribeAccount((detail) => {
      setAccount((current) => {
        if (!current) return current;
        return {
          ...current,
          givenName: detail.givenName ?? current.givenName,
          familyName: detail.familyName ?? current.familyName,
          displayName: detail.displayName !== undefined ? detail.displayName : current.displayName,
          needsPassword: detail.needsPassword ?? current.needsPassword,
          avatar: detail.avatar ?? current.avatar,
        };
      });
    });
  }, []);

  useEffect(() => {
    close();
  }, [pathname, close]);

  async function logout() {
    if (loggingOut) return;
    setLoggingOut(true);
    setLogoutError("");
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (!res.ok) throw new Error("logout_failed");
      close();
      setAccount(null);
      router.refresh();
    } catch {
      setLoggingOut(false);
      setLogoutError("خروج انجام نشد. دوباره تلاش کنید.");
    }
  }

  if (!loaded) {
    return (
      <span className="session-control">
        <span
          className={chrome === "site" ? "session-loading" : "inline-block h-11 w-11 rounded-full bg-elev"}
          aria-hidden="true"
        />
      </span>
    );
  }

  if (!account) {
    if (pathname === "/signin") return null;
    return (
      <span className="session-control">
        <Link
          href="/signin"
          className={
            chrome === "site"
              ? "session-login-button"
              : "inline-flex h-11 min-h-11 items-center gap-1.5 rounded-[var(--radius-sm)] px-2.5 text-sm font-medium leading-none text-ink hover:bg-elev"
          }
          aria-label="ورود"
        >
          <LogIn className="h-4 w-4 shrink-0" strokeWidth={1.5} />
          <span>ورود</span>
        </Link>
      </span>
    );
  }

  const name = accountLabel(account);
  const avatar = account.avatar ?? { variant: defaultAvatarVariant(account.id), photoUrl: null };
  const showDesk = account.role === "owner" || account.role === "author" || account.analyzerDesk;
  const deskHref = account.role === "owner" ? "/workspace" : "/workspace/analyzers";

  if (chrome === "site") {
    return (
      <div className="session-control">
        <button
          ref={trigger}
          type="button"
          className="session-avatar-button"
          aria-expanded={open}
          aria-controls={id}
          onClick={toggle}
        >
          <UserAvatar variant={avatar.variant} photoUrl={avatar.photoUrl} size={44} />
          <span className="sr-only">{open ? "بستن منوی حساب" : `حساب ${name}`}</span>
        </button>
        <div
          id={id}
          ref={panel}
          hidden={!visible}
          inert={!open || undefined}
          className="profile-dropdown"
        >
          <div className="profile-dropdown-identity">
            <UserAvatar variant={avatar.variant} photoUrl={avatar.photoUrl} size={44} />
            <div>
              <strong>{name}</strong>
              <small>{roleFa(account.role)}</small>
            </div>
          </div>
          <nav aria-label="حساب">
            <ul>
              <li>
                <Link href="/account" onClick={() => close()}>
                  حساب من
                </Link>
              </li>
              {account.needsPassword ? (
                <li>
                  <Link href="/account#password" onClick={() => close()}>
                    تعیین رمز عبور
                  </Link>
                </li>
              ) : null}
              {showDesk ? (
                <li>
                  <Link href={deskHref} onClick={() => close()}>
                    میزکار
                  </Link>
                </li>
              ) : null}
              <li>
                <button type="button" className="profile-logout" disabled={loggingOut} onClick={() => void logout()}>
                  {loggingOut ? "در حال خروج…" : "خروج"}
                </button>
              </li>
            </ul>
          </nav>
          {logoutError ? (
            <div className="profile-dropdown-footer">
              <p role="status">{logoutError}</p>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        ref={trigger}
        type="button"
        className="inline-flex min-h-11 min-w-11 items-center gap-1 rounded-full pe-1 hover:bg-elev"
        aria-expanded={open}
        aria-controls={id}
        onClick={toggle}
      >
        <UserAvatar variant={avatar.variant} photoUrl={avatar.photoUrl} size={40} />
        <ChevronDown className={`h-4 w-4 text-muted transition ${open ? "rotate-180" : ""}`} strokeWidth={1.5} />
        <span className="sr-only">{open ? "بستن منوی حساب" : `حساب ${name}`}</span>
      </button>
      <div
        id={id}
        ref={panel}
        hidden={!visible}
        inert={!open || undefined}
        className="absolute end-0 z-50 mt-2 w-64 max-h-[min(28rem,calc(100dvh-5rem))] overflow-y-auto rounded-[var(--radius-md)] border border-line bg-paper p-2 shadow-[var(--shadow-sm)]"
      >
        <div className="flex items-center gap-3 rounded-[var(--radius-sm)] px-2 py-2">
          <UserAvatar variant={avatar.variant} photoUrl={avatar.photoUrl} size={44} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{name}</p>
            <p className="text-xs text-muted">{roleFa(account.role)}</p>
          </div>
        </div>
        <nav className="mt-1 flex flex-col gap-0.5 border-t border-line pt-2" aria-label="حساب">
          <Link
            href="/account"
            className="rounded-[var(--radius-sm)] px-3 py-2.5 text-sm text-ink hover:bg-elev"
            onClick={() => close()}
          >
            حساب من
          </Link>
          {account.needsPassword ? (
            <Link
              href="/account#password"
              className="rounded-[var(--radius-sm)] px-3 py-2.5 text-sm text-ink hover:bg-elev"
              onClick={() => close()}
            >
              تعیین رمز عبور
            </Link>
          ) : null}
          {showDesk ? (
            <Link
              href={deskHref}
              className="rounded-[var(--radius-sm)] px-3 py-2.5 text-sm text-ink hover:bg-elev"
              onClick={() => close()}
            >
              میزکار
            </Link>
          ) : null}
          <button
            type="button"
            className="rounded-[var(--radius-sm)] px-3 py-2.5 text-start text-sm text-muted hover:bg-elev hover:text-ink disabled:opacity-60"
            disabled={loggingOut}
            onClick={() => void logout()}
          >
            {loggingOut ? "در حال خروج…" : "خروج"}
          </button>
        </nav>
        {logoutError ? (
          <p className="mt-2 px-3 text-xs text-red-700 dark:text-red-300" role="status">
            {logoutError}
          </p>
        ) : null}
      </div>
    </div>
  );
}
