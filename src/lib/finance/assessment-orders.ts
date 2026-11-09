import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  accounts,
  analyzerAttempts,
  analyzerPacks,
  assessmentEntitlements,
  assessmentOrders,
  assessmentTariffs,
  discountCodes,
  discountRedemptions,
} from "@/db/schema";
import {
  assessmentProductId,
  assertCreatorCoupon,
  isAssessmentService,
  quoteAssessmentSale,
  type AssessmentService,
} from "@/lib/commerce/assessment-policy";
import { redeemDiscount } from "@/lib/commerce/discount";
import { attemptKindOf } from "@/lib/analyzers/document-templates";
import { executionPaymentModeOf, type ExecutionPaymentMode } from "@/lib/analyzers/pack";
import { ensureAssessmentLedgerSchema } from "@/lib/auth/schema-guard";
import { newCanonicalId } from "@/lib/knowledge/ids";
import {
  buildCaptureJournal,
  buildCreatorSponsorshipJournal,
  buildDeliveryJournal,
  buildPayoutJournal,
  refundCaptureJournal,
  type AccountKind,
} from "./journal";
import { LedgerError, ledgerBalance, loadPostedJournal, postJournal } from "./ledger";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type OrderRow = typeof assessmentOrders.$inferSelect;
type TariffRow = typeof assessmentTariffs.$inferSelect;

export type AssessmentDiscountNotice = {
  requestedPercent: number;
  allowedPercent: number;
  overCapPercent: number;
  overCapIrr: string;
};

export function assessmentDiscountNotice(order: OrderRow): AssessmentDiscountNotice | null {
  if (!order.discountCode || order.discountPercent == null || order.discountCapPercent == null) return null;
  const overCapPercent = Math.max(0, order.discountPercent - order.discountCapPercent);
  const overCapIrr = order.discountOverCapIrr ?? order.discountIrr;
  if (overCapPercent <= 0 || overCapIrr <= BigInt(0)) return null;
  return {
    requestedPercent: order.discountPercent,
    allowedPercent: order.discountCapPercent,
    overCapPercent,
    overCapIrr: String(overCapIrr),
  };
}

export class AssessmentError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: Record<string, string>,
  ) {
    super(message);
  }
}

const OPEN_STATES = ["awaiting_payment_reference", "awaiting_confirmation", "captured"] as const;

function asRounding(value: string | null): "floor" | "ceil" | undefined {
  if (value === "floor" || value === "ceil") return value;
  return undefined;
}

export async function listAssessmentTariffs(slug: string): Promise<TariffRow[]> {
  await ensureAssessmentLedgerSchema();
  return db
    .select()
    .from(assessmentTariffs)
    .where(eq(assessmentTariffs.analyzerSlug, slug))
    .orderBy(assessmentTariffs.service, desc(assessmentTariffs.version));
}

export async function activeAssessmentTariff(
  slug: string,
  service: AssessmentService,
  executor: Pick<typeof db, "select"> = db,
): Promise<TariffRow | null> {
  if (executor === db) {
    try {
      await ensureAssessmentLedgerSchema();
    } catch {
      return null;
    }
  }
  const [row] = await executor
    .select()
    .from(assessmentTariffs)
    .where(and(eq(assessmentTariffs.analyzerSlug, slug), eq(assessmentTariffs.service, service), eq(assessmentTariffs.active, true)))
    .limit(1);
  if (!row) return null;
  if (row.commissionBps == null || row.priceIrr <= BigInt(0)) return null;
  return row;
}

async function requireLedgerSchema() {
  await ensureAssessmentLedgerSchema();
}

export async function hasAssessmentEntitlement(
  accountId: number,
  attemptKind: string,
  attemptId: number,
  service: AssessmentService,
): Promise<boolean> {
  try {
    await ensureAssessmentLedgerSchema();
  } catch {
    return false;
  }
  const [row] = await db
    .select({ id: assessmentEntitlements.id })
    .from(assessmentEntitlements)
    .where(
      and(
        eq(assessmentEntitlements.accountId, accountId),
        eq(assessmentEntitlements.attemptKind, attemptKind),
        eq(assessmentEntitlements.attemptId, attemptId),
        eq(assessmentEntitlements.service, service),
      ),
    )
    .limit(1);
  return Boolean(row);
}

export async function assessmentExecutionOffer(input: {
  slug: string;
  accountId: number;
  attemptId: number | null;
  paymentMode: ExecutionPaymentMode;
}): Promise<{ available: boolean; priceIrr: string | null; entitled: boolean; paymentMode: ExecutionPaymentMode }> {
  const [tariff, entitled] = await Promise.all([
    activeAssessmentTariff(input.slug, "execution"),
    input.attemptId == null
      ? Promise.resolve(false)
      : hasAssessmentEntitlement(input.accountId, "analyzer", input.attemptId, "execution"),
  ]);
  return {
    available: Boolean(tariff) || entitled,
    priceIrr: tariff ? String(tariff.priceIrr) : null,
    entitled,
    paymentMode: input.paymentMode,
  };
}

async function actor(tx: Tx, id: number, owner = false) {
  const [row] = await tx
    .select({ id: accounts.id, role: accounts.role })
    .from(accounts)
    .where(and(eq(accounts.id, id), eq(accounts.isActive, true)))
    .limit(1)
    .for("update");
  if (!row || (owner && row.role !== "owner")) throw new AssessmentError("forbidden", 403);
  return row;
}

async function quoteFromTariff(tariff: TariffRow, discountIRR: bigint) {
  if (tariff.commissionBps == null) throw new AssessmentError("tariff_undefined", 409);
  try {
    return quoteAssessmentSale({
      priceIRR: tariff.priceIrr,
      discountIRR,
      commissionBasisPoints: tariff.commissionBps,
      creatorDiscountCapPercent: tariff.creatorDiscountCapPercent,
      rounding: asRounding(tariff.rounding),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "invalid_tariff";
    throw new AssessmentError(["invalid_commission", "invalid_discount_cap"].includes(message) ? "tariff_undefined" : message, 409);
  }
}

async function creatorAvailable(tx: Tx, creatorId: number) {
  return ledgerBalance(tx, "creator_available", creatorId);
}

function bookFromBalances(balances: Record<AccountKind, bigint>) {
  return balances;
}

async function creatorBook(tx: Tx, creatorId: number): Promise<Record<AccountKind, bigint>> {
  const kinds: AccountKind[] = [
    "bank",
    "creator_receivable",
    "buyer_wallet",
    "creator_pending",
    "creator_available",
    "platform_deferred",
    "platform_revenue",
    "opening_equity",
  ];
  const out = {} as Record<AccountKind, bigint>;
  for (const kind of kinds) {
    const party = kind.startsWith("creator_") ? creatorId : null;
    out[kind] = await ledgerBalance(tx, kind, party);
  }
  return out;
}

export async function upsertAssessmentTariff(input: {
  actorId: number;
  actorRole: string;
  slug: string;
  service: string;
  priceIRR?: bigint;
  commissionBps?: number | null;
  rounding?: "floor" | "ceil" | null;
  creatorDiscountCapPercent?: number;
  activate?: boolean;
}) {
  if (!isAssessmentService(input.service)) throw new AssessmentError("invalid_service", 400);
  await ensureAssessmentLedgerSchema();
  return db.transaction(async (tx) => {
    const who = await actor(tx, input.actorId, false);
    const [pack] = await tx
      .select({ createdBy: analyzerPacks.createdBy })
      .from(analyzerPacks)
      .where(eq(analyzerPacks.slug, input.slug))
      .limit(1);
    if (!pack) throw new AssessmentError("not_found", 404);
    const creatorId = pack.createdBy ?? (who.role === "owner" ? who.id : 0);
    if (!creatorId) throw new AssessmentError("forbidden", 403);
    const isCreator = who.id === creatorId;
    const isOwner = who.role === "owner";
    if (!isCreator && !isOwner) throw new AssessmentError("forbidden", 403);
    if (input.priceIRR != null && !isCreator && !isOwner) throw new AssessmentError("forbidden", 403);
    if ((input.commissionBps !== undefined || input.creatorDiscountCapPercent !== undefined || input.activate) && !isOwner) {
      throw new AssessmentError("forbidden", 403);
    }

    const [current] = await tx
      .select()
      .from(assessmentTariffs)
      .where(
        and(
          eq(assessmentTariffs.analyzerSlug, input.slug),
          eq(assessmentTariffs.service, input.service),
        ),
      )
      .orderBy(desc(assessmentTariffs.version))
      .limit(1);

    const priceIRR = input.priceIRR ?? current?.priceIrr;
    if (typeof priceIRR !== "bigint" || priceIRR <= BigInt(0)) throw new AssessmentError("invalid_price", 400);
    const commissionBps = input.commissionBps === undefined ? current?.commissionBps ?? null : input.commissionBps;
    const rounding = input.rounding === undefined ? current?.rounding ?? null : input.rounding;
    const creatorDiscountCapPercent =
      input.creatorDiscountCapPercent === undefined ? current?.creatorDiscountCapPercent ?? 0 : input.creatorDiscountCapPercent;
    if (commissionBps != null && (!Number.isInteger(commissionBps) || commissionBps < 0 || commissionBps > 10000)) {
      throw new AssessmentError("invalid_commission", 400);
    }
    if (rounding != null && rounding !== "floor" && rounding !== "ceil") throw new AssessmentError("invalid_rounding", 400);
    if (
      !Number.isInteger(creatorDiscountCapPercent) ||
      creatorDiscountCapPercent < 0 ||
      creatorDiscountCapPercent > 100 ||
      (commissionBps != null && creatorDiscountCapPercent > Math.floor((10000 - commissionBps) / 100))
    ) {
      throw new AssessmentError("invalid_discount_cap", 400);
    }
    if (commissionBps != null) {
      try {
        quoteAssessmentSale({
          priceIRR,
          discountIRR: BigInt(0),
          commissionBasisPoints: commissionBps,
          creatorDiscountCapPercent,
          rounding: asRounding(rounding),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "invalid_tariff";
        throw new AssessmentError(message, 400);
      }
    }

    const complete = commissionBps != null;
    const activate = Boolean(input.activate) && complete;
    if (input.activate && !complete) throw new AssessmentError("tariff_undefined", 409);

    const version = (current?.version ?? 0) + 1;
    const id = `TRF-${input.slug}-${input.service}-v${version}`;
    if (activate) {
      await tx
        .update(assessmentTariffs)
        .set({ active: false, updatedAt: new Date() })
        .where(and(eq(assessmentTariffs.analyzerSlug, input.slug), eq(assessmentTariffs.service, input.service)));
    }
    const [row] = await tx
      .insert(assessmentTariffs)
      .values({
        id,
        analyzerSlug: input.slug,
        service: input.service,
        creatorId,
        priceIrr: priceIRR,
        commissionBps,
        rounding,
        creatorDiscountCapPercent,
        version,
        active: activate,
      })
      .returning();
    return row;
  });
}

async function quoteDiscountIRR(
  tx: Tx,
  input: {
    code: unknown;
    priceIRR: bigint;
    slug: string;
    service: AssessmentService;
    creatorId: number;
  },
): Promise<{ discountIRR: bigint; discountPercent: number; discountId: number | null; discountCode: string | null }> {
  if (input.code == null || input.code === "") {
    return { discountIRR: BigInt(0), discountPercent: 0, discountId: null, discountCode: null };
  }
  if (typeof input.code !== "string") throw new AssessmentError("invalid_discount", 400);
  const code = input.code.trim().toUpperCase();
  if (!/^[A-Z0-9_-]{3,32}$/.test(code) || /^\d{8}$/.test(code)) throw new AssessmentError("invalid_discount", 400);
  const [row] = await tx.select().from(discountCodes).where(eq(discountCodes.code, code)).limit(1).for("update");
  const now = new Date();
  if (!row || !row.active || (row.startsAt && row.startsAt > now) || (row.endsAt && row.endsAt < now)) {
    throw new AssessmentError("unknown_discount", 400);
  }
  if (row.maxUses != null && row.usedCount >= row.maxUses) throw new AssessmentError("discount_exhausted", 400);
  if (
    (row.scope !== "any" && row.scope !== "analyzer") ||
    (row.scope === "analyzer" && row.analyzerSlug && row.analyzerSlug !== input.slug)
  ) {
    throw new AssessmentError("discount_scope", 400);
  }
  if (!row.productId || row.issuerAccountId == null) throw new AssessmentError("coupon_product_mismatch", 400);
  try {
    assertCreatorCoupon({
      productId: assessmentProductId(input.slug, input.service),
      productCreatorId: input.creatorId,
      couponProductId: row.productId,
      couponIssuerId: row.issuerAccountId,
    });
  } catch (error) {
    throw new AssessmentError(error instanceof Error ? error.message : "coupon_product_mismatch", 400);
  }
  if (row.kind !== "percent") throw new AssessmentError("unsupported_discount", 400);
  const pct = Math.min(100, Math.max(0, row.value));
  const discountIRR = (input.priceIRR * BigInt(pct)) / BigInt(100);
  return { discountIRR, discountPercent: pct, discountId: row.id, discountCode: row.code };
}

export async function createAssessmentOrder(input: {
  buyerId: number;
  buyerRole: string;
  slug: string;
  attemptId: number;
  service: string;
  discountCode?: unknown;
}) {
  if (input.buyerRole === "owner") throw new AssessmentError("owner_cannot_buy", 403);
  if (!isAssessmentService(input.service)) throw new AssessmentError("invalid_service", 400);
  if (!Number.isInteger(input.attemptId) || input.attemptId <= 0) throw new AssessmentError("invalid_attempt", 400);
  const service: AssessmentService = input.service;
  const attemptKind = attemptKindOf(input.slug);
  await ensureAssessmentLedgerSchema();
  return db.transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext('hadiran:assessment'), hashtext(${`${input.buyerId}:${attemptKind}:${input.attemptId}:${service}`}))`,
    );
    const who = await actor(tx, input.buyerId);
    if (who.role === "owner") throw new AssessmentError("owner_cannot_buy", 403);
    const [attempt] = await tx
      .select({ status: analyzerAttempts.status, executionPaymentMode: analyzerAttempts.executionPaymentMode })
      .from(analyzerAttempts)
      .where(
        and(
          eq(analyzerAttempts.id, input.attemptId),
          eq(analyzerAttempts.accountId, who.id),
          eq(analyzerAttempts.slug, input.slug),
        ),
      )
      .limit(1)
      .for("share");
    if (!attempt) throw new AssessmentError("invalid_attempt", 404);
    const paymentMode = executionPaymentModeOf(attempt.executionPaymentMode);
    if (
      service === "execution"
        ? paymentMode === "before_start"
          ? attempt.status !== "in_progress"
          : !["in_progress", "submitted"].includes(attempt.status)
        : attempt.status !== "submitted"
    ) {
      throw new AssessmentError("assessment_not_ready", 409);
    }
    const [entitled] = await tx
      .select({ id: assessmentEntitlements.id })
      .from(assessmentEntitlements)
      .where(
        and(
          eq(assessmentEntitlements.accountId, who.id),
          eq(assessmentEntitlements.attemptKind, attemptKind),
          eq(assessmentEntitlements.attemptId, input.attemptId),
          eq(assessmentEntitlements.service, service),
        ),
      )
      .limit(1);
    if (entitled) throw new AssessmentError("already_entitled", 409);
    const [open] = await tx
      .select()
      .from(assessmentOrders)
      .where(
        and(
          eq(assessmentOrders.buyerId, who.id),
          eq(assessmentOrders.attemptKind, attemptKind),
          eq(assessmentOrders.attemptId, input.attemptId),
          eq(assessmentOrders.service, service),
          inArray(assessmentOrders.state, [...OPEN_STATES]),
        ),
      )
      .limit(1);
    if (open) return open;
    const tariff = await activeAssessmentTariff(input.slug, service, tx);
    if (!tariff) throw new AssessmentError("tariff_undefined", 409);

    const discount = await quoteDiscountIRR(tx, {
      code: input.discountCode,
      priceIRR: tariff.priceIrr,
      slug: input.slug,
      service,
      creatorId: tariff.creatorId,
    });
    const quote = await quoteFromTariff(tariff, discount.discountIRR);
    const zeroPay = quote.payableIRR === BigInt(0);
    const [created] = await tx
      .insert(assessmentOrders)
      .values({
        id: newCanonicalId("AST"),
        buyerId: who.id,
        creatorId: tariff.creatorId,
        analyzerSlug: input.slug,
        attemptKind,
        attemptId: input.attemptId,
        service,
        tariffId: tariff.id,
        tariffVersion: tariff.version,
        priceIrr: quote.priceIRR,
        discountIrr: quote.discountIRR,
        discountPercent: discount.discountPercent,
        discountCapPercent: quote.discountCapPercent,
        discountOverCapIrr: quote.creatorDiscountDebitIRR,
        payableIrr: quote.payableIRR,
        platformFeeIrr: quote.platformFeeIRR,
        authorCreditIrr: quote.authorCreditIRR,
        authorNetIrr: quote.authorNetIRR,
        commissionBps: quote.commissionBasisPoints,
        rounding: quote.rounding === "exact" ? null : quote.rounding,
        currency: "IRR",
        state: zeroPay ? "captured" : "awaiting_payment_reference",
        discountCode: discount.discountCode,
        discountId: discount.discountId,
        fundingSource: "buyer",
        sponsorshipAmountIrr: BigInt(0),
        capturedAt: zeroPay ? new Date() : null,
      })
      .returning();
    if (discount.discountId && discount.discountCode) {
      const redeemed = await redeemDiscount(
        {
          quote: {
            id: discount.discountId,
            code: discount.discountCode,
            kind: "percent",
            value: 0,
            amountOff: 0,
            payable: 0,
          },
          accountId: who.id,
          source: "shop",
          orderId: created.id,
        },
        tx,
      );
      if (!redeemed) throw new AssessmentError("discount_exhausted", 400);
    }
    if (zeroPay) {
      await capturePosted(tx, created);
    }
    return created;
  }).then((created) => autoDeliverIfReady(created));
}

export async function quoteDocumentSponsorship(input: {
  slug: string;
  attemptId: number;
  actorId: number;
  executor?: Pick<typeof db, "select">;
}): Promise<{ required: false } | { required: true; tariffId: string; amountIrr: string }> {
  const executor = input.executor ?? db;
  if (executor === db) await requireLedgerSchema();
  const attemptKind = attemptKindOf(input.slug);
  const [attempt] = await executor
    .select({ accountId: analyzerAttempts.accountId, status: analyzerAttempts.status })
    .from(analyzerAttempts)
    .where(and(eq(analyzerAttempts.id, input.attemptId), eq(analyzerAttempts.slug, input.slug)))
    .limit(1);
  if (!attempt) throw new AssessmentError("invalid_attempt", 404);
  if (attempt.status !== "submitted") throw new AssessmentError("assessment_not_ready", 409);
  const [entitlement] = await executor
    .select({ id: assessmentEntitlements.id })
    .from(assessmentEntitlements)
    .where(
      and(
        eq(assessmentEntitlements.accountId, attempt.accountId),
        eq(assessmentEntitlements.attemptKind, attemptKind),
        eq(assessmentEntitlements.attemptId, input.attemptId),
        eq(assessmentEntitlements.service, "document"),
      ),
    )
    .limit(1);
  if (entitlement) return { required: false };
  const [paidOrder] = await executor
    .select({ id: assessmentOrders.id })
    .from(assessmentOrders)
    .where(
      and(
        eq(assessmentOrders.buyerId, attempt.accountId),
        eq(assessmentOrders.attemptKind, attemptKind),
        eq(assessmentOrders.attemptId, input.attemptId),
        eq(assessmentOrders.service, "document"),
        inArray(assessmentOrders.state, ["captured", "delivered"]),
      ),
    )
    .limit(1);
  if (paidOrder) return { required: false };
  const tariff = await activeAssessmentTariff(input.slug, "document", executor);
  if (!tariff) throw new AssessmentError("tariff_undefined", 409);
  if (input.actorId !== tariff.creatorId) throw new AssessmentError("sponsorship_forbidden", 403);
  return { required: true, tariffId: tariff.id, amountIrr: String(tariff.priceIrr) };
}

export async function sponsorDocumentForAssessmentInTransaction(
  tx: Tx,
  input: {
    slug: string;
    attemptId: number;
    actorId: number;
    confirmedTariffId: string;
  },
): Promise<{ sponsored: boolean; orderId: string | null }> {
  const attemptKind = attemptKindOf(input.slug);
  const [candidate] = await tx
    .select({ accountId: analyzerAttempts.accountId })
    .from(analyzerAttempts)
    .where(and(eq(analyzerAttempts.id, input.attemptId), eq(analyzerAttempts.slug, input.slug)))
    .limit(1);
  if (!candidate) throw new AssessmentError("invalid_attempt", 404);
  await tx.execute(
    sql`select pg_advisory_xact_lock(hashtext('hadiran:assessment'), hashtext(${`${candidate.accountId}:${attemptKind}:${input.attemptId}:document`}))`,
  );

  const who = await actor(tx, input.actorId);
  const [attempt] = await tx
    .select({ accountId: analyzerAttempts.accountId, status: analyzerAttempts.status })
    .from(analyzerAttempts)
    .where(and(eq(analyzerAttempts.id, input.attemptId), eq(analyzerAttempts.slug, input.slug)))
    .limit(1)
    .for("share");
  if (!attempt || attempt.accountId !== candidate.accountId) throw new AssessmentError("invalid_attempt", 404);
  if (attempt.status !== "submitted") throw new AssessmentError("assessment_not_ready", 409);

  const [entitlement] = await tx
    .select({ orderId: assessmentEntitlements.orderId })
    .from(assessmentEntitlements)
    .where(
      and(
        eq(assessmentEntitlements.accountId, attempt.accountId),
        eq(assessmentEntitlements.attemptKind, attemptKind),
        eq(assessmentEntitlements.attemptId, input.attemptId),
        eq(assessmentEntitlements.service, "document"),
      ),
    )
    .limit(1);
  if (entitlement) {
    const [existing] = await tx
      .select({ fundingSource: assessmentOrders.fundingSource })
      .from(assessmentOrders)
      .where(eq(assessmentOrders.id, entitlement.orderId))
      .limit(1);
    return { sponsored: existing?.fundingSource === "creator_sponsorship", orderId: entitlement.orderId };
  }

  const existingOrders = await tx
    .select()
    .from(assessmentOrders)
    .where(
      and(
        eq(assessmentOrders.buyerId, attempt.accountId),
        eq(assessmentOrders.attemptKind, attemptKind),
        eq(assessmentOrders.attemptId, input.attemptId),
        eq(assessmentOrders.service, "document"),
        inArray(assessmentOrders.state, [
          "awaiting_payment_reference",
          "awaiting_confirmation",
          "captured",
          "delivered",
          "declined",
        ]),
      ),
    )
    .orderBy(desc(assessmentOrders.createdAt))
    .for("update");
  const paidOrder = existingOrders.find((order) => order.state === "captured" || order.state === "delivered");
  if (paidOrder) return { sponsored: false, orderId: paidOrder.id };

  const tariff = await activeAssessmentTariff(input.slug, "document", tx);
  if (!tariff) throw new AssessmentError("tariff_undefined", 409);
  if (tariff.id !== input.confirmedTariffId) {
    throw new AssessmentError("sponsorship_quote_changed", 409, {
      tariffId: tariff.id,
      amountIrr: String(tariff.priceIrr),
    });
  }
  const [pack] = await tx
    .select({ createdBy: analyzerPacks.createdBy })
    .from(analyzerPacks)
    .where(eq(analyzerPacks.slug, input.slug))
    .limit(1)
    .for("share");
  if (!pack || (pack.createdBy != null && pack.createdBy !== tariff.creatorId) || who.id !== tariff.creatorId) {
    throw new AssessmentError("sponsorship_forbidden", 403);
  }

  const pending = existingOrders.filter((order) =>
    ["awaiting_payment_reference", "awaiting_confirmation", "declined"].includes(order.state),
  );
  for (const order of pending) {
    await tx
      .update(assessmentOrders)
      .set({ state: "superseded", updatedAt: new Date() })
      .where(and(eq(assessmentOrders.id, order.id), eq(assessmentOrders.state, order.state)));
    if (order.discountId) {
      const released = await tx
        .delete(discountRedemptions)
        .where(eq(discountRedemptions.orderId, order.id))
        .returning({ id: discountRedemptions.id });
      if (released.length) {
        await tx.execute(sql`
          update discount_codes
          set used_count = greatest(used_count - ${released.length}, 0), updated_at = now()
          where id = ${order.discountId}
        `);
      }
    }
  }

  const orderId = newCanonicalId("AST");
  const [sponsorship] = await tx
    .insert(assessmentOrders)
    .values({
      id: orderId,
      buyerId: attempt.accountId,
      creatorId: tariff.creatorId,
      analyzerSlug: input.slug,
      attemptKind,
      attemptId: input.attemptId,
      service: "document",
      tariffId: tariff.id,
      tariffVersion: tariff.version,
      priceIrr: tariff.priceIrr,
      discountIrr: BigInt(0),
      discountPercent: 0,
      discountCapPercent: tariff.creatorDiscountCapPercent,
      discountOverCapIrr: BigInt(0),
      payableIrr: BigInt(0),
      platformFeeIrr: BigInt(0),
      authorCreditIrr: BigInt(0),
      authorNetIrr: BigInt(0),
      commissionBps: tariff.commissionBps ?? 0,
      rounding: tariff.rounding,
      currency: "IRR",
      state: "sponsored",
      fundingSource: "creator_sponsorship",
      sponsorId: who.id,
      sponsorshipAmountIrr: tariff.priceIrr,
      deliveredAt: new Date(),
    })
    .returning();
  if (!sponsorship) throw new AssessmentError("sponsorship_failed", 500);

  try {
    await postJournal(
      tx,
      buildCreatorSponsorshipJournal(orderId, tariff.priceIrr),
      { creatorId: who.id, buyerId: attempt.accountId },
      "assessment_sponsorship",
    );
  } catch (error) {
    if (error instanceof LedgerError && error.message === "negative_creator_available") {
      throw new AssessmentError("creator_credit_insufficient", 409);
    }
    if (error instanceof LedgerError) throw new AssessmentError(error.message, error.status);
    throw error;
  }

  await tx
    .insert(assessmentEntitlements)
    .values({
      accountId: attempt.accountId,
      attemptKind,
      attemptId: input.attemptId,
      service: "document",
      orderId,
    })
    .onConflictDoNothing();
  return { sponsored: true, orderId };
}

export async function sponsorDocumentForAssessment(input: {
  slug: string;
  attemptId: number;
  actorId: number;
  confirmedTariffId: string;
}): Promise<{ sponsored: boolean; orderId: string | null }> {
  await requireLedgerSchema();
  return db.transaction((tx) => sponsorDocumentForAssessmentInTransaction(tx, input));
}

async function autoDeliverIfReady(order: OrderRow) {
  if (order.state !== "captured") return order;
  try {
    if (order.service === "execution" || order.service === "interpretation") {
      return await deliverAssessmentOrder({ orderId: order.id });
    }
    if (order.service === "document") {
      const { readStoredInterpretation } = await import("@/lib/analyzers/persist-report");
      const stored = await readStoredInterpretation(order.attemptKind, order.attemptId);
      if (stored) return await deliverAssessmentOrder({ orderId: order.id });
    }
  } catch (error) {
    console.error("[hadiran] assessment auto-deliver", error);
  }
  return order;
}

async function capturePosted(tx: Tx, order: OrderRow) {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext('hadiran:ledger'), hashtext(${`creator:${order.creatorId}`}))`);
  const available = await creatorAvailable(tx, order.creatorId);
  const creatorDiscountDebitIRR = order.discountOverCapIrr ?? order.discountIrr;
  if (creatorDiscountDebitIRR < BigInt(0) || creatorDiscountDebitIRR > order.discountIrr) {
    throw new AssessmentError("invalid_order_quote", 500);
  }
  const creatorDiscountAllowanceIRR = order.discountIrr - creatorDiscountDebitIRR;
  const quote = {
    currency: "IRR" as const,
    priceIRR: order.priceIrr,
    discountIRR: order.discountIrr,
    discountCapPercent: order.discountCapPercent ?? 0,
    creatorDiscountAllowanceIRR,
    creatorDiscountDebitIRR,
    commissionBasisPoints: order.commissionBps,
    feeNumerator: order.priceIrr * BigInt(order.commissionBps),
    feeDenominator: BigInt(10000),
    rounding: (asRounding(order.rounding) ?? "exact") as "floor" | "ceil" | "exact",
    payableIRR: order.payableIrr,
    platformFeeIRR: order.platformFeeIrr,
    authorCreditBeforeDiscountIRR: order.authorCreditIrr + creatorDiscountAllowanceIRR,
    authorCreditIRR: order.authorCreditIrr,
    authorNetIRR: order.authorNetIrr,
  };
  const journal = buildCaptureJournal({
    sourceRef: order.id,
    quote,
    creatorAvailableIRR: available,
    cashAccount: "bank",
    description: "وصول خدمت آزمون؛ درآمد در انتظار تحویل",
  });
  try {
    await postJournal(tx, journal, { creatorId: order.creatorId, buyerId: order.buyerId }, "assessment_order");
  } catch (error) {
    if (error instanceof LedgerError) throw new AssessmentError(error.message, error.status);
    throw error;
  }
}

export async function submitAssessmentReference(opts: { orderId: string; buyerId: number; reference: string }) {
  await requireLedgerSchema();
  const reference = opts.reference.trim();
  if (reference.length < 4 || reference.length > 128) throw new AssessmentError("invalid_reference", 400);
  return db.transaction(async (tx) => {
    const [order] = await tx.select().from(assessmentOrders).where(eq(assessmentOrders.id, opts.orderId)).limit(1).for("update");
    if (!order) throw new AssessmentError("not_found", 404);
    const who = await actor(tx, opts.buyerId);
    if (order.buyerId !== who.id) throw new AssessmentError("forbidden", 403);
    if (order.state === "awaiting_confirmation" && order.paymentReference === reference) return order;
    if (!["awaiting_payment_reference", "declined"].includes(order.state)) throw new AssessmentError("state_mismatch", 409);
    const [updated] = await tx
      .update(assessmentOrders)
      .set({ state: "awaiting_confirmation", paymentReference: reference, updatedAt: new Date() })
      .where(and(eq(assessmentOrders.id, order.id), eq(assessmentOrders.state, order.state)))
      .returning();
    if (!updated) throw new AssessmentError("state_mismatch", 409);
    return updated;
  });
}

export async function confirmAssessmentReceipt(opts: { orderId: string; actorId: number }) {
  await requireLedgerSchema();
  return db.transaction(async (tx) => {
    const who = await actor(tx, opts.actorId, true);
    const [order] = await tx.select().from(assessmentOrders).where(eq(assessmentOrders.id, opts.orderId)).limit(1).for("update");
    if (!order) throw new AssessmentError("not_found", 404);
    if (order.state === "captured" || order.state === "delivered") return order;
    if (order.state !== "awaiting_confirmation") throw new AssessmentError("state_mismatch", 409);
    const [updated] = await tx
      .update(assessmentOrders)
      .set({ state: "captured", capturedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(assessmentOrders.id, order.id), eq(assessmentOrders.state, order.state)))
      .returning();
    if (!updated) throw new AssessmentError("state_mismatch", 409);
    await capturePosted(tx, updated);
    void who;
    return updated;
  }).then((order) => autoDeliverIfReady(order));
}

export async function deliverAssessmentOrder(opts: { orderId: string; actorId?: number }) {
  await requireLedgerSchema();
  return db.transaction(async (tx) => {
    const [order] = await tx.select().from(assessmentOrders).where(eq(assessmentOrders.id, opts.orderId)).limit(1).for("update");
    if (!order) throw new AssessmentError("not_found", 404);
    if (order.state === "delivered") return order;
    if (order.state !== "captured") throw new AssessmentError("state_mismatch", 409);
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext('hadiran:ledger'), hashtext(${`creator:${order.creatorId}`}))`);
    const balances = await creatorBook(tx, order.creatorId);
    try {
      await postJournal(
        tx,
        buildDeliveryJournal(order.id, bookFromBalances(balances)),
        { creatorId: order.creatorId, buyerId: order.buyerId },
        "assessment_order",
      );
    } catch (error) {
      if (error instanceof LedgerError) throw new AssessmentError(error.message, error.status);
      throw error;
    }
    await tx.insert(assessmentEntitlements).values({
      accountId: order.buyerId,
      attemptKind: order.attemptKind,
      attemptId: order.attemptId,
      service: order.service,
      orderId: order.id,
    }).onConflictDoNothing();
    const [updated] = await tx
      .update(assessmentOrders)
      .set({ state: "delivered", deliveredAt: new Date(), updatedAt: new Date() })
      .where(and(eq(assessmentOrders.id, order.id), eq(assessmentOrders.state, "captured")))
      .returning();
    if (!updated) throw new AssessmentError("state_mismatch", 409);
    return updated;
  });
}

export async function refundAssessmentOrder(opts: { orderId: string; actorId: number }) {
  await requireLedgerSchema();
  return db.transaction(async (tx) => {
    await actor(tx, opts.actorId, true);
    const [order] = await tx.select().from(assessmentOrders).where(eq(assessmentOrders.id, opts.orderId)).limit(1).for("update");
    if (!order) throw new AssessmentError("not_found", 404);
    if (order.state === "refunded") return order;
    if (order.state === "delivered") throw new AssessmentError("already_delivered", 409);
    if (order.state !== "captured") throw new AssessmentError("state_mismatch", 409);
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext('hadiran:ledger'), hashtext(${`creator:${order.creatorId}`}))`);
    const capture = await loadPostedJournal(tx, `${order.id}:capture`);
    if (!capture) throw new AssessmentError("missing_prerequisite_event", 409);
    try {
      await postJournal(
        tx,
        refundCaptureJournal(capture),
        { creatorId: order.creatorId, buyerId: order.buyerId },
        "assessment_order",
      );
    } catch (error) {
      if (error instanceof LedgerError) throw new AssessmentError(error.message, error.status);
      throw error;
    }
    if (order.discountId) {
      await tx.execute(sql`update discount_codes set used_count = greatest(used_count - 1, 0), updated_at = now() where id = ${order.discountId}`);
    }
    const [updated] = await tx
      .update(assessmentOrders)
      .set({ state: "refunded", refundedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(assessmentOrders.id, order.id), eq(assessmentOrders.state, "captured")))
      .returning();
    if (!updated) throw new AssessmentError("state_mismatch", 409);
    return updated;
  });
}

export async function requestCreatorPayout(opts: { actorId: number; creatorId: number; amountIRR: bigint; sourceRef: string }) {
  if (typeof opts.amountIRR !== "bigint" || opts.amountIRR <= BigInt(0)) throw new AssessmentError("invalid_amount", 400);
  await requireLedgerSchema();
  return db.transaction(async (tx) => {
    await actor(tx, opts.actorId, true);
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext('hadiran:ledger'), hashtext(${`creator:${opts.creatorId}`}))`);
    const available = await creatorAvailable(tx, opts.creatorId);
    const bank = await ledgerBalance(tx, "bank", null);
    if (opts.amountIRR > available) throw new AssessmentError("payout_exceeds_available", 409);
    if (opts.amountIRR > bank) throw new AssessmentError("payout_exceeds_model_cash", 409);
    try {
      await postJournal(
        tx,
        buildPayoutJournal(opts.sourceRef, opts.amountIRR),
        { creatorId: opts.creatorId },
        "creator_payout",
      );
    } catch (error) {
      if (error instanceof LedgerError) throw new AssessmentError(error.message, error.status);
      throw error;
    }
    return { ok: true as const, availableIRR: available - opts.amountIRR };
  });
}

export async function tryDeliverCapturedDocument(opts: {
  attemptKind: string;
  attemptId: number;
  accountId: number;
}) {
  try {
    await requireLedgerSchema();
    const [order] = await db
      .select()
      .from(assessmentOrders)
      .where(
        and(
          eq(assessmentOrders.buyerId, opts.accountId),
          eq(assessmentOrders.attemptKind, opts.attemptKind),
          eq(assessmentOrders.attemptId, opts.attemptId),
          eq(assessmentOrders.service, "document"),
          eq(assessmentOrders.state, "captured"),
        ),
      )
      .limit(1);
    if (!order) return null;
    return await deliverAssessmentOrder({ orderId: order.id });
  } catch {
    return null;
  }
}
