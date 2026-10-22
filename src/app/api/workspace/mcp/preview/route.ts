import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/guard";
import { previewMcpTurn } from "@/lib/mcp/orchestrator";

export const dynamic = "force-dynamic";

/**
 * سندباکس تست دوحالته — فقط owner و فقط با زمینهٔ خودِ او.
 * حساب دیگری شبیه‌سازی نمی‌شود تا دادهٔ خصوصی کسی وارد پیش‌نمایش نشود.
 */
export async function POST(request: Request) {
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  const body = (await request.json().catch(() => ({}))) as { message?: unknown };
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) return NextResponse.json({ error: "پیام نمونه لازم است." }, { status: 400 });
  const result = await previewMcpTurn({ message, account: auth.account });
  return NextResponse.json(result);
}
