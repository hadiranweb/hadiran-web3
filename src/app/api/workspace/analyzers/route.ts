import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/guard";
import { listAccessiblePacks } from "@/lib/analyzers/access";
import { insertAuthoredPack, readAuthoredPack } from "@/lib/analyzers/authored";
import { blankPack, isPackSlug, sanitizePack } from "@/lib/analyzers/sanitize";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireStaff();
  if (auth.error) return auth.error;
  const items = await listAccessiblePacks(auth.account);
  return NextResponse.json({
    authored: items.map(({ pack, access }) => ({
      slug: pack.slug,
      nameFa: pack.nameFa,
      status: pack.status,
      version: pack.version,
      canEdit: access.edit,
      canReadResponses: access.responses,
      canGrant: access.grant,
    })),
  });
}

export async function POST(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;
  let body: { slug?: unknown; nameFa?: unknown };
  try {
    body = (await request.json()) as { slug?: unknown; nameFa?: unknown };
  } catch {
    return NextResponse.json({ error: "بدنه نامعتبر است." }, { status: 400 });
  }
  const slug = typeof body.slug === "string" ? body.slug.trim().toLowerCase() : "";
  const nameFa = typeof body.nameFa === "string" ? body.nameFa.replace(/\s+/g, " ").trim() : "";
  if (!isPackSlug(slug)) {
    return NextResponse.json({ error: "شناسه لاتین و یکتا باشد." }, { status: 400 });
  }
  if (nameFa.length < 3) {
    return NextResponse.json({ error: "نام فارسی حداقل سه نویسه باشد." }, { status: 400 });
  }
  const existing = await readAuthoredPack(slug);
  if (existing) {
    return NextResponse.json({ error: "این شناسه قبلاً هست." }, { status: 409 });
  }
  const created = sanitizePack(blankPack(slug, nameFa), slug);
  if (!created.ok) return NextResponse.json({ error: created.error }, { status: 400 });
  await insertAuthoredPack(created.pack, auth.account.id);
  return NextResponse.json({ ok: true, slug: created.pack.slug });
}
