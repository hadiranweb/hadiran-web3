import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { accounts, analyzerGrants, analyzerPacks } from "@/db/schema";
import { ensureAccessSchema } from "@/lib/auth/schema-guard";
import type { AccountRole } from "@/lib/auth/roles";
import { isOwner, isStaff } from "@/lib/auth/roles";
import { accountIdByPublicCode } from "@/lib/auth/public-code";
import type { AnalyzerPack } from "@/lib/analyzers/pack";
import { RESERVED_SLUGS } from "@/lib/analyzers/sanitize";
import { listAuthoredPacks } from "@/lib/analyzers/authored";

export type AnalyzerAccess = {
  view: boolean;
  edit: boolean;
  responses: boolean;
  grant: boolean;
};

export async function analyzerAccess(
  account: { id: number; role: AccountRole | string },
  slug: string,
): Promise<AnalyzerAccess> {
  const none = { view: false, edit: false, responses: false, grant: false };
  if (!slug || RESERVED_SLUGS.has(slug)) return none;
  await ensureAccessSchema();
  if (isOwner(account.role)) {
    return { view: true, edit: true, responses: true, grant: true };
  }
  const [pack] = await db
    .select({ createdBy: analyzerPacks.createdBy })
    .from(analyzerPacks)
    .where(eq(analyzerPacks.slug, slug))
    .limit(1);
  if (!pack) return none;
  if (pack.createdBy === account.id) {
    return { view: true, edit: true, responses: true, grant: true };
  }
  const [grant] = await db
    .select()
    .from(analyzerGrants)
    .where(and(eq(analyzerGrants.slug, slug), eq(analyzerGrants.accountId, account.id)))
    .limit(1);
  if (!grant) return none;
  return {
    view: true,
    edit: grant.canEdit,
    responses: grant.canReadResponses,
    grant: false,
  };
}

export async function listAccessiblePacks(account: {
  id: number;
  role: AccountRole | string;
}): Promise<{ pack: AnalyzerPack; access: AnalyzerAccess }[]> {
  await ensureAccessSchema();
  await listAuthoredPacks();
  if (isOwner(account.role)) {
    const packs = await listAuthoredPacks();
    return packs.map((pack) => ({
      pack,
      access: { view: true, edit: true, responses: true, grant: true },
    }));
  }
  const rows = await db.select().from(analyzerPacks);
  const grants = await db.select().from(analyzerGrants).where(eq(analyzerGrants.accountId, account.id));
  const grantBySlug = new Map(grants.map((row) => [row.slug, row]));
  const out: { pack: AnalyzerPack; access: AnalyzerAccess }[] = [];
  for (const row of rows) {
    if (!row.pack?.slug || RESERVED_SLUGS.has(row.pack.slug)) continue;
    const mine = row.createdBy === account.id;
    const grant = grantBySlug.get(row.slug);
    if (!mine && !grant) continue;
    out.push({
      pack: row.pack,
      access: mine
        ? { view: true, edit: true, responses: true, grant: true }
        : {
            view: true,
            edit: Boolean(grant?.canEdit),
            responses: Boolean(grant?.canReadResponses),
            grant: false,
          },
    });
  }
  return out;
}

export async function hasAnalyzerDesk(account: { id: number; role: AccountRole | string }): Promise<boolean> {
  if (isStaff(account.role)) return true;
  await ensureAccessSchema();
  const [grant] = await db
    .select({ slug: analyzerGrants.slug })
    .from(analyzerGrants)
    .where(eq(analyzerGrants.accountId, account.id))
    .limit(1);
  if (grant) return true;
  const [owned] = await db
    .select({ slug: analyzerPacks.slug })
    .from(analyzerPacks)
    .where(eq(analyzerPacks.createdBy, account.id))
    .limit(1);
  return Boolean(owned);
}

export async function grantAnalyzer(input: {
  slug: string;
  publicCode: string;
  actorId: number;
  canEdit?: boolean;
  canReadResponses?: boolean;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  await ensureAccessSchema();
  const [pack] = await db.select({ slug: analyzerPacks.slug }).from(analyzerPacks).where(eq(analyzerPacks.slug, input.slug)).limit(1);
  if (!pack) return { ok: false, error: "not_found" };
  const accountId = await accountIdByPublicCode(input.publicCode);
  if (!accountId) return { ok: false, error: "unknown_code" };
  if (accountId === input.actorId) return { ok: false, error: "self_grant" };
  const [target] = await db.select().from(accounts).where(eq(accounts.id, accountId)).limit(1);
  if (!target || !target.isActive) return { ok: false, error: "unknown_code" };
  await db
    .insert(analyzerGrants)
    .values({
      slug: input.slug,
      accountId,
      canEdit: input.canEdit === true,
      canReadResponses: input.canReadResponses !== false,
    })
    .onConflictDoUpdate({
      target: [analyzerGrants.slug, analyzerGrants.accountId],
      set: {
        canEdit: input.canEdit === true,
        canReadResponses: input.canReadResponses !== false,
      },
    });
  return { ok: true };
}

export async function revokeAnalyzerGrant(slug: string, publicCode: string): Promise<{ ok: true } | { ok: false; error: string }> {
  await ensureAccessSchema();
  const accountId = await accountIdByPublicCode(publicCode);
  if (!accountId) return { ok: false, error: "unknown_code" };
  await db
    .delete(analyzerGrants)
    .where(and(eq(analyzerGrants.slug, slug), eq(analyzerGrants.accountId, accountId)));
  return { ok: true };
}

export async function listAnalyzerGrants(slug: string): Promise<{ publicCode: string; nameFa: string; canEdit: boolean; canReadResponses: boolean }[]> {
  await ensureAccessSchema();
  const rows = await db
    .select({
      accountId: analyzerGrants.accountId,
      canEdit: analyzerGrants.canEdit,
      canReadResponses: analyzerGrants.canReadResponses,
      givenName: accounts.givenName,
      familyName: accounts.familyName,
      displayName: accounts.displayName,
    })
    .from(analyzerGrants)
    .innerJoin(accounts, eq(accounts.id, analyzerGrants.accountId))
    .where(eq(analyzerGrants.slug, slug));
  const { publicCodeByAccountId } = await import("@/lib/auth/public-code");
  const out = [];
  for (const row of rows) {
    const publicCode = (await publicCodeByAccountId(row.accountId)) ?? "";
    const nameFa =
      [row.givenName, row.familyName].filter(Boolean).join(" ").trim() || row.displayName?.trim() || "بدون نام";
    out.push({
      publicCode,
      nameFa,
      canEdit: row.canEdit,
      canReadResponses: row.canReadResponses,
    });
  }
  return out;
}
