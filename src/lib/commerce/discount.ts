import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { discountCodes, discountRedemptions } from "@/db/schema";
import { ensureAccessSchema } from "@/lib/auth/schema-guard";

export type DiscountQuote = {
  id: number;
  code: string;
  kind: "percent" | "amount";
  value: number;
  amountOff: number;
  payable: number;
};

function normalizeDiscountCode(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const code = input.trim().toUpperCase();
  if (!/^[A-Z0-9_-]{3,32}$/.test(code)) return null;
  if (/^\d{8}$/.test(code)) return null;
  return code;
}

function inWindow(row: { startsAt: Date | null; endsAt: Date | null; active: boolean }): boolean {
  if (!row.active) return false;
  const now = Date.now();
  if (row.startsAt && row.startsAt.getTime() > now) return false;
  if (row.endsAt && row.endsAt.getTime() < now) return false;
  return true;
}

function amountOff(kind: string, value: number, listingAmount: number): number {
  if (kind === "percent") {
    const pct = Math.min(100, Math.max(0, value));
    return Math.min(listingAmount, Math.floor((listingAmount * pct) / 100));
  }
  return Math.min(listingAmount, Math.max(0, value));
}

export async function quoteDiscount(input: {
  code: unknown;
  amount: number;
  scope: "analyzer" | "shop";
  analyzerSlug?: string;
  listingId?: string;
}): Promise<{ ok: true; quote: DiscountQuote } | { ok: false; error: string } | { ok: true; skipped: true }> {
  if (input.code == null || input.code === "") return { ok: true, skipped: true };
  const code = normalizeDiscountCode(input.code);
  if (!code) return { ok: false, error: "invalid_discount" };
  await ensureAccessSchema();
  const [row] = await db.select().from(discountCodes).where(eq(discountCodes.code, code)).limit(1);
  if (!row || !inWindow(row)) return { ok: false, error: "unknown_discount" };
  if (row.maxUses != null && row.usedCount >= row.maxUses) return { ok: false, error: "discount_exhausted" };
  if (row.scope === "analyzer" && input.scope !== "analyzer") return { ok: false, error: "discount_scope" };
  if (row.scope === "shop" && input.scope !== "shop") return { ok: false, error: "discount_scope" };
  if (row.scope === "analyzer" && row.analyzerSlug && row.analyzerSlug !== input.analyzerSlug) {
    return { ok: false, error: "discount_scope" };
  }
  if (row.scope === "shop" && row.listingId && row.listingId !== input.listingId) {
    return { ok: false, error: "discount_scope" };
  }
  const off = input.scope === "shop" ? amountOff(row.kind, row.value, input.amount) : 0;
  return {
    ok: true,
    quote: {
      id: row.id,
      code: row.code,
      kind: row.kind === "amount" ? "amount" : "percent",
      value: row.value,
      amountOff: off,
      payable: Math.max(0, input.amount - off),
    },
  };
}

export async function redeemDiscount(input: {
  quote: DiscountQuote;
  accountId: number;
  source: "analyzer" | "shop";
  analyzerSlug?: string;
  orderId?: string;
}): Promise<boolean> {
  await ensureAccessSchema();
  const [updated] = await db
    .update(discountCodes)
    .set({
      usedCount: sql`${discountCodes.usedCount} + 1`,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(discountCodes.id, input.quote.id),
        sql`(${discountCodes.maxUses} IS NULL OR ${discountCodes.usedCount} < ${discountCodes.maxUses})`,
      ),
    )
    .returning({ id: discountCodes.id });
  if (!updated) return false;
  await db.insert(discountRedemptions).values({
    discountId: input.quote.id,
    accountId: input.accountId,
    source: input.source,
    analyzerSlug: input.analyzerSlug ?? null,
    orderId: input.orderId ?? null,
  });
  return true;
}
