import { NextResponse } from "next/server";
import { requireAccount } from "@/lib/auth/guard";
import { bookmarkBySlug, listShelf } from "@/lib/knowledge/bookmarks";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAccount();
  if (auth.error) return auth.error;
  try {
    const items = await listShelf(auth.account.id);
    return NextResponse.json({ items }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAccount();
  if (auth.error) return auth.error;
  const body = (await request.json().catch(() => null)) as { slug?: unknown; saved?: unknown } | null;
  const slug = typeof body?.slug === "string" ? body.slug.trim().slice(0, 128) : "";
  if (!slug) return NextResponse.json({ error: "slug_required" }, { status: 400 });
  try {
    const result = await bookmarkBySlug(auth.account.id, slug, body?.saved === true);
    if (!result.ok) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ saved: body?.saved === true });
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
