import { NextResponse } from "next/server";
import { requireAccount } from "@/lib/auth/guard";
import { referredByPublicCode, setAccountReferrer } from "@/lib/auth/referral";
import { ensureAccountPublicCode } from "@/lib/auth/public-code";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAccount();
  if (auth.error) return auth.error;
  if (auth.account.id === 0) return NextResponse.json({ error: "این بخش به دیتابیس واقعی نیاز دارد." }, { status: 503 });
  const publicCode = await ensureAccountPublicCode(auth.account.id);
  const referredBy = await referredByPublicCode(auth.account.id);
  return NextResponse.json({ publicCode, referredBy });
}

export async function POST(request: Request) {
  const auth = await requireAccount();
  if (auth.error) return auth.error;
  if (auth.account.id === 0) return NextResponse.json({ error: "این بخش به دیتابیس واقعی نیاز دارد." }, { status: 503 });
  const body = (await request.json().catch(() => ({}))) as { referralCode?: unknown };
  const result = await setAccountReferrer(auth.account.id, body.referralCode);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  if ("skipped" in result) return NextResponse.json({ ok: true });
  return NextResponse.json({ ok: true, referredBy: result.publicCode });
}
