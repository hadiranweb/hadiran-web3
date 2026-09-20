import { NextResponse } from "next/server";
import { recordAuthEvent } from "@/lib/auth/audit";
import { getCurrentAccount, revokeCurrentSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const account = await getCurrentAccount();
  await revokeCurrentSession();
  await recordAuthEvent({
    request,
    eventType: "logout",
    outcome: "success",
    accountId: account?.id ?? null,
    phone: account?.phone ?? null,
  });
  return NextResponse.json({ ok: true });
}
