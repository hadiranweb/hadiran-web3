import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/guard";
import { getStudioPage, publishStudioPage, studioEnabled, type StudioPublishInput } from "@/lib/studio/pages";
import { cleanSeo, cleanSlug, validateStudioData } from "@/lib/studio/validate";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Ctx) {
  if (!studioEnabled()) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  const { id } = await params;
  let input: StudioPublishInput | undefined;
  const raw = await request.text();
  if (raw.trim()) {
    let body: { titleFa?: unknown; slug?: unknown; data?: unknown; seo?: unknown };
    try {
      body = JSON.parse(raw) as typeof body;
    } catch {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }
    const page = await getStudioPage(id);
    if (!page) return NextResponse.json({ error: "not_found" }, { status: 404 });
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
    input = { titleFa, slug, draft, seo: cleanSeo(body.seo) };
  }
  const result = await publishStudioPage(id, auth.account.id, input);
  if (!result.ok) {
    const status = result.error === "not_found" ? 404 : result.error === "invalid_composition" ? 422 : 400;
    return NextResponse.json({ error: result.error ?? "publish_failed" }, { status });
  }
  return NextResponse.json(result);
}
