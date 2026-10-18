import { NextResponse } from "next/server";
import { assignAccountRole } from "@/lib/auth/assign-role";
import { requireOwner } from "@/lib/auth/guard";
import { normalizePublicCode } from "@/lib/auth/public-code";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  const body = (await request.json().catch(() => ({}))) as { publicCode?: unknown; role?: unknown };
  const publicCode = normalizePublicCode(body.publicCode);
  if (!publicCode) return NextResponse.json({ error: "شناسهٔ ۸رقمی نامعتبر است." }, { status: 400 });
  const role = body.role === "author" || body.role === "member" ? body.role : null;
  if (!role) return NextResponse.json({ error: "نقش نامعتبر است." }, { status: 400 });
  const result = await assignAccountRole({ publicCode, role });
  if (!result.ok) {
    const map: Record<string, string> = {
      unknown_code: "این شناسه حسابی ندارد.",
      cannot_change_owner: "نقش مدیر عوض نمی‌شود.",
    };
    return NextResponse.json({ error: map[result.error] ?? result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true, nameFa: result.nameFa, role: result.role });
}
