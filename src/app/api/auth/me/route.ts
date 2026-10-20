import { NextResponse } from "next/server";
import { readAccountAvatar } from "@/lib/account/avatar-store";
import { hasAnalyzerDesk } from "@/lib/analyzers/access";
import { getCurrentAccount } from "@/lib/auth/session";
import { ensureAccountProfileSchema } from "@/lib/auth/schema-guard";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureAccountProfileSchema();
  const account = await getCurrentAccount();
  if (!account) return NextResponse.json({ account: null });
  const [analyzerDesk, { avatar }] = await Promise.all([
    hasAnalyzerDesk(account),
    readAccountAvatar(account),
  ]);
  return NextResponse.json({ account: { ...account, analyzerDesk, avatar } });
}
