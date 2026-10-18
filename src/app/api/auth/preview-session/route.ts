import { NextResponse } from "next/server";
import { validPreviewTicket } from "@/lib/auth/preview-ticket";

export const dynamic = "force-dynamic";
/** Cookie-free recovery uses JSON, not Authorization (preview proxies can consume it). */
export async function POST(request: Request) {
  let body: { ticket?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }); }
  const ticket = typeof body?.ticket === "string" ? body.ticket : "";
  if (!validPreviewTicket(ticket)) return NextResponse.json({ error: "invalid_preview_grant" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  return NextResponse.json({ ok: true, account: { id: 0, role: "owner" } }, { headers: { "Cache-Control": "private, no-store" } });
}
