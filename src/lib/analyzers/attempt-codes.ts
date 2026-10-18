import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { analyzerAttempts, casioAttempts } from "@/db/schema";
import { quoteDiscount, redeemDiscount } from "@/lib/commerce/discount";
import { publicCodeByAccountId } from "@/lib/auth/public-code";
import { resolveReferralCode } from "@/lib/auth/referral";
import { ensureAccessSchema } from "@/lib/auth/schema-guard";

export async function applyAttemptCodes(input: {
  slug: string;
  accountId: number;
  referralCode?: unknown;
  discountCode?: unknown;
}): Promise<{ ok: true; referrerAccountId: number | null; discountCode: string | null } | { ok: false; error: string }> {
  await ensureAccessSchema();
  let referrerAccountId: number | null = null;
  if (input.referralCode != null && input.referralCode !== "") {
    const resolved = await resolveReferralCode(input.referralCode);
    if (resolved == null) {
      // empty
    } else if ("error" in resolved) {
      return { ok: false, error: resolved.error };
    } else if (resolved.accountId === input.accountId) {
      return { ok: false, error: "self_referral" };
    } else {
      referrerAccountId = resolved.accountId;
    }
  }

  let discount: string | null = null;
  if (input.discountCode != null && input.discountCode !== "") {
    const quoted = await quoteDiscount({
      code: input.discountCode,
      amount: 0,
      scope: "analyzer",
      analyzerSlug: input.slug,
    });
    if (!quoted.ok) return { ok: false, error: quoted.error };
    if (!("skipped" in quoted)) {
      const redeemed = await redeemDiscount({
        quote: quoted.quote,
        accountId: input.accountId,
        source: "analyzer",
        analyzerSlug: input.slug,
      });
      if (!redeemed) return { ok: false, error: "discount_exhausted" };
      discount = quoted.quote.code;
    }
  }

  const patch: { referrerAccountId?: number; discountCode?: string; updatedAt: Date } = { updatedAt: new Date() };
  if (referrerAccountId != null) patch.referrerAccountId = referrerAccountId;
  if (discount) patch.discountCode = discount;

  if (input.slug === "casio-ss") {
    const [open] = await db
      .select({ referrerAccountId: casioAttempts.referrerAccountId, discountCode: casioAttempts.discountCode })
      .from(casioAttempts)
      .where(and(eq(casioAttempts.accountId, input.accountId), eq(casioAttempts.status, "in_progress")))
      .limit(1);
    if (open?.referrerAccountId) delete patch.referrerAccountId;
    if (open?.discountCode) delete patch.discountCode;
    if (patch.referrerAccountId != null || patch.discountCode) {
      await db
        .update(casioAttempts)
        .set(patch)
        .where(and(eq(casioAttempts.accountId, input.accountId), eq(casioAttempts.status, "in_progress")));
    }
    return {
      ok: true,
      referrerAccountId: patch.referrerAccountId ?? open?.referrerAccountId ?? null,
      discountCode: patch.discountCode ?? open?.discountCode ?? null,
    };
  }

  const [open] = await db
    .select({ referrerAccountId: analyzerAttempts.referrerAccountId, discountCode: analyzerAttempts.discountCode })
    .from(analyzerAttempts)
    .where(
      and(
        eq(analyzerAttempts.accountId, input.accountId),
        eq(analyzerAttempts.slug, input.slug),
        eq(analyzerAttempts.status, "in_progress"),
      ),
    )
    .limit(1);
  if (open?.referrerAccountId) delete patch.referrerAccountId;
  if (open?.discountCode) delete patch.discountCode;
  if (patch.referrerAccountId != null || patch.discountCode) {
    await db
      .update(analyzerAttempts)
      .set(patch)
      .where(
        and(
          eq(analyzerAttempts.accountId, input.accountId),
          eq(analyzerAttempts.slug, input.slug),
          eq(analyzerAttempts.status, "in_progress"),
        ),
      );
  }
  return {
    ok: true,
    referrerAccountId: patch.referrerAccountId ?? open?.referrerAccountId ?? null,
    discountCode: patch.discountCode ?? open?.discountCode ?? null,
  };
}

export async function referrerCodeOf(referrerAccountId: number | null | undefined): Promise<string | null> {
  if (!referrerAccountId) return null;
  return publicCodeByAccountId(referrerAccountId);
}
