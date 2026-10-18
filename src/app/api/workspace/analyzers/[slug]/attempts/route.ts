import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/guard";
import { readAuthoredPack } from "@/lib/analyzers/authored";
import { listWorkspaceAttempts } from "@/lib/analyzers/workspace-attempts";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  const { slug } = await params;
  const pack = await readAuthoredPack(slug);
  if (!pack) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const items = await listWorkspaceAttempts(slug);
  return NextResponse.json({ items });
}
