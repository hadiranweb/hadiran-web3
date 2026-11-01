import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/guard";
import { resolveStudioData } from "@/lib/studio/resolve";
import { getStudioPage, studioEnabled } from "@/lib/studio/pages";
import { validateStudioData } from "@/lib/studio/validate";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** پیش‌نمایش دادهٔ زنده برای ادیتور؛ خروجی resolveشده ذخیره نمی‌شود و رفتارهای تعاملی خاموش‌اند. */
export async function POST(request: Request, { params }: Ctx) {
  if (!studioEnabled()) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  const { id } = await params;
  const page = await getStudioPage(id);
  if (!page) return NextResponse.json({ error: "not_found" }, { status: 404 });
  let body: { data?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const data = validateStudioData(body.data, { target: page.target });
  if (!data) return NextResponse.json({ error: "invalid_data_or_target_block" }, { status: 400 });
  const resolved = await resolveStudioData(data, { mode: "preview" });
  return NextResponse.json({ data: resolved });
}
