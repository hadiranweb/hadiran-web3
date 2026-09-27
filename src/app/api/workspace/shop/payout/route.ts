import { NextResponse } from "next/server";
import { db } from "@/db";
import { shopPayoutDestinations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireOwner } from "@/lib/auth/guard";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  const [row] = await db.select().from(shopPayoutDestinations).where(eq(shopPayoutDestinations.id, 1));
  return NextResponse.json({ payout: row ?? null });
}

export async function PUT(request: Request) {
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  const body = (await request.json()) as Record<string, unknown>;
  const accountHandle = typeof body.accountHandle === "string" ? body.accountHandle.trim() : "";
  if (accountHandle.length < 4) {
    return NextResponse.json({ error: "مقصد دریافت را کامل وارد کنید." }, { status: 400 });
  }
  const accountAlias = typeof body.accountAlias === "string" ? body.accountAlias.trim() || null : null;
  const [existing] = await db.select().from(shopPayoutDestinations).where(eq(shopPayoutDestinations.id, 1));
  if (existing) {
    const [updated] = await db
      .update(shopPayoutDestinations)
      .set({
        accountHandle,
        accountAlias,
        updatedBy: auth.account.id,
        updatedAt: new Date(),
      })
      .where(eq(shopPayoutDestinations.id, 1))
      .returning();
    return NextResponse.json({ ok: true, payout: updated });
  }
  const [created] = await db
    .insert(shopPayoutDestinations)
    .values({
      id: 1,
      accountHandle,
      accountAlias,
      updatedBy: auth.account.id,
    })
    .returning();
  return NextResponse.json({ ok: true, payout: created });
}
