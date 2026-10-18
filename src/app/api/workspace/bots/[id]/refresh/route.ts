import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/guard";
import { refreshBot } from "@/lib/bots/store";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Ctx) {
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  const { id } = await params;
  try {
    const bot = await refreshBot(auth.account.id, id);
    return NextResponse.json({ ok: true, bot });
  } catch (error) {
    const message = error instanceof Error ? error.message : "بروزرسانی نشد.";
    const status = message === "not_found" ? 404 : 400;
    return NextResponse.json({ error: message === "not_found" ? "پیدا نشد." : message }, { status });
  }
}
