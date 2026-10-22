import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/guard";
import { listBindings, listBindingTools, saveBinding, setBindingTool } from "@/lib/mcp/registry";

export const dynamic = "force-dynamic";

/** بستن‌های مصرف‌کننده و ابزارهای هر بستن. فقط owner. */
export async function GET() {
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  const bindings = await listBindings();
  const bindingTools: Record<string, { toolId: number; enabled: boolean; paramOverrides: Record<string, unknown> }[]> = {};
  for (const binding of bindings) {
    bindingTools[binding.consumer] = await listBindingTools(binding.consumer);
  }
  return NextResponse.json({ bindings, bindingTools });
}

export async function PUT(request: Request) {
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  const body = (await request.json().catch(() => ({}))) as {
    consumer?: unknown;
    enabled?: unknown;
    token?: unknown;
    clearToken?: unknown;
  };
  const result = await saveBinding(body);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true, binding: result.binding });
}

export async function POST(request: Request) {
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  const body = (await request.json().catch(() => ({}))) as {
    consumer?: unknown;
    toolId?: unknown;
    enabled?: unknown;
    paramOverrides?: unknown;
  };
  const ok = await setBindingTool(body);
  return NextResponse.json({ ok }, { status: ok ? 200 : 400 });
}
