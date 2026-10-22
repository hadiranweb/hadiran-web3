import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/guard";
import { getStudioPage, saveStudioDraft, studioEnabled } from "@/lib/studio/pages";
import { cleanSeo, cleanSlug, validateStudioData } from "@/lib/studio/validate";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  if (!studioEnabled()) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  const { id } = await params;
  const page = await getStudioPage(id);
  if (!page) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({
    page: {
      id: page.id,
      slug: page.slug,
      titleFa: page.titleFa,
      status: page.status,
      draftData: page.draftData,
      seo: page.seo,
      publishedAt: page.publishedAt,
    },
  });
}

export async function PATCH(request: Request, { params }: Ctx) {
  if (!studioEnabled()) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  const { id } = await params;
  let body: { titleFa?: unknown; slug?: unknown; data?: unknown; seo?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const draft = validateStudioData(body.data);
  if (!draft) return NextResponse.json({ error: "invalid_data" }, { status: 400 });
  const ok = await saveStudioDraft(id, {
    titleFa: typeof body.titleFa === "string" ? body.titleFa.trim().slice(0, 256) : undefined,
    slug: body.slug !== undefined ? (cleanSlug(body.slug) ?? undefined) : undefined,
    draft,
    seo: cleanSeo(body.seo),
  });
  if (!ok) return NextResponse.json({ error: "save_failed" }, { status: 400 });
  return NextResponse.json({ ok: true });
}
