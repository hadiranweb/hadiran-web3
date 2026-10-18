import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/guard";
import { analyzerAccess } from "@/lib/analyzers/access";
import { readAuthoredPack, updateAuthoredPack } from "@/lib/analyzers/authored";
import { sanitizePack } from "@/lib/analyzers/sanitize";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;
  const { slug } = await params;
  const pack = await readAuthoredPack(slug);
  if (!pack) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const access = await analyzerAccess(auth.account, slug);
  if (!access.view) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  return NextResponse.json({
    pack,
    canEdit: access.edit,
    canReadResponses: access.responses,
    canGrant: access.grant,
  });
}

export async function PUT(request: Request, { params }: Ctx) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;
  const { slug } = await params;
  const access = await analyzerAccess(auth.account, slug);
  if (!access.edit) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const existing = await readAuthoredPack(slug);
  if (!existing) return NextResponse.json({ error: "not_found" }, { status: 404 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "بدنه نامعتبر است." }, { status: 400 });
  }
  const result = sanitizePack(body, slug);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  const pack = await updateAuthoredPack(slug, result.pack);
  return NextResponse.json({ ok: true, pack });
}
