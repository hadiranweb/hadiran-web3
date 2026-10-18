import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/guard";
import { deleteBot, readBot, updateBot } from "@/lib/bots/store";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  const { id } = await params;
  const bot = await readBot(auth.account.id, id);
  if (!bot) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ bot });
}

export async function PATCH(request: Request, { params }: Ctx) {
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  const { id } = await params;
  let body: { titleFa?: unknown; analyzerSlug?: unknown };
  try {
    body = (await request.json()) as { titleFa?: unknown; analyzerSlug?: unknown };
  } catch {
    return NextResponse.json({ error: "بدنه نامعتبر است." }, { status: 400 });
  }
  try {
    const bot = await updateBot(auth.account.id, id, {
      titleFa: typeof body.titleFa === "string" ? body.titleFa : undefined,
      analyzerSlug:
        body.analyzerSlug === null
          ? null
          : typeof body.analyzerSlug === "string"
            ? body.analyzerSlug.trim() || null
            : undefined,
    });
    return NextResponse.json({ ok: true, bot });
  } catch (error) {
    const message = error instanceof Error ? error.message : "ذخیره نشد.";
    const status = message === "not_found" ? 404 : 400;
    return NextResponse.json({ error: message === "not_found" ? "پیدا نشد." : message }, { status });
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  const { id } = await params;
  try {
    await deleteBot(auth.account.id, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "حذف نشد.";
    const status = message === "not_found" ? 404 : 400;
    return NextResponse.json({ error: message === "not_found" ? "پیدا نشد." : message }, { status });
  }
}
