import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/guard";
import { resolveStudioData } from "@/lib/studio/resolve";
import { studioEnabled } from "@/lib/studio/pages";
import { validateStudioData } from "@/lib/studio/validate";

export const dynamic = "force-dynamic";

/** پیش‌نمایش دادهٔ زنده برای ادیتور؛ خروجی resolveشده ذخیره نمی‌شود (اعتبارسنجی هنگام ذخیره items را حذف می‌کند). */
export async function POST(request: Request) {
  if (!studioEnabled()) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  let body: { data?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const data = validateStudioData(body.data);
  if (!data) return NextResponse.json({ error: "invalid_data" }, { status: 400 });
  const resolved = await resolveStudioData(data);
  return NextResponse.json({ data: resolved });
}
