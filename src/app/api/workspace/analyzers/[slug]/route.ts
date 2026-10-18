import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/guard";
import { readAuthoredPack, updateAuthoredPack } from "@/lib/analyzers/authored";
import { sanitizePack } from "@/lib/analyzers/sanitize";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  const { slug } = await params;
  const pack = await readAuthoredPack(slug);
  if (!pack) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ pack, readonly: false });
}

export async function PUT(request: Request, { params }: Ctx) {
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  const { slug } = await params;
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
