import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { shopEntitlements, shopListings, shopOrders, shopPayoutDestinations } from "@/db/schema";
import { newCanonicalId } from "@/lib/knowledge/ids";
import { OPEN_ORDER_STATES, type OrderState } from "./states";

export class ShopError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

async function loadOrder(orderId: string) {
  const [order] = await db.select().from(shopOrders).where(eq(shopOrders.id, orderId)).limit(1);
  if (!order) throw new ShopError("not_found", 404);
  return order;
}

async function setState(orderId: string, from: OrderState[], to: OrderState, patch: Partial<typeof shopOrders.$inferInsert>) {
  const [updated] = await db
    .update(shopOrders)
    .set({ ...patch, state: to, updatedAt: new Date() })
    .where(and(eq(shopOrders.id, orderId), inArray(shopOrders.state, from)))
    .returning();
  if (!updated) throw new ShopError("state_mismatch", 409);
  return updated;
}

export async function createOrResumeOrder(opts: { buyerId: number; buyerRole: string; listingId: string }) {
  if (opts.buyerRole === "owner") throw new ShopError("owner_cannot_buy", 403);

  const [listing] = await db.select().from(shopListings).where(eq(shopListings.id, opts.listingId)).limit(1);
  if (!listing || !listing.published) throw new ShopError("listing_unavailable", 404);
  if (listing.amount <= 0) throw new ShopError("invalid_amount", 400);

  const [payout] = await db.select().from(shopPayoutDestinations).where(eq(shopPayoutDestinations.id, 1)).limit(1);
  if (!payout?.accountHandle) throw new ShopError("payout_not_configured", 409);

  const [entitled] = await db
    .select({ id: shopEntitlements.id })
    .from(shopEntitlements)
    .where(and(eq(shopEntitlements.accountId, opts.buyerId), eq(shopEntitlements.listingId, listing.id)))
    .limit(1);
  if (entitled) throw new ShopError("already_entitled", 409);

  const open = await db
    .select()
    .from(shopOrders)
    .where(
      and(
        eq(shopOrders.buyerId, opts.buyerId),
        eq(shopOrders.listingId, listing.id),
        inArray(shopOrders.state, OPEN_ORDER_STATES)
      )
    )
    .limit(1);
  if (open[0]) return open[0];

  const [created] = await db
    .insert(shopOrders)
    .values({
      id: newCanonicalId("ORD"),
      buyerId: opts.buyerId,
      listingId: listing.id,
      amount: listing.amount,
      currency: listing.currency,
      state: "awaiting_payment_reference",
      payoutHandleSnapshot: payout.accountHandle,
      payoutAliasSnapshot: payout.accountAlias,
    })
    .returning();
  return created;
}

export async function submitReference(opts: { orderId: string; buyerId: string | number; reference: string }) {
  const order = await loadOrder(opts.orderId);
  if (order.buyerId !== Number(opts.buyerId)) throw new ShopError("forbidden", 403);
  const reference = opts.reference.trim();
  if (reference.length < 4 || reference.length > 128) throw new ShopError("invalid_reference", 400);
  return setState(
    order.id,
    ["awaiting_payment_reference", "declined"],
    "awaiting_confirmation",
    { paymentReference: reference, declineReason: null }
  );
}

export async function abandonOrder(opts: { orderId: string; buyerId: number }) {
  const order = await loadOrder(opts.orderId);
  if (order.buyerId !== opts.buyerId) throw new ShopError("forbidden", 403);
  return setState(order.id, ["awaiting_payment_reference", "declined"], "cancelled", {});
}

export async function confirmReceipt(opts: { orderId: string }) {
  const order = await loadOrder(opts.orderId);
  if (order.state === "settled") return order;
  const updated = await setState(order.id, ["awaiting_confirmation"], "settled", {
    settledAt: new Date(),
  });
  await db
    .insert(shopEntitlements)
    .values({
      accountId: updated.buyerId,
      listingId: updated.listingId,
      orderId: updated.id,
    })
    .onConflictDoNothing();
  return updated;
}

export async function declineReceipt(opts: { orderId: string; reason?: string }) {
  return setState(opts.orderId, ["awaiting_confirmation"], "declined", {
    declineReason: opts.reason?.trim() || null,
  });
}
