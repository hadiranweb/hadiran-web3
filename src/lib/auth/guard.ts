import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
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
