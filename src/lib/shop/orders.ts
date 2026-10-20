import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { accounts, shopEntitlements, shopListings, shopOrderEvents, shopOrders, shopPayoutDestinations } from "@/db/schema";
import { newCanonicalId } from "@/lib/knowledge/ids";
import { ensureAccessSchema } from "@/lib/auth/schema-guard";
import { quoteDiscount, redeemDiscount, type DiscountQuote } from "@/lib/commerce/discount";
import { OPEN_ORDER_STATES, type OrderState } from "./states";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Order = typeof shopOrders.$inferSelect;

export class ShopError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function actor(tx: Tx, id: number, owner = false) {
  const [row] = await tx
    .select({ id: accounts.id, role: accounts.role })
    .from(accounts)
    .where(and(eq(accounts.id, id), eq(accounts.isActive, true)))
    .limit(1)
    .for("share");
  if (!row || (owner && row.role !== "owner")) throw new ShopError("forbidden", 403);
  return row;
}

async function event(
  tx: Tx,
  who: { id: number; role: string },
  order: Order,
  kind: string,
  fromState: string | null,
) {
  await tx.insert(shopOrderEvents).values({
    orderId: order.id,
    actorId: who.id,
    actorRole: who.role,
    kind,
    fromState,
    toState: order.state,
  });
}

async function update(
  tx: Tx,
  order: Order,
  to: OrderState,
  patch: Partial<typeof shopOrders.$inferInsert> = {},
) {
  const [updated] = await tx
    .update(shopOrders)
    .set({ ...patch, state: to, updatedAt: new Date() })
    .where(and(eq(shopOrders.id, order.id), eq(shopOrders.state, order.state)))
    .returning();
  if (!updated) throw new ShopError("state_mismatch", 409);
  return updated;
}

async function locked<T>(
  orderId: string,
  actorId: number,
  owner: boolean,
  work: (tx: Tx, order: Order, who: { id: number; role: string }) => Promise<T>,
) {
  return db.transaction(async (tx) => {
    const [order] = await tx.select().from(shopOrders).where(eq(shopOrders.id, orderId)).limit(1).for("update");
    if (!order) throw new ShopError("not_found", 404);
    const who = await actor(tx, actorId, owner);
    if (!owner && order.buyerId !== who.id) throw new ShopError("forbidden", 403);
    return work(tx, order, who);
  });
}

export async function createOrResumeOrder(opts: {
  buyerId: number;
  buyerRole: string;
  listingId: string;
  discountCode?: unknown;
}) {
  if (opts.buyerRole === "owner") throw new ShopError("owner_cannot_buy", 403);
  await ensureAccessSchema();
  return db.transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext('hadiran:shop'), hashtext(${`${opts.buyerId}:${opts.listingId}`}))`,
    );
    const who = await actor(tx, opts.buyerId);
    if (who.role === "owner") throw new ShopError("owner_cannot_buy", 403);
    const [listing] = await tx
      .select()
      .from(shopListings)
      .where(eq(shopListings.id, opts.listingId))
      .limit(1)
      .for("share");
    if (!listing?.published) throw new ShopError("listing_unavailable", 404);
    if (listing.amount <= 0) throw new ShopError("invalid_amount", 400);
    const [payout] = await tx.select().from(shopPayoutDestinations).where(eq(shopPayoutDestinations.id, 1)).limit(1);
    if (!payout?.accountHandle) throw new ShopError("payout_not_configured", 409);
    const [entitled] = await tx
      .select({ id: shopEntitlements.id })
      .from(shopEntitlements)
      .where(and(eq(shopEntitlements.accountId, who.id), eq(shopEntitlements.listingId, listing.id)))
      .limit(1);
    if (entitled) throw new ShopError("already_entitled", 409);
    const [open] = await tx
      .select()
      .from(shopOrders)
      .where(
        and(
          eq(shopOrders.buyerId, who.id),
          eq(shopOrders.listingId, listing.id),
          inArray(shopOrders.state, OPEN_ORDER_STATES),
        ),
      )
      .limit(1);
    if (open) return open;

    let amount = listing.amount;
    let discountAmount = 0;
    let discountCode: string | null = null;
    let quote: DiscountQuote | null = null;
    if (opts.discountCode != null && opts.discountCode !== "") {
      const quoted = await quoteDiscount(
        { code: opts.discountCode, amount: listing.amount, scope: "shop", listingId: listing.id },
        tx,
      );
      if (!quoted.ok) throw new ShopError(quoted.error, 400);
      if (!("skipped" in quoted)) {
        quote = quoted.quote;
        amount = quote.payable;
        discountAmount = quote.amountOff;
        discountCode = quote.code;
      }
    }

    const [created] = await tx
      .insert(shopOrders)
      .values({
        id: newCanonicalId("ORD"),
        buyerId: who.id,
        listingId: listing.id,
        amount,
        currency: listing.currency,
        state: "awaiting_payment_reference",
        payoutHandleSnapshot: payout.accountHandle,
        payoutAliasSnapshot: payout.accountAlias,
        discountCode,
        discountAmount,
        originalAmount: listing.amount,
      })
      .returning();
    if (quote && !(await redeemDiscount({ quote, accountId: who.id, source: "shop", orderId: created.id }, tx))) {
      throw new ShopError("discount_exhausted", 400);
    }
    await event(tx, who, created, "created", null);
    return created;
  });
}

export async function submitReference(opts: { orderId: string; buyerId: string | number; reference: string }) {
  const reference = opts.reference.trim();
  if (reference.length < 4 || reference.length > 128) throw new ShopError("invalid_reference", 400);
  return locked(opts.orderId, Number(opts.buyerId), false, async (tx, order, who) => {
    if (order.state === "awaiting_confirmation" && order.paymentReference === reference) return order;
    if (!["awaiting_payment_reference", "declined"].includes(order.state)) throw new ShopError("state_mismatch", 409);
    const result = await update(tx, order, "awaiting_confirmation", {
      paymentReference: reference,
      declineReason: null,
    });
    await event(tx, who, result, "reference_submitted", order.state);
    return result;
  });
}

export async function abandonOrder(opts: { orderId: string; buyerId: number }) {
  return locked(opts.orderId, opts.buyerId, false, async (tx, order, who) => {
    if (order.state === "cancelled") return order;
    if (!["awaiting_payment_reference", "declined"].includes(order.state)) throw new ShopError("state_mismatch", 409);
    const result = await update(tx, order, "cancelled");
    await event(tx, who, result, "cancelled", order.state);
    return result;
  });
}

export async function confirmReceipt(opts: { orderId: string; actorId: number }) {
  return locked(opts.orderId, opts.actorId, true, async (tx, order, who) => {
    if (!["awaiting_confirmation", "settled"].includes(order.state)) throw new ShopError("state_mismatch", 409);
    const result = order.state === "settled" ? order : await update(tx, order, "settled", { settledAt: new Date() });
    const granted = await tx
      .insert(shopEntitlements)
      .values({
        accountId: result.buyerId,
        listingId: result.listingId,
        orderId: result.id,
      })
      .onConflictDoNothing()
      .returning({ id: shopEntitlements.id });
    if (order.state !== "settled") await event(tx, who, result, "receipt_confirmed", order.state);
    else if (granted.length) await event(tx, who, result, "access_repaired", order.state);
    return result;
  });
}

export async function declineReceipt(opts: { orderId: string; actorId: number; reason?: string }) {
  const reason = opts.reason?.trim() || null;
  if (reason && reason.length > 2000) throw new ShopError("invalid_reason", 400);
  return locked(opts.orderId, opts.actorId, true, async (tx, order, who) => {
    if (order.state === "declined" && order.declineReason === reason) return order;
    if (order.state !== "awaiting_confirmation") throw new ShopError("state_mismatch", 409);
    const result = await update(tx, order, "declined", { declineReason: reason });
    await event(tx, who, result, "receipt_declined", order.state);
    return result;
  });
}
