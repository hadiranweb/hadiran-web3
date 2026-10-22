import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/guard";
import {
  deleteTool,
  saveTool,
  setPromptEnabled,
  setResourceEnabled,
  type SaveToolInput,
} from "@/lib/mcp/registry";

export const dynamic = "force-dynamic";

/** ذخیره/به‌روزرسانی ابزار هر سرور (اسکیما، مقادیر، ریسک، بازبینی). فقط owner. */
export async function POST(request: Request) {
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  const body = (await request.json().catch(() => ({}))) as SaveToolInput & {
    assetKind?: unknown;
    assetId?: unknown;
    assetEnabled?: unknown;
  };

  // خاموش/روشن‌کردن منبع یا پرامپت.
  if (body.assetKind === "resource" || body.assetKind === "prompt") {
    const id = typeof body.assetId === "number" ? body.assetId : Number(body.assetId);
    if (!Number.isFinite(id)) return NextResponse.json({ error: "شناسه لازم است." }, { status: 400 });
    const ok =
      body.assetKind === "resource"
        ? await setResourceEnabled(id, Boolean(body.assetEnabled))
        : await setPromptEnabled(id, Boolean(body.assetEnabled));
    return NextResponse.json({ ok });
  }

  const result = await saveTool(body);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true, tool: result.tool });
}

export async function DELETE(request: Request) {
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isFinite(id)) return NextResponse.json({ error: "id لازم است." }, { status: 400 });
  const ok = await deleteTool(id);
  return NextResponse.json({ ok });
}
