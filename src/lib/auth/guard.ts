import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { isOwner, isStaff } from "./roles";
import { getCurrentAccount, type SessionAccount } from "./session";

export async function requireAccount(): Promise<
  { account: SessionAccount; error: null } | { account: null; error: NextResponse }
> {
  const account = await getCurrentAccount();
  if (!account) {
    return {
      account: null,
      error: NextResponse.json({ error: "unauthorized" }, { status: 401 }),
    };
  }
  return { account, error: null };
}

export async function requirePageAccount(nextPath: string) {
  const account = await getCurrentAccount();
  if (!account) {
    const next = nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/";
    redirect(`/signin?next=${encodeURIComponent(next)}`);
  }
  return account;
}

export async function requireOwner(): Promise<
  { account: SessionAccount; error: null } | { account: null; error: NextResponse }
> {
  const auth = await requireAccount();
  if (auth.error) return auth;
  if (!isOwner(auth.account.role)) {
    return { account: null, error: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  }
  return auth;
}

export async function requirePageOwner(nextPath: string) {
  const account = await requirePageAccount(nextPath);
  if (account.role === "author") redirect("/workspace/analyzers");
  if (!isOwner(account.role)) {
    redirect("/");
  }
  return account;
}

export async function requireStaff(): Promise<
  { account: SessionAccount; error: null } | { account: null; error: NextResponse }
> {
  const auth = await requireAccount();
  if (auth.error) return auth;
  if (!isStaff(auth.account.role)) {
    return { account: null, error: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  }
  return auth;
}

export async function requirePageStaff(nextPath: string) {
  const account = await requirePageAccount(nextPath);
  if (!isStaff(account.role)) redirect("/");
  return account;
}
