import { NextResponse } from "next/server";
import { grantAnalyzer, analyzerAccess, listAnalyzerGrants, revokeAnalyzerGrant } from "@/lib/analyzers/access";
import { requireAccount } from "@/lib/auth/guard";
import { normalizePublicCode } from "@/lib/auth/public-code";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  const auth = await requireAccount();
  if (auth.error) return auth.error;
  if (auth.account.id === 0) return NextResponse.json({ error: "این بخش به دیتابیس واقعی نیاز دارد." }, { status: 503 });
  const { slug } = await params;
  const access = await analyzerAccess(auth.account, slug);
  if (!access.grant) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const items = await listAnalyzerGrants(slug);
  return NextResponse.json({ items });
}

export async function POST(request: Request, { params }: Ctx) {
  const auth = await requireAccount();
  if (auth.error) return auth.error;
  if (auth.account.id === 0) return NextResponse.json({ error: "این بخش به دیتابیس واقعی نیاز دارد." }, { status: 503 });
  const { slug } = await params;
  const access = await analyzerAccess(auth.account, slug);
  if (!access.grant) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const body = (await request.json().catch(() => ({}))) as { publicCode?: unknown; canEdit?: unknown; canReadResponses?: unknown };
  const publicCode = normalizePublicCode(body.publicCode);
  if (!publicCode) return NextResponse.json({ error: "شناسهٔ ۸رقمی نامعتبر است." }, { status: 400 });
  const result = await grantAnalyzer({ slug, publicCode, actorId: auth.account.id, canEdit: body.canEdit === true, canReadResponses: body.canReadResponses !== false });
  if (!result.ok) {
    const map: Record<string, string> = {
      not_found: "آزمون پیدا نشد.",
      unknown_code: "این شناسه حسابی ندارد.",
      self_grant: "نمی‌توانید به خودتان اعطا کنید.",
    };
    return NextResponse.json({ error: map[result.error] ?? result.error }, { status: 400 });
  }
  const items = await listAnalyzerGrants(slug);
  return NextResponse.json({ ok: true, items });
}

export async function DELETE(request: Request, { params }: Ctx) {
  const auth = await requireAccount();
  if (auth.error) return auth.error;
  if (auth.account.id === 0) return NextResponse.json({ error: "این بخش به دیتابیس واقعی نیاز دارد." }, { status: 503 });
  const { slug } = await params;
  const access = await analyzerAccess(auth.account, slug);
  if (!access.grant) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const body = (await request.json().catch(() => ({}))) as { publicCode?: unknown };
  const publicCode = normalizePublicCode(body.publicCode);
  if (!publicCode) return NextResponse.json({ error: "شناسهٔ ۸رقمی نامعتبر است." }, { status: 400 });
  await revokeAnalyzerGrant(slug, publicCode);
  const items = await listAnalyzerGrants(slug);
  return NextResponse.json({ ok: true, items });
}
