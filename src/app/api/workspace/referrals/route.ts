import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/guard";
import { listMyReferrals } from "@/lib/auth/network";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireStaff();
  if (auth.error) return auth.error;
  const data = await listMyReferrals(auth.account.id);
  return NextResponse.json(data);
}
