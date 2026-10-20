import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { collaborations } from "@/db/schema";
import { requireOwner } from "@/lib/auth/guard";

export const dynamic = "force-dynamic";

const statuses = ["submitted", "reviewed", "shortlisted", "interview", "accepted", "rejected"] as const;

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  const { id: raw } = await params;
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const body = (await request.json().catch(() => ({}))) as { status?: unknown };
  const status = typeof body.status === "string" && statuses.includes(body.status as (typeof statuses)[number])
    ? (body.status as (typeof statuses)[number])
    : null;
  if (!status) return NextResponse.json({ error: "invalid_status" }, { status: 400 });
  const [existing] = await db.select({ id: collaborations.id }).from(collaborations).where(eq(collaborations.id, id)).limit(1);
  if (!existing) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const [updated] = await db.update(collaborations).set({ status }).where(eq(collaborations.id, id)).returning({ id: collaborations.id, status: collaborations.status });
  return NextResponse.json({ ok: true, item: updated });
}
