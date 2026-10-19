import { eq } from "drizzle-orm";
import { db } from "@/db";
import { accounts } from "@/db/schema";
import { accountIdByPublicCode, normalizePublicCode, publicCodeByAccountId } from "./public-code";
import { ensureAccountProfileSchema } from "./schema-guard";

export type ReferralResult =
  | { ok: true; referrerAccountId: number; publicCode: string; unchanged?: boolean }
  | { ok: false; error: string };

async function wouldCycle(refereeId: number, referrerId: number): Promise<boolean> {
  let current: number | null = referrerId;
  for (let i = 0; i < 32; i += 1) {
    if (current == null) return false;
    if (current === refereeId) return true;
    const [row] = await db
      .select({ referredByAccountId: accounts.referredByAccountId })
      .from(accounts)
      .where(eq(accounts.id, current))
      .limit(1);
    current = row?.referredByAccountId ?? null;
  }
  return true;
}

export async function resolveReferralCode(
  raw: unknown,
): Promise<{ accountId: number; publicCode: string } | { error: string } | null> {
  if (raw == null || raw === "") return null;
  const code = normalizePublicCode(raw);
  if (!code) return { error: "invalid_referral" };
  const accountId = await accountIdByPublicCode(code);
  if (!accountId) return { error: "unknown_referral" };
  return { accountId, publicCode: code };
}

export async function setAccountReferrer(accountId: number, rawCode: unknown): Promise<ReferralResult | { ok: true; skipped: true }> {
  const resolved = await resolveReferralCode(rawCode);
  if (resolved == null) return { ok: true, skipped: true };
  if ("error" in resolved) return { ok: false, error: resolved.error };
  if (resolved.accountId === accountId) return { ok: false, error: "self_referral" };
  await ensureAccountProfileSchema();
  const [row] = await db
    .select({ referredByAccountId: accounts.referredByAccountId })
    .from(accounts)
    .where(eq(accounts.id, accountId))
    .limit(1);
  if (!row) return { ok: false, error: "account_missing" };
  if (row.referredByAccountId) {
    const publicCode = (await publicCodeByAccountId(row.referredByAccountId)) ?? resolved.publicCode;
    return { ok: true, referrerAccountId: row.referredByAccountId, publicCode, unchanged: true };
  }
  if (await wouldCycle(accountId, resolved.accountId)) return { ok: false, error: "referral_cycle" };
  await db
    .update(accounts)
    .set({ referredByAccountId: resolved.accountId, updatedAt: new Date() })
    .where(eq(accounts.id, accountId));
  return { ok: true, referrerAccountId: resolved.accountId, publicCode: resolved.publicCode };
}

export async function referredByPublicCode(accountId: number): Promise<string | null> {
  await ensureAccountProfileSchema();
  const [row] = await db
    .select({ referredByAccountId: accounts.referredByAccountId })
    .from(accounts)
    .where(eq(accounts.id, accountId))
    .limit(1);
  if (!row?.referredByAccountId) return null;
  return publicCodeByAccountId(row.referredByAccountId);
}

/** Owner desk: set or clear a referrer even if one is already stored. */
export async function ownerSetAccountReferrer(
  accountId: number,
  rawCode: unknown,
): Promise<{ ok: true; publicCode: string | null } | { ok: false; error: string }> {
  await ensureAccountProfileSchema();
  if (rawCode == null || rawCode === "") {
    await db
      .update(accounts)
      .set({ referredByAccountId: null, updatedAt: new Date() })
      .where(eq(accounts.id, accountId));
    return { ok: true, publicCode: null };
  }
  const resolved = await resolveReferralCode(rawCode);
  if (resolved == null) {
    await db
      .update(accounts)
      .set({ referredByAccountId: null, updatedAt: new Date() })
      .where(eq(accounts.id, accountId));
    return { ok: true, publicCode: null };
  }
  if ("error" in resolved) return { ok: false, error: resolved.error };
  if (resolved.accountId === accountId) return { ok: false, error: "self_referral" };
  if (await wouldCycle(accountId, resolved.accountId)) return { ok: false, error: "referral_cycle" };
  await db
    .update(accounts)
    .set({ referredByAccountId: resolved.accountId, updatedAt: new Date() })
    .where(eq(accounts.id, accountId));
  return { ok: true, publicCode: resolved.publicCode };
}
