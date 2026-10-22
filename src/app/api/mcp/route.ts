import { NextResponse } from "next/server";
import { secretsMatch } from "@/lib/bots/secret";
import { getMcpConfig, openExternalToken } from "@/lib/mcp/config";
import { getBinding, openBindingToken } from "@/lib/mcp/registry";
import { handleMcpRequest } from "@/lib/mcp/server";

export const dynamic = "force-dynamic";

/**
 * اندپوینت استاندارد MCP برای کلاینت‌های بیرونی (Streamable HTTP، JSON پاسخ ساده).
 * پیش‌فرض خاموش است؛ از /workspace/mcp روشن می‌شود و فقط با توکن Bearer صاحب سایت کار می‌کند.
 * GET برای استریم سرور-به-کلاینت نداریم → 405 طبق مشخصات مجاز است.
 */
export async function GET() {
  return NextResponse.json({ error: "method_not_allowed" }, { status: 405 });
}

export async function POST(request: Request) {
  const config = await getMcpConfig();
  if (!config.enableExternalEndpoint) {
    return NextResponse.json({ error: "mcp_endpoint_disabled" }, { status: 404 });
  }

  const expected = await openExternalToken();
  if (!expected) {
    return NextResponse.json({ error: "mcp_token_not_configured" }, { status: 503 });
  }
  const header = request.headers.get("authorization") ?? "";
  const given = header.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : null;
  if (!secretsMatch(given, expected)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const outcome = await handleMcpRequest(body);
  if (outcome.status === 202 || outcome.body === null) {
    return new NextResponse(null, { status: 202 });
  }
  return NextResponse.json(outcome.body, { status: outcome.status });
}
