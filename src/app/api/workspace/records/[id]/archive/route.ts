import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/guard";
import { archiveGarden } from "@/lib/knowledge/lifecycle";

export const dynamic = "force-dynamic";

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, { params }: Ctx) {
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  const { id } = await params;
  try {
    await archiveGarden(id, auth.account.id);
    return NextResponse.json({ ok: true, id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "archive_failed";
    const status = message === "not_found" ? 404 : message === "forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
