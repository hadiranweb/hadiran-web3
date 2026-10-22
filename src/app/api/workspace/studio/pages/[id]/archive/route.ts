import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/guard";
import { archiveStudioPage, studioEnabled } from "@/lib/studio/pages";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Ctx) {
  if (!studioEnabled()) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  const { id } = await params;
  const ok = await archiveStudioPage(id);
  if (!ok) return NextResponse.json({ error: "archive_failed" }, { status: 400 });
  return NextResponse.json({ ok: true });
}
