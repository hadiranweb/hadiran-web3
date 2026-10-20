"use strict";

const assert = require("node:assert/strict");
const { test } = require("node:test");

class ShopError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

const OPEN = new Set(["awaiting_payment_reference", "awaiting_confirmation", "declined"]);

function createLockMap() {
  const tails = new Map();
  return {
    async acquire(key) {
      let release;
      const next = new Promise((resolve) => {
        release = resolve;
      });
      const prev = tails.get(key) || Promise.resolve();
      tails.set(key, prev.then(() => next, () => next));
      await prev.catch(() => {});
      return release;
    },
  };
}

function createMemoryShop(opts = {}) {
  const fail = opts.fail || {};
  const locks = createLockMap();
  let seq = 1;
  const state = {
    accounts: new Map([
      [1, { id: 1, role: "owner", isActive: true }],
      [2, { id: 2, role: "member", isActive: true }],
      [3, { id: 3, role: "member", isActive: true }],
    ]),
    listings: new Map([
      ["p1", { id: "p1", published: true, amount: 100001, currency: "IRR" }],
      ["p2", { id: "p2", published: true, amount: 50000, currency: "IRR" }],
    ]),
    orders: new Map(),
    entitlements: new Map(),
    events: [],
    discounts: new Map([
      ["CAP1", { id: 1, code: "CAP1", kind: "amount", value: 1, maxUses: 1, usedCount: 0, active: true }],
    ]),
    redemptions: [],
  };

  function entKey(accountId, listingId) {
    return `${accountId}:${listingId}`;
  }

  async function transaction(work) {
    const undo = [];
    const held = [];
    const tx = {
      async advisoryLock(key) {
        held.push(await locks.acquire(`adv:${key}`));
      },
      async lockOrder(id) {
        held.push(await locks.acquire(`order:${id}`));
        return state.orders.get(id) || null;
      },
      actor(id, owner = false) {
        const row = state.accounts.get(id);
        if (!row || !row.isActive || (owner && row.role !== "owner")) throw new ShopError("forbidden", 403);
        return row;
      },
      listing(id) {
        return state.listings.get(id);
      },
      insertOrder(row) {
        state.orders.set(row.id, row);
        undo.push(() => state.orders.delete(row.id));
        return row;
      },
      updateOrder(order, to, patch = {}) {
        const current = state.orders.get(order.id);
        if (!current || current.state !== order.state) throw new ShopError("state_mismatch", 409);
        const prev = { ...current };
        const next = { ...current, ...patch, state: to };
        state.orders.set(order.id, next);
        undo.push(() => state.orders.set(order.id, prev));
        return next;
      },
      openOrder(buyerId, listingId) {
        return [...state.orders.values()].find(
          (row) => row.buyerId === buyerId && row.listingId === listingId && OPEN.has(row.state),
        );
      },
      entitled(accountId, listingId) {
        return state.entitlements.get(entKey(accountId, listingId));
      },
      grant(order) {
        if (fail.entitlement && fail.entitlement(order)) throw new Error("injected entitlement failure");
        const key = entKey(order.buyerId, order.listingId);
        if (state.entitlements.has(key)) return false;
        state.entitlements.set(key, { orderId: order.id, accountId: order.buyerId, listingId: order.listingId });
        undo.push(() => state.entitlements.delete(key));
        return true;
      },
      event(who, order, kind, fromState) {
        if (fail.event && fail.event(order, kind)) throw new Error("injected event failure");
        const row = { orderId: order.id, actorId: who.id, actorRole: who.role, kind, fromState, toState: order.state };
        state.events.push(row);
        undo.push(() => {
          const i = state.events.indexOf(row);
          if (i >= 0) state.events.splice(i, 1);
        });
      },
      async quote(code) {
        const normalized = String(code).toUpperCase();
        held.push(await locks.acquire(`discount:${normalized}`));
        const row = state.discounts.get(normalized);
        if (!row || !row.active) throw new ShopError("unknown_discount", 400);
        if (row.maxUses != null && row.usedCount >= row.maxUses) throw new ShopError("discount_exhausted", 400);
        return { id: row.id, code: row.code, amountOff: row.value, payable: Math.max(0, 100001 - row.value) };
      },
      redeem(quote, accountId, orderId) {
        const row = [...state.discounts.values()].find((item) => item.id === quote.id);
        if (!row || (row.maxUses != null && row.usedCount >= row.maxUses)) return false;
        const prev = row.usedCount;
        row.usedCount += 1;
        const redemption = { discountId: row.id, accountId, orderId };
        state.redemptions.push(redemption);
        undo.push(() => {
          row.usedCount = prev;
          const i = state.redemptions.indexOf(redemption);
          if (i >= 0) state.redemptions.splice(i, 1);
        });
        return true;
      },
    };

    try {
      return await work(tx);
    } catch (error) {
      while (undo.length) undo.pop()();
      throw error;
    } finally {
      while (held.length) held.pop()();
    }
  }

  async function createOrResumeOrder(opts) {
    if (opts.buyerRole === "owner") throw new ShopError("owner_cannot_buy", 403);
    return transaction(async (tx) => {
      await tx.advisoryLock(`${opts.buyerId}:${opts.listingId}`);
      const who = tx.actor(opts.buyerId);
      if (who.role === "owner") throw new ShopError("owner_cannot_buy", 403);
      const listing = tx.listing(opts.listingId);
      if (!listing?.published) throw new ShopError("listing_unavailable", 404);
      if (tx.entitled(who.id, listing.id)) throw new ShopError("already_entitled", 409);
      const open = tx.openOrder(who.id, listing.id);
      if (open) return open;
      let amount = listing.amount;
      let discountAmount = 0;
      let discountCode = null;
      let quote = null;
      if (opts.discountCode) {
        quote = await tx.quote(opts.discountCode);
        amount = quote.payable;
        discountAmount = quote.amountOff;
        discountCode = quote.code;
      }
      const created = tx.insertOrder({
        id: `ORD-${seq++}`,
        buyerId: who.id,
        listingId: listing.id,
        amount,
        discountAmount,
        discountCode,
        originalAmount: listing.amount,
        state: "awaiting_payment_reference",
        paymentReference: null,
        declineReason: null,
        settledAt: null,
      });
      if (quote && !tx.redeem(quote, who.id, created.id)) throw new ShopError("discount_exhausted", 400);
      tx.event(who, created, "created", null);
      return created;
    });
  }

  async function submitReference(opts) {
    const reference = opts.reference.trim();
    return transaction(async (tx) => {
      const order = await tx.lockOrder(opts.orderId);
      if (!order) throw new ShopError("not_found", 404);
      const who = tx.actor(opts.buyerId);
      if (order.buyerId !== who.id) throw new ShopError("forbidden", 403);
      if (order.state === "awaiting_confirmation" && order.paymentReference === reference) return order;
      if (!["awaiting_payment_reference", "declined"].includes(order.state)) throw new ShopError("state_mismatch", 409);
      const result = tx.updateOrder(order, "awaiting_confirmation", { paymentReference: reference, declineReason: null });
      tx.event(who, result, "reference_submitted", order.state);
      return result;
    });
  }

  async function confirmReceipt(opts) {
    return transaction(async (tx) => {
      const order = await tx.lockOrder(opts.orderId);
      if (!order) throw new ShopError("not_found", 404);
      const who = tx.actor(opts.actorId, true);
      if (!["awaiting_confirmation", "settled"].includes(order.state)) throw new ShopError("state_mismatch", 409);
      const result = order.state === "settled" ? order : tx.updateOrder(order, "settled", { settledAt: new Date() });
      const granted = tx.grant(result);
      if (order.state !== "settled") tx.event(who, result, "receipt_confirmed", order.state);
      else if (granted) tx.event(who, result, "access_repaired", order.state);
      return result;
    });
  }

  async function declineReceipt(opts) {
    return transaction(async (tx) => {
      const order = await tx.lockOrder(opts.orderId);
      if (!order) throw new ShopError("not_found", 404);
      const who = tx.actor(opts.actorId, true);
      if (order.state === "declined" && order.declineReason === (opts.reason || null)) return order;
      if (order.state !== "awaiting_confirmation") throw new ShopError("state_mismatch", 409);
      const result = tx.updateOrder(order, "declined", { declineReason: opts.reason || null });
      tx.event(who, result, "receipt_declined", order.state);
      return result;
    });
  }

  return { state, createOrResumeOrder, submitReference, confirmReceipt, declineReceipt };
}

test("concurrent create retries share one order", async () => {
  const shop = createMemoryShop();
  const rows = await Promise.all(
    Array.from({ length: 8 }, () => shop.createOrResumeOrder({ buyerId: 2, buyerRole: "member", listingId: "p1" })),
  );
  assert.equal(new Set(rows.map((row) => row.id)).size, 1);
  assert.equal([...shop.state.orders.values()].filter((row) => row.listingId === "p1").length, 1);
  assert.equal(shop.state.events.filter((row) => row.kind === "created").length, 1);
});

test("injected entitlement failure rolls back settlement; retry grants access", async () => {
  let once = true;
  const shop = createMemoryShop({
    fail: {
      entitlement: () => {
        if (!once) return false;
        once = false;
        return true;
      },
    },
  });
  shop.state.orders.set("live", {
    id: "live",
    buyerId: 2,
    listingId: "p1",
    state: "awaiting_confirmation",
    paymentReference: "REF-1",
    declineReason: null,
    settledAt: null,
  });
  await assert.rejects(() => shop.confirmReceipt({ orderId: "live", actorId: 1 }));
  assert.equal(shop.state.orders.get("live").state, "awaiting_confirmation");
  assert.equal(shop.state.entitlements.size, 0);
  assert.equal(shop.state.events.length, 0);
  const retry = await shop.confirmReceipt({ orderId: "live", actorId: 1 });
  assert.equal(retry.state, "settled");
  assert.equal(shop.state.entitlements.size, 1);
  assert.equal(shop.state.events.filter((row) => row.kind === "receipt_confirmed").length, 1);
});

test("injected audit failure rolls back with the grant; retry succeeds", async () => {
  let once = true;
  const shop = createMemoryShop({
    fail: {
      event: (_order, kind) => {
        if (kind !== "receipt_confirmed" || !once) return false;
        once = false;
        return true;
      },
    },
  });
  shop.state.orders.set("evt", {
    id: "evt",
    buyerId: 3,
    listingId: "p1",
    state: "awaiting_confirmation",
    paymentReference: "REF-2",
    declineReason: null,
    settledAt: null,
  });
  await assert.rejects(() => shop.confirmReceipt({ orderId: "evt", actorId: 1 }));
  assert.equal(shop.state.orders.get("evt").state, "awaiting_confirmation");
  assert.equal(shop.state.entitlements.size, 0);
  await shop.confirmReceipt({ orderId: "evt", actorId: 1 });
  assert.equal(shop.state.orders.get("evt").state, "settled");
});

test("settled order with missing access is repaired once", async () => {
  const shop = createMemoryShop();
  shop.state.orders.set("gap", {
    id: "gap",
    buyerId: 2,
    listingId: "p2",
    state: "settled",
    paymentReference: "REF-3",
    declineReason: null,
    settledAt: new Date("2026-03-21T00:00:00Z"),
  });
  await shop.confirmReceipt({ orderId: "gap", actorId: 1 });
  await shop.confirmReceipt({ orderId: "gap", actorId: 1 });
  assert.equal(shop.state.entitlements.size, 1);
  assert.equal(shop.state.events.filter((row) => row.kind === "access_repaired").length, 1);
  assert.equal(shop.state.events.filter((row) => row.kind === "receipt_confirmed").length, 0);
});

test("discount capacity cannot leave an orphan order", async () => {
  const shop = createMemoryShop();
  const results = await Promise.allSettled([
    shop.createOrResumeOrder({ buyerId: 2, buyerRole: "member", listingId: "p1", discountCode: "CAP1" }),
    shop.createOrResumeOrder({ buyerId: 3, buyerRole: "member", listingId: "p1", discountCode: "CAP1" }),
  ]);
  const ok = results.filter((row) => row.status === "fulfilled");
  const failed = results.filter((row) => row.status === "rejected");
  assert.equal(ok.length, 1);
  assert.equal(failed.length, 1);
  assert.equal(shop.state.orders.size, 1);
  assert.equal(shop.state.discounts.get("CAP1").usedCount, 1);
  assert.equal(shop.state.redemptions.length, 1);
});

test("create event failure rolls back order and unused discount", async () => {
  const shop = createMemoryShop({
    fail: { event: (_order, kind) => kind === "created" },
  });
  await assert.rejects(() =>
    shop.createOrResumeOrder({ buyerId: 2, buyerRole: "member", listingId: "p2", discountCode: "CAP1" }),
  );
  assert.equal(shop.state.orders.size, 0);
  assert.equal(shop.state.discounts.get("CAP1").usedCount, 0);
  assert.equal(shop.state.redemptions.length, 0);
});

test("confirm and decline serialize: only one transition wins", async () => {
  const shop = createMemoryShop();
  const created = await shop.createOrResumeOrder({ buyerId: 2, buyerRole: "member", listingId: "p1" });
  await shop.submitReference({ orderId: created.id, buyerId: 2, reference: "STATE-RACE" });
  const statuses = await Promise.allSettled([
    shop.confirmReceipt({ orderId: created.id, actorId: 1 }),
    shop.declineReceipt({ orderId: created.id, actorId: 1 }),
  ]);
  const fulfilled = statuses.filter((row) => row.status === "fulfilled");
  const rejected = statuses.filter((row) => row.status === "rejected");
  assert.equal(fulfilled.length, 1);
  assert.equal(rejected.length, 1);
  assert.equal(rejected[0].reason.status, 409);
  const finalState = shop.state.orders.get(created.id).state;
  assert.ok(finalState === "settled" || finalState === "declined");
  if (finalState === "settled") assert.equal(shop.state.entitlements.size, 1);
  else assert.equal(shop.state.entitlements.size, 0);
});

test("session actor is recorded, not a request-body actorId", async () => {
  const shop = createMemoryShop();
  const created = await shop.createOrResumeOrder({ buyerId: 2, buyerRole: "member", listingId: "p1" });
  await shop.submitReference({ orderId: created.id, buyerId: 2, reference: "ACTOR-REF" });
  await shop.confirmReceipt({ orderId: created.id, actorId: 1 });
  const row = shop.state.events.find((item) => item.kind === "receipt_confirmed");
  assert.equal(row.actorId, 1);
  assert.notEqual(row.actorId, 2);
});
