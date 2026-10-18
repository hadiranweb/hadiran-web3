import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/guard";
import { connectBot } from "@/lib/bots/store";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Ctx) {
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  const { id } = await params;
  let token: string | null = null;
  try {
    const body = (await request.json()) as { token?: unknown };
    if (typeof body.token === "string" && body.token.trim()) token = body.token.trim();
  } catch {
    token = null;
  }
  try {
    const bot = await connectBot(auth.account.id, id, token);
    return NextResponse.json({ ok: true, bot });
  } catch (error) {
    const message = error instanceof Error ? error.message : "اتصال نشد.";
    const status = message === "not_found" ? 404 : 400;
    return NextResponse.json({ error: message === "not_found" ? "پیدا نشد." : message }, { status });
  }
}
