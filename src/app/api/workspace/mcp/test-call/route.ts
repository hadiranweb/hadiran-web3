import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/guard";
import { dispatchBuiltinTool } from "@/lib/mcp/builtin";
import { getMcpConfig } from "@/lib/mcp/config";
import { getServer, listTools, logCall } from "@/lib/mcp/registry";
import { remoteCallTool } from "@/lib/mcp/remote";
import { applyValuePolicy, asRecord } from "@/lib/mcp/service-types";

export const dynamic = "force-dynamic";

/**
 * تست زندهٔ یک ابزار از میز — ابزار امنیتی/بازبینی.
 * فقط owner، با زمینهٔ خودش؛ نتیجه در حسابرسی ثبت می‌شود.
 * اجرای صریح owner همان «تأیید انسانی در حلقه» است.
 */
export async function POST(request: Request) {
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  const body = (await request.json().catch(() => ({}))) as {
    serverSlug?: unknown;
    toolName?: unknown;
    args?: unknown;
  };
  const serverSlug = typeof body.serverSlug === "string" ? body.serverSlug : "";
  const toolName = typeof body.toolName === "string" ? body.toolName : "";
  if (!serverSlug || !toolName) {
    return NextResponse.json({ error: "سرور و ابزار لازم است." }, { status: 400 });
  }

  const server = await getServer(serverSlug);
  if (!server) return NextResponse.json({ error: "سرور پیدا نشد." }, { status: 404 });
  const tool = (await listTools(serverSlug)).find((t) => t.name === toolName);
  if (!tool) return NextResponse.json({ error: "ابزار پیدا نشد." }, { status: 404 });

  const finalArgs = applyValuePolicy(tool, {}, asRecord(body.args));
  const config = await getMcpConfig();
  const started = Date.now();
  try {
    const out =
      server.kind === "remote"
        ? await remoteCallTool(server, tool.name, finalArgs, tool.timeoutMs)
        : await dispatchBuiltinTool(server.slug, tool.name, finalArgs, {
            account: auth.account,
            config,
          });
    void logCall({
      serverSlug,
      toolName,
      consumer: "desk_test",
      accountId: auth.account.id,
      ok: true,
      durationMs: Date.now() - started,
    });
    return NextResponse.json({ ok: true, ms: Date.now() - started, result: out ?? null });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    void logCall({
      serverSlug,
      toolName,
      consumer: "desk_test",
      accountId: auth.account.id,
      ok: false,
      error: message,
      durationMs: Date.now() - started,
    });
    return NextResponse.json({ ok: false, ms: Date.now() - started, error: message }, { status: 502 });
  }
}
