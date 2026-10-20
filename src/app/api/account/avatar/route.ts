import { NextResponse } from "next/server";
import { requireAccount } from "@/lib/auth/guard";
import { clampAvatarVariant } from "@/lib/account/avatar";
import { chooseAccountAvatar } from "@/lib/account/avatar-store";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  const auth = await requireAccount();
  if (auth.error) return auth.error;

  let body: { variant?: unknown };
  try {
    body = (await request.json()) as { variant?: unknown };
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const variant = clampAvatarVariant(body.variant);
  if (variant == null) {
    return NextResponse.json({ error: "invalid_variant" }, { status: 400 });
  }

  try {
    const avatar = await chooseAccountAvatar(auth.account, variant);
    return NextResponse.json({ ok: true, avatar });
  } catch {
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }
}
