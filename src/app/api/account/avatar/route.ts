import { NextResponse } from "next/server";
import { requireAccount } from "@/lib/auth/guard";
import { AVATAR_COUNT } from "@/lib/account/avatar";
import { readAccountAvatar, chooseAccountAvatar } from "@/lib/account/avatar-store";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };
export async function GET() {
  const auth = await requireAccount(); if (auth.error) return auth.error;
  const { avatar } = await readAccountAvatar(auth.account);
  return NextResponse.json({ avatar }, { headers });
}
export async function PATCH(request: Request) {
  const auth = await requireAccount(); if (auth.error) return auth.error;
  let body: { variant?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "invalid_body" }, { status: 400, headers }); }
  if (typeof body?.variant !== "number" || !Number.isInteger(body.variant) || body.variant < 0 || body.variant >= AVATAR_COUNT) return NextResponse.json({ error: "invalid_avatar" }, { status: 400, headers });
  const avatar = await chooseAccountAvatar(auth.account, body.variant);
  return NextResponse.json({ ok: true, avatar }, { headers });
}
