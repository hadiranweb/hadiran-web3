import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { collaborations } from "@/db/schema";
import { getCurrentAccount } from "@/lib/auth/session";
const statuses = ["submitted", "reviewed", "shortlisted", "interview", "accepted", "rejected"] as const;
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const account = await getCurrentAccount();
  if (!account) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (account.role !== "owner") return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "demo_only" }, { status: 503 });
  const { id } = await params;
  if (!/^\d+$/.test(id) || !Number.isSafeInteger(Number(id)) || Number(id) <= 0) return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  let body: { status?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }); }
  if (!body || !statuses.includes(body.status as typeof statuses[number])) return NextResponse.json({ error: "invalid_status" }, { status: 400 });
  try {
    const [row] = await db.update(collaborations).set({ status: body.status as typeof statuses[number] }).where(eq(collaborations.id, Number(id))).returning({ id: collaborations.id, status: collaborations.status });
    return row ? NextResponse.json({ ok: true, item: row }) : NextResponse.json({ error: "not_found" }, { status: 404 });
  } catch { return NextResponse.json({ error: "db_unavailable" }, { status: 503 }); }
}
