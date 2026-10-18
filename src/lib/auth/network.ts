import { eq } from "drizzle-orm";
import { db } from "@/db";
import { accountPublicCodes, accounts, analyzerAttempts, casioAttempts } from "@/db/schema";
import { ensureAccessSchema } from "./schema-guard";
import { roleFa, type AccountRole } from "./roles";

export type NetworkNode = {
  publicCode: string;
  nameFa: string;
  roleFa: string;
  children: NetworkNode[];
};

function nameOf(row: { givenName: string | null; familyName: string | null; displayName: string | null }) {
  const joined = [row.givenName, row.familyName].filter(Boolean).join(" ").trim();
  if (joined) return joined;
  if (row.displayName?.trim()) return row.displayName.trim();
  return "بدون نام";
}

export async function loadReferralTree(): Promise<NetworkNode[]> {
  await ensureAccessSchema();
  const rows = await db
    .select({
      id: accounts.id,
      referredByAccountId: accounts.referredByAccountId,
      role: accounts.role,
      givenName: accounts.givenName,
      familyName: accounts.familyName,
      displayName: accounts.displayName,
      publicCode: accountPublicCodes.code,
    })
    .from(accounts)
    .leftJoin(accountPublicCodes, eq(accountPublicCodes.accountId, accounts.id))
    .where(eq(accounts.isActive, true));

  const byId = new Map<number, NetworkNode & { id: number; parent: number | null }>();
  for (const row of rows) {
    if (!row.publicCode) continue;
    byId.set(row.id, {
      id: row.id,
      parent: row.referredByAccountId,
      publicCode: row.publicCode,
      nameFa: nameOf(row),
      roleFa: roleFa(row.role as AccountRole),
      children: [],
    });
  }
  const roots: NetworkNode[] = [];
  for (const node of byId.values()) {
    const parent = node.parent ? byId.get(node.parent) : null;
    const publicNode = {
      publicCode: node.publicCode,
      nameFa: node.nameFa,
      roleFa: node.roleFa,
      children: node.children,
    };
    if (parent) parent.children.push(publicNode);
    else roots.push(publicNode);
  }
  return roots;
}

export async function listMyReferrals(accountId: number): Promise<{
  accounts: { publicCode: string; nameFa: string; roleFa: string }[];
  attempts: { publicCode: string; nameFa: string; slug: string }[];
}> {
  await ensureAccessSchema();
  const people = await db
    .select({
      givenName: accounts.givenName,
      familyName: accounts.familyName,
      displayName: accounts.displayName,
      role: accounts.role,
      publicCode: accountPublicCodes.code,
    })
    .from(accounts)
    .leftJoin(accountPublicCodes, eq(accountPublicCodes.accountId, accounts.id))
    .where(eq(accounts.referredByAccountId, accountId));

  const casio = await db
    .select({
      givenName: accounts.givenName,
      familyName: accounts.familyName,
      displayName: accounts.displayName,
      publicCode: accountPublicCodes.code,
    })
    .from(casioAttempts)
    .innerJoin(accounts, eq(accounts.id, casioAttempts.accountId))
    .leftJoin(accountPublicCodes, eq(accountPublicCodes.accountId, accounts.id))
    .where(eq(casioAttempts.referrerAccountId, accountId));

  const generic = await db
    .select({
      givenName: accounts.givenName,
      familyName: accounts.familyName,
      displayName: accounts.displayName,
      publicCode: accountPublicCodes.code,
      slug: analyzerAttempts.slug,
    })
    .from(analyzerAttempts)
    .innerJoin(accounts, eq(accounts.id, analyzerAttempts.accountId))
    .leftJoin(accountPublicCodes, eq(accountPublicCodes.accountId, accounts.id))
    .where(eq(analyzerAttempts.referrerAccountId, accountId));

  return {
    accounts: people
      .filter((row) => row.publicCode)
      .map((row) => ({
        publicCode: row.publicCode as string,
        nameFa: nameOf(row),
        roleFa: roleFa(row.role as AccountRole),
      })),
    attempts: [
      ...casio.filter((row) => row.publicCode).map((row) => ({
        publicCode: row.publicCode as string,
        nameFa: nameOf(row),
        slug: "casio-ss",
      })),
      ...generic.filter((row) => row.publicCode).map((row) => ({
        publicCode: row.publicCode as string,
        nameFa: nameOf(row),
        slug: row.slug,
      })),
    ],
  };
}
