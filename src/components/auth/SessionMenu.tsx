"use client";
import { previewFetch as fetch } from "@/lib/auth/preview-fetch";
import { useEffect, useState } from "react";
import Link from "@/components/workspace/WorkspaceLink";
import { usePathname, useRouter } from "next/navigation";
import { KeyRound, LogOut, LayoutDashboard, UserRound, ChartNoAxesCombined, ShoppingBag, ArrowUpLeft } from "lucide-react";
import { PREVIEW_SESSION_KEY } from "@/lib/auth/preview-client";
import { clearDraftsByPrefix, subscribeAccount } from "@/lib/ui/draft";
import { defaultAvatarVariant, type AccountAvatar } from "@/lib/account/avatar";
import { workspaceHome } from "@/lib/workspace/access";
import type { AccountRole } from "@/lib/auth/roles";
import { UserAvatar } from "./UserAvatar";
import { useDisclosure } from "@/components/navigation/useDisclosure";
type Account = { id: number; displayName: string | null; phone: string; role: AccountRole; avatar?: AccountAvatar; needsPassword?: boolean; analyzerDesk?: boolean };
export function SessionMenu() {
  const pathname = usePathname(); const router = useRouter();
  const [account, setAccount] = useState<Account | null | undefined>(undefined);
  const [busy, setBusy] = useState(false); const [error, setError] = useState(false);
  const { id, open, visible, panel, trigger, toggle, close } = useDisclosure();
  useEffect(() => { close(); }, [pathname, close]);
  useEffect(() => {
    let cancelled = false;
    function load() { fetch("/api/auth/me", { cache: "no-store" }).then(async res => res.ok ? (await res.json()).account as Account | null : null).then(next => { if (!cancelled) setAccount(next); }).catch(() => { if (!cancelled) setAccount(null); }); }
    load(); const stop = subscribeAccount(() => load());
    return () => { cancelled = true; stop(); };
  }, [pathname]);
  async function logout() {
    if (busy) return; setBusy(true); setError(false);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("logout_failed");
      try { sessionStorage.removeItem(PREVIEW_SESSION_KEY); } catch {}
      for (const prefix of ["account", "onboarding", "casio", "capture", "analyzer"]) clearDraftsByPrefix(prefix);
      close(); setAccount(null); router.replace("/"); router.refresh();
    } catch { setError(true); } finally { setBusy(false); }
  }
  if (account === undefined) return <span className="session-loading" aria-label="در حال بررسی حساب" />;
  if (!account) return <Link href={`/signin?next=${encodeURIComponent(pathname === "/signin" ? "/" : pathname)}`} className="session-login-button" aria-label="ورود به حساب"><KeyRound size={17} strokeWidth={1.8} aria-hidden="true" /><span>ورود</span></Link>;
  const name = account.displayName?.trim() || "حساب من";
  const links = [
    { href: "/account", title: "حساب و تصویر پروفایل", icon: UserRound },
    ...(["owner", "author"].includes(account.role) || account.analyzerDesk ? [{ href: workspaceHome(account), title: "میز کار من", icon: LayoutDashboard }] : []),
    ...(account.needsPassword ? [{ href: "/account#password", title: "تنظیم رمز ثابت", icon: KeyRound }] : []),
    { href: "/analyzers", title: "تحلیلگرهای من", icon: ChartNoAxesCombined },
    { href: "/shop", title: "فروشگاه", icon: ShoppingBag },
  ];
  return <div className="session-control">
    <button ref={trigger} type="button" className="session-avatar-button" onClick={toggle} aria-label={`باز کردن دسترسی‌های حساب ${name}`} aria-expanded={open} aria-controls={`profile-${id}`} title={name}>{account.needsPassword ? <span className="absolute top-0 end-0 h-2.5 w-2.5 rounded-full bg-mark ring-2 ring-paper" aria-hidden="true" /> : null}<UserAvatar variant={account.avatar?.variant ?? defaultAvatarVariant(account.id)} photoUrl={account.avatar?.photoUrl} /></button>
    <div id={`profile-${id}`} ref={panel} className="profile-dropdown" hidden={!visible} inert={!open || undefined} aria-hidden={!open}>
      <div className="profile-dropdown-identity"><UserAvatar variant={account.avatar?.variant ?? defaultAvatarVariant(account.id)} photoUrl={account.avatar?.photoUrl} size={48} /><div><strong>{name}</strong><small>{account.role === "owner" ? "حساب مالک" : account.role === "author" ? "حساب نویسنده" : "حساب کاربری"}</small></div></div>
      <nav aria-label="دسترسی‌های سریع حساب"><ul>{links.map(link => <li key={link.href}><Link href={link.href} onClick={() => close()}><link.icon size={18} aria-hidden="true" /><span>{link.title}</span><ArrowUpLeft size={15} className="profile-link-arrow" aria-hidden="true" /></Link></li>)}</ul></nav>
      <div className="profile-dropdown-footer"><button type="button" onClick={() => void logout()} disabled={busy} className="profile-logout"><LogOut size={18} aria-hidden="true" />{busy ? "در حال خروج…" : "خروج از حساب"}</button>{error ? <p role="alert">خروج انجام نشد؛ دوباره تلاش کنید.</p> : null}</div>
    </div>
  </div>;
}
