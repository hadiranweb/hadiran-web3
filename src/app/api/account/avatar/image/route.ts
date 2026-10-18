import { NextResponse } from "next/server";
import { requireAccount } from "@/lib/auth/guard";
import { readAccountAvatar } from "@/lib/account/avatar-store";
import { readAvatarImage } from "@/lib/account/avatar-disk";
export const dynamic = "force-dynamic";
export async function GET() {
  const auth = await requireAccount(); if (auth.error) return auth.error;
  const { imageKey } = await readAccountAvatar(auth.account);
  const image = imageKey ? await readAvatarImage(imageKey) : null;
  if (!image) return NextResponse.json({ error: "not_found" }, { status: 404, headers: { "Cache-Control": "private, no-store" } });
  return new Response(image.data, { headers: { "Content-Type": image.type, "X-Content-Type-Options": "nosniff", "Cache-Control": "private, no-store", "Content-Disposition": "inline" } });
}
