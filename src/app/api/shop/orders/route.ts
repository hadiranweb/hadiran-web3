import { NextResponse } from "next/server";
import { requireAccount } from "@/lib/auth/guard";
import { createOrResumeOrder, ShopError } from "@/lib/shop/orders";
import { db } from "@/db";
import { shopListings } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireAccount();
  if (auth.error) return auth.error;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const slug = typeof body.slug === "string" ? body.slug.trim() : "";
  if (!slug) return NextResponse.json({ error: "missing_slug" }, { status: 400 });
  const [listing] = await db.select().from(shopListings).where(eq(shopListings.slug, slug)).limit(1);
  if (!listing) return NextResponse.json({ error: "not_found" }, { status: 404 });
  try {
    const order = await createOrResumeOrder({
      buyerId: auth.account.id,
      buyerRole: auth.account.role,
      listingId: listing.id,
    });
    return NextResponse.json({ ok: true, id: order.id, slug: listing.slug });
  } catch (error) {
    if (error instanceof ShopError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[hadiran] shop create order", error);
    return NextResponse.json({ error: "order_failed" }, { status: 500 });
  }
}
