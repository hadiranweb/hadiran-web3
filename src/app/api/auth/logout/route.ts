import { revokePreviewTicket } from "@/lib/auth/preview-ticket";
import { NextResponse } from "next/server";
import { recordAuthEvent } from "@/lib/auth/audit";
import { getCurrentAccount, revokeCurrentSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const account = await getCurrentAccount();
  try {
    const body = await request.json() as { preview_ticket?: unknown };
    if (typeof body?.preview_ticket === "string") revokePreviewTicket(body.preview_ticket);
  } catch { /* Normal cookie logout has no JSON body. */ }
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
