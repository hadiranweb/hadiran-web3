import { NextResponse } from "next/server";
import { hasAnalyzerDesk } from "@/lib/analyzers/access";
import { getCurrentAccount } from "@/lib/auth/session";
import { ensureAccountProfileSchema } from "@/lib/auth/schema-guard";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureAccountProfileSchema();
  const account = await getCurrentAccount();
  if (!account) return NextResponse.json({ account: null });
  const analyzerDesk = await hasAnalyzerDesk(account);
  return NextResponse.json({ account: { ...account, analyzerDesk } });
}
