import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/guard";
import {
  listBindings,
  listBindingTools,
  listCallLogs,
  listPrompts,
  listResources,
  listServers,
  listTools,
  saveServer,
  type SaveServerInput,
} from "@/lib/mcp/registry";

export const dynamic = "force-dynamic";

/** نمای کامل سرویس MCP برای میز: سرورها، ابزارها، بستن‌ها، صف امنیت و حسابرسی. فقط owner. */
export async function GET() {
  const auth = await requireOwner();
  if (auth.error) return auth.error;

  const [servers, tools, resources, prompts, bindings, calls] = await Promise.all([
    listServers(),
    listTools(),
    listResources(),
    listPrompts(),
    listBindings(),
    listCallLogs(30),
  ]);
  const bindingTools: Record<string, { toolId: number; enabled: boolean; paramOverrides: Record<string, unknown> }[]> = {};
  for (const binding of bindings) {
    bindingTools[binding.consumer] = await listBindingTools(binding.consumer);
  }

  return NextResponse.json({
    servers,
    tools,
    resources,
    prompts,
    bindings,
    bindingTools,
    calls,
    security: {
      unreviewed: tools.filter((t) => t.reviewStatus === "unreviewed").length,
      rejected: tools.filter((t) => t.reviewStatus === "rejected").length,
      highRiskApproved: tools.filter((t) => t.reviewStatus === "approved" && t.riskLevel === "high").length,
    },
  });
}

export async function POST(request: Request) {
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  const body = (await request.json().catch(() => ({}))) as SaveServerInput;
  const result = await saveServer(auth.account.id, body);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true, server: result.server });
}
