import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/guard";
import { getStudioPage, saveStudioDraft, studioEnabled } from "@/lib/studio/pages";
import { cleanSeo, cleanSlug, EMPTY_STUDIO_DATA, validateStudioData } from "@/lib/studio/validate";
import { hasUnpublishedDraft, statusAfterSavingDraft } from "@/lib/studio/publication-state";
import { resolveStudioData } from "@/lib/studio/resolve";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  if (!studioEnabled()) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  const { id } = await params;
  const page = await getStudioPage(id);
  if (!page) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const draftData = validateStudioData(page.draftData, { target: page.target }) ?? EMPTY_STUDIO_DATA;
  const previewData = await resolveStudioData(draftData, { mode: "preview" });
  return NextResponse.json({
    page: {
      id: page.id,
      slug: page.slug,
      titleFa: page.titleFa,
      status: page.status,
      draftAhead: page.status === "published" && hasUnpublishedDraft(page.draftData, page.publishedData),
      target: page.target,
      draftData,
      previewData,
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
  const page = await getStudioPage(id);
  if (!page) return NextResponse.json({ error: "not_found" }, { status: 404 });
  let body: { titleFa?: unknown; slug?: unknown; data?: unknown; seo?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const draft = validateStudioData(body.data, { target: page.target });
  if (!draft) return NextResponse.json({ error: "invalid_data_or_target_block" }, { status: 400 });
  const titleFa = typeof body.titleFa === "string" ? body.titleFa.trim().slice(0, 256) : undefined;
  if (titleFa !== undefined && !titleFa) return NextResponse.json({ error: "invalid_title" }, { status: 400 });
  let slug: string | undefined;
  if (body.slug !== undefined) {
    slug = cleanSlug(body.slug) ?? undefined;
    if (!slug) return NextResponse.json({ error: "invalid_slug" }, { status: 400 });
    if (page.target !== "standalone" && slug !== page.slug) {
      return NextResponse.json({ error: "site_slug_locked" }, { status: 400 });
    }
  }
  const ok = await saveStudioDraft(id, { titleFa, slug, draft, seo: cleanSeo(body.seo) });
  if (!ok) return NextResponse.json({ error: "save_failed" }, { status: 400 });
  return NextResponse.json({
    ok: true,
    status: statusAfterSavingDraft(page.status, page.publishedData),
    draftAhead: statusAfterSavingDraft(page.status, page.publishedData) === "published" && hasUnpublishedDraft(draft, page.publishedData),
  });
}
