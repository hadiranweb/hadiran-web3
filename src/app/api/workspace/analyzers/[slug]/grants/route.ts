import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/guard";
import { grantAnalyzer, listAnalyzerGrants, revokeAnalyzerGrant } from "@/lib/analyzers/access";
import { normalizePublicCode } from "@/lib/auth/public-code";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  const { slug } = await params;
  const items = await listAnalyzerGrants(slug);
  return NextResponse.json({ items });
}

export async function POST(request: Request, { params }: Ctx) {
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  const { slug } = await params;
  const body = (await request.json().catch(() => ({}))) as { publicCode?: unknown };
  const publicCode = normalizePublicCode(body.publicCode);
  if (!publicCode) return NextResponse.json({ error: "شناسهٔ ۸رقمی نامعتبر است." }, { status: 400 });
  const result = await grantAnalyzer({ slug, publicCode });
  if (!result.ok) {
    const map: Record<string, string> = {
      not_found: "آزمون پیدا نشد.",
      unknown_code: "این شناسه حسابی ندارد.",
    };
    return NextResponse.json({ error: map[result.error] ?? result.error }, { status: 400 });
  }
  const items = await listAnalyzerGrants(slug);
  return NextResponse.json({ ok: true, items });
}

export async function DELETE(request: Request, { params }: Ctx) {
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  const { slug } = await params;
  const body = (await request.json().catch(() => ({}))) as { publicCode?: unknown };
  const publicCode = normalizePublicCode(body.publicCode);
  if (!publicCode) return NextResponse.json({ error: "شناسهٔ ۸رقمی نامعتبر است." }, { status: 400 });
  await revokeAnalyzerGrant(slug, publicCode);
  const items = await listAnalyzerGrants(slug);
  return NextResponse.json({ ok: true, items });
}
