import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/guard";
import { createBot, listBots } from "@/lib/bots/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  const items = await listBots(auth.account.id);
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  let body: { titleFa?: unknown; service?: unknown; analyzerSlug?: unknown };
  try {
    body = (await request.json()) as { titleFa?: unknown; service?: unknown; analyzerSlug?: unknown };
  } catch {
    return NextResponse.json({ error: "بدنه نامعتبر است." }, { status: 400 });
  }
  const titleFa = typeof body.titleFa === "string" ? body.titleFa : "";
  const analyzerSlug =
    typeof body.analyzerSlug === "string" && body.analyzerSlug.trim() ? body.analyzerSlug.trim() : null;
  try {
    const bot = await createBot(auth.account.id, { titleFa, service: body.service, analyzerSlug });
    return NextResponse.json({ ok: true, bot });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "ساخته نشد." }, { status: 400 });
  }
}
