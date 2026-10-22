import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/guard";
import { getServer, deleteServer, saveServer, type SaveServerInput } from "@/lib/mcp/registry";
import { checkServerHealth, syncRemoteServer } from "@/lib/mcp/remote";

export const dynamic = "force-dynamic";

export async function PUT(request: Request, ctx: { params: Promise<{ slug: string }> }) {
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  const { slug } = await ctx.params;
  const body = (await request.json().catch(() => ({}))) as SaveServerInput;
  const result = await saveServer(auth.account.id, { ...body, slug });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true, server: result.server });
}

export async function DELETE(_request: Request, ctx: { params: Promise<{ slug: string }> }) {
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  const { slug } = await ctx.params;
  const ok = await deleteServer(slug);
  return NextResponse.json({ ok });
}

/** کنش‌های سرور: بررسی سلامت یا کشف و همگام‌سازی ابزارهای سرور راه‌دور. */
export async function POST(request: Request, ctx: { params: Promise<{ slug: string }> }) {
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  const { slug } = await ctx.params;
  const body = (await request.json().catch(() => ({}))) as { action?: unknown };
  const server = await getServer(slug);
  if (!server) return NextResponse.json({ error: "سرور پیدا نشد." }, { status: 404 });

  if (body.action === "sync") {
    if (server.kind !== "remote") {
      return NextResponse.json({ error: "همگام‌سازی فقط برای سرور راه‌دور است." }, { status: 400 });
    }
    const outcome = await syncRemoteServer(server);
    if (!outcome.ok) return NextResponse.json({ error: outcome.error }, { status: 502 });
    return NextResponse.json({ ok: true, count: outcome.count });
  }
  if (body.action === "health") {
    const outcome = await checkServerHealth(server);
    return NextResponse.json({ ok: outcome.ok, error: outcome.error ?? null });
  }
  return NextResponse.json({ error: "کنش نامعتبر است." }, { status: 400 });
}
