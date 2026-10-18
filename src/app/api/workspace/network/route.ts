import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/guard";
import { loadReferralTree } from "@/lib/auth/network";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  const tree = await loadReferralTree();
  return NextResponse.json({ tree });
}
