import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/guard";
import { createStudioPage, listStudioPages, studioEnabled } from "@/lib/studio/pages";
import { cleanSlug } from "@/lib/studio/validate";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!studioEnabled()) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  const { ready, pages } = await listStudioPages();
  return NextResponse.json({
    ready,
    pages: pages.map((p) => ({
      id: p.id,
      slug: p.slug,
      titleFa: p.titleFa,
      status: p.status,
      target: p.target,
      updatedAt: p.updatedAt,
      publishedAt: p.publishedAt,
    })),
  });
}

export async function POST(request: Request) {
  if (!studioEnabled()) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  let body: { slug?: unknown; titleFa?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const slug = cleanSlug(body.slug);
  const titleFa = typeof body.titleFa === "string" ? body.titleFa.trim().slice(0, 256) : "";
  if (!slug || !titleFa) return NextResponse.json({ error: "invalid_fields" }, { status: 400 });
  const page = await createStudioPage({ slug, titleFa, ownerId: auth.account.id });
  if (!page) return NextResponse.json({ error: "create_failed" }, { status: 409 });
  return NextResponse.json({ page: { id: page.id, slug: page.slug, titleFa: page.titleFa, status: page.status } });
}
