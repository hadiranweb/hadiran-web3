import { readAccountAvatar } from "@/lib/account/avatar-store";
import { previewStore } from "@/lib/preview/store";
import { NextResponse } from "next/server";
import { hasAnalyzerDesk } from "@/lib/analyzers/access";
import { getCurrentAccount } from "@/lib/auth/session";
import { ensureAccountProfileSchema } from "@/lib/auth/schema-guard";

export const dynamic = "force-dynamic";

export async function GET() {
  if (process.env.DATABASE_URL) await ensureAccountProfileSchema();
  const account = await getCurrentAccount();
  const analyzerDesk = account ? await hasAnalyzerDesk(account) : false;
  const preview = account?.id === 0 ? await previewStore(account) : null;
  const profile = preview?.profile;
  const avatar = account ? (await readAccountAvatar(account)).avatar : null;
  const identity = account ? { ...account, analyzerDesk, ...(profile ? { ...profile, displayName: `${profile.givenName} ${profile.familyName}`.trim() } : {}), avatar } : null;
  return NextResponse.json({ account: identity }, { headers: { "Cache-Control": "private, no-store" } });
}
