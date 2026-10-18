import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/guard";
import { loadReferralTree } from "@/lib/auth/network";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  if (auth.account.id === 0) return NextResponse.json({ error: "این بخش به دیتابیس واقعی نیاز دارد." }, { status: 503 });
  const tree = await loadReferralTree();
  return NextResponse.json({ tree });
}
