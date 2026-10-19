import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/db";
import {
  accountPublicCodes,
  accounts,
  analyzerAttempts,
  analyzerReports,
  authEvents,
  botChatSessions,
  bots,
  casioAttempts,
  otpChallenges,
  passwordSetupTokens,
  sessions,
} from "@/db/schema";
import { assignAccountRole } from "./assign-role";
import {
  PERSON_WIPE_FIELDS,
  type PersonAttemptLink,
  type PersonDetail,
  type PersonSummary,
  type PersonWipeField,
} from "./people-types";
import { accountIdByPublicCode, ensureAccountPublicCode, normalizePublicCode } from "./public-code";
import { ownerSetAccountReferrer } from "./referral";
import { roleFa, type AccountRole } from "./roles";
import {
  ensureAccessSchema,
  ensureAccountProfileSchema,
  ensureBotsSchema,
  ensureInterpretationDocumentsSchema,
} from "./schema-guard";

export type { PersonAttemptLink, PersonDetail, PersonLink, PersonSummary, PersonWipeField } from "./people-types";
export { PERSON_WIPE_FIELDS } from "./people-types";

type ActionOk = { ok: true };
type ActionErr = { ok: false; error: string };
type ActionResult = ActionOk | ActionErr;

function asRole(value: string): AccountRole {
  if (value === "owner" || value === "author") return value;
  return "member";
}

function nameFa(row: { givenName: string | null; familyName: string | null; displayName: string | null }) {
  const joined = [row.givenName, row.familyName].filter(Boolean).join(" ").trim();
  if (joined) return joined;
  if (row.displayName?.trim()) return row.displayName.trim();
  return "بدون نام";
}

function isWipedPhone(phone: string) {
  return !/^09\d{9}$/.test(phone);
}

function displayPhone(phone: string): string | null {
  return isWipedPhone(phone) ? null : phone;
}

function placeholderPhone(accountId: number) {
  return `x${accountId}`.slice(0, 16);
}

function iso(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

function parseWipe(input: unknown): PersonWipeField[] {
  if (!Array.isArray(input)) return [];
  const allowed = new Set<string>(PERSON_WIPE_FIELDS);
  const fields = input.filter((item): item is PersonWipeField => typeof item === "string" && allowed.has(item));
  if (fields.includes("phone")) {
    for (const extra of ["telegram", "sessions", "otp"] as const) {
      if (!fields.includes(extra)) fields.push(extra);
    }
  }
  return fields;
}

async function ready() {
  await ensureAccessSchema();
  await ensureAccountProfileSchema();
  await ensureBotsSchema();
  await ensureInterpretationDocumentsSchema();
}

async function loadCodeMap(ids: number[]) {
  const map = new Map<number, string>();
  if (ids.length === 0) return map;
  const rows = await db
    .select({ accountId: accountPublicCodes.accountId, code: accountPublicCodes.code })
    .from(accountPublicCodes)
    .where(inArray(accountPublicCodes.accountId, ids));
  for (const row of rows) map.set(row.accountId, row.code);
  return map;
}

function guardMutable(target: { id: number; role: string }, actorId: number): string | null {
  if (target.id === actorId) return "cannot_change_self";
  if (target.role === "owner") return "cannot_change_owner";
  return null;
}

async function accountByPublicCode(code: string) {
  const accountId = await accountIdByPublicCode(code);
  if (!accountId) return null;
  const [row] = await db.select().from(accounts).where(eq(accounts.id, accountId)).limit(1);
  return row ?? null;
}

async function revokeAccountSessions(accountId: number) {
  await db
    .update(sessions)
    .set({ revokedAt: new Date() })
    .where(and(eq(sessions.accountId, accountId), isNull(sessions.revokedAt)));
  await db.delete(passwordSetupTokens).where(eq(passwordSetupTokens.accountId, accountId));
}

async function scrubPhoneTraces(phone: string, accountId: number) {
  if (!phone || isWipedPhone(phone)) return;
  await db.delete(otpChallenges).where(eq(otpChallenges.phone, phone));
  await db.delete(botChatSessions).where(eq(botChatSessions.pendingPhone, phone));
  await db.update(authEvents).set({ phone: null }).where(eq(authEvents.phone, phone));
  await db.update(authEvents).set({ phone: null }).where(eq(authEvents.accountId, accountId));
}

async function scrubTelegramTraces(telegramUserId: string | null) {
  if (!telegramUserId) return;
  await db.delete(botChatSessions).where(eq(botChatSessions.telegramUserId, telegramUserId));
}

export async function listPeople(): Promise<PersonSummary[]> {
  await ready();
  const rows = await db
    .select({
      id: accounts.id,
      phone: accounts.phone,
      givenName: accounts.givenName,
      familyName: accounts.familyName,
      displayName: accounts.displayName,
      role: accounts.role,
      isActive: accounts.isActive,
      referredByAccountId: accounts.referredByAccountId,
      createdAt: accounts.createdAt,
      lastLoginAt: accounts.lastLoginAt,
      publicCode: accountPublicCodes.code,
    })
    .from(accounts)
    .leftJoin(accountPublicCodes, eq(accountPublicCodes.accountId, accounts.id))
    .orderBy(desc(accounts.createdAt));

  const codeById = new Map<number, string>();
  for (const row of rows) {
    if (row.publicCode) codeById.set(row.id, row.publicCode);
  }
  for (const row of rows) {
    if (row.publicCode) continue;
    try {
      const code = await ensureAccountPublicCode(row.id);
      row.publicCode = code;
      codeById.set(row.id, code);
    } catch {
      // skip accounts that cannot receive a public code
    }
  }

  const referredCount = new Map<number, number>();
  for (const row of rows) {
    if (!row.referredByAccountId) continue;
    referredCount.set(row.referredByAccountId, (referredCount.get(row.referredByAccountId) ?? 0) + 1);
  }

  return rows
    .filter((row) => row.publicCode)
    .map((row) => {
      const role = asRole(row.role);
      return {
        publicCode: row.publicCode as string,
        nameFa: nameFa(row),
        phone: displayPhone(row.phone),
        role,
        roleFa: roleFa(role),
        isActive: row.isActive,
        referredBy: row.referredByAccountId ? (codeById.get(row.referredByAccountId) ?? null) : null,
        referredCount: referredCount.get(row.id) ?? 0,
        createdAt: iso(row.createdAt),
        lastLoginAt: iso(row.lastLoginAt),
        locked: role === "owner",
      };
    });
}

export async function loadPerson(publicCode: string): Promise<PersonDetail | null> {
  await ready();
  const code = normalizePublicCode(publicCode);
  if (!code) return null;
  const row = await accountByPublicCode(code);
  if (!row) return null;
  await ensureAccountPublicCode(row.id);

  const children = await db
    .select({
      id: accounts.id,
      givenName: accounts.givenName,
      familyName: accounts.familyName,
      displayName: accounts.displayName,
      role: accounts.role,
      publicCode: accountPublicCodes.code,
    })
    .from(accounts)
    .leftJoin(accountPublicCodes, eq(accountPublicCodes.accountId, accounts.id))
    .where(eq(accounts.referredByAccountId, row.id));

  const casioAsReferrer = await db
    .select({
      id: casioAttempts.id,
      accountId: casioAttempts.accountId,
      referrerAccountId: casioAttempts.referrerAccountId,
      givenName: accounts.givenName,
      familyName: accounts.familyName,
      displayName: accounts.displayName,
    })
    .from(casioAttempts)
    .innerJoin(accounts, eq(accounts.id, casioAttempts.accountId))
    .where(eq(casioAttempts.referrerAccountId, row.id));

  const analyzerAsReferrer = await db
    .select({
      id: analyzerAttempts.id,
      slug: analyzerAttempts.slug,
      accountId: analyzerAttempts.accountId,
      referrerAccountId: analyzerAttempts.referrerAccountId,
      givenName: accounts.givenName,
      familyName: accounts.familyName,
      displayName: accounts.displayName,
    })
    .from(analyzerAttempts)
    .innerJoin(accounts, eq(accounts.id, analyzerAttempts.accountId))
    .where(eq(analyzerAttempts.referrerAccountId, row.id));

  const casioTaken = await db
    .select({
      id: casioAttempts.id,
      accountId: casioAttempts.accountId,
      referrerAccountId: casioAttempts.referrerAccountId,
    })
    .from(casioAttempts)
    .where(eq(casioAttempts.accountId, row.id));

  const analyzerTaken = await db
    .select({
      id: analyzerAttempts.id,
      slug: analyzerAttempts.slug,
      accountId: analyzerAttempts.accountId,
      referrerAccountId: analyzerAttempts.referrerAccountId,
    })
    .from(analyzerAttempts)
    .where(eq(analyzerAttempts.accountId, row.id));

  const extraIds = [
    row.referredByAccountId,
    ...children.map((item) => item.id),
    ...casioAsReferrer.map((item) => item.accountId),
    ...analyzerAsReferrer.map((item) => item.accountId),
    ...casioTaken.map((item) => item.referrerAccountId),
    ...analyzerTaken.map((item) => item.referrerAccountId),
  ].filter((id): id is number => typeof id === "number");

  const codeById = await loadCodeMap([...new Set([row.id, ...extraIds])]);
  const role = asRole(row.role);
  const theyUsed: PersonAttemptLink[] = [
    ...casioTaken
      .filter((item) => item.referrerAccountId)
      .map((item) => ({
        kind: "casio" as const,
        id: item.id,
        slug: "casio-ss",
        takerCode: codeById.get(row.id) ?? code,
        takerNameFa: nameFa(row),
        referrerCode: item.referrerAccountId ? (codeById.get(item.referrerAccountId) ?? null) : null,
        direction: "they_used" as const,
      })),
    ...analyzerTaken
      .filter((item) => item.referrerAccountId)
      .map((item) => ({
        kind: "analyzer" as const,
        id: item.id,
        slug: item.slug,
        takerCode: codeById.get(row.id) ?? code,
        takerNameFa: nameFa(row),
        referrerCode: item.referrerAccountId ? (codeById.get(item.referrerAccountId) ?? null) : null,
        direction: "they_used" as const,
      })),
  ];
  const usedTheirs: PersonAttemptLink[] = [
    ...casioAsReferrer.map((item) => ({
      kind: "casio" as const,
      id: item.id,
      slug: "casio-ss",
      takerCode: codeById.get(item.accountId) ?? "",
      takerNameFa: nameFa(item),
      referrerCode: code,
      direction: "used_theirs" as const,
    })),
    ...analyzerAsReferrer.map((item) => ({
      kind: "analyzer" as const,
      id: item.id,
      slug: item.slug,
      takerCode: codeById.get(item.accountId) ?? "",
      takerNameFa: nameFa(item),
      referrerCode: code,
      direction: "used_theirs" as const,
    })),
  ].filter((item) => item.takerCode);

  return {
    publicCode: code,
    nameFa: nameFa(row),
    phone: displayPhone(row.phone),
    role,
    roleFa: roleFa(role),
    isActive: row.isActive,
    referredBy: row.referredByAccountId ? (codeById.get(row.referredByAccountId) ?? null) : null,
    referredCount: children.length,
    createdAt: iso(row.createdAt),
    lastLoginAt: iso(row.lastLoginAt),
    locked: role === "owner",
    givenName: row.givenName,
    familyName: row.familyName,
    email: row.email,
    telegramUserId: row.telegramUserId,
    attemptCount: casioTaken.length + analyzerTaken.length,
    referred: children
      .filter((item) => item.publicCode)
      .map((item) => ({
        publicCode: item.publicCode as string,
        nameFa: nameFa(item),
        roleFa: roleFa(asRole(item.role)),
      })),
    attempts: [...theyUsed, ...usedTheirs],
  };
}

export async function setPersonRole(input: {
  publicCode: string;
  role: "author" | "member";
  actorId: number;
}): Promise<ActionResult> {
  await ready();
  const target = await accountByPublicCode(input.publicCode);
  if (!target) return { ok: false, error: "unknown_code" };
  const blocked = guardMutable(target, input.actorId);
  if (blocked) return { ok: false, error: blocked };
  const result = await assignAccountRole({ publicCode: input.publicCode, role: input.role });
  if (!result.ok) return result;
  return { ok: true };
}

export async function setPersonActive(input: {
  publicCode: string;
  isActive: boolean;
  actorId: number;
}): Promise<ActionResult> {
  await ready();
  const target = await accountByPublicCode(input.publicCode);
  if (!target) return { ok: false, error: "unknown_code" };
  const blocked = guardMutable(target, input.actorId);
  if (blocked) return { ok: false, error: blocked };
  await db
    .update(accounts)
    .set({ isActive: input.isActive, updatedAt: new Date() })
    .where(eq(accounts.id, target.id));
  if (!input.isActive) await revokeAccountSessions(target.id);
  return { ok: true };
}

export async function setPersonReferrer(input: {
  publicCode: string;
  referredBy: unknown;
  actorId: number;
}): Promise<ActionResult> {
  await ready();
  const target = await accountByPublicCode(input.publicCode);
  if (!target) return { ok: false, error: "unknown_code" };
  const blocked = guardMutable(target, input.actorId);
  if (blocked) return { ok: false, error: blocked };
  const result = await ownerSetAccountReferrer(target.id, input.referredBy);
  if (!result.ok) return result;
  return { ok: true };
}

export async function setChildReferrer(input: {
  publicCode: string;
  childCode: string;
  referredBy: unknown;
  actorId: number;
}): Promise<ActionResult> {
  await ready();
  const parent = await accountByPublicCode(input.publicCode);
  if (!parent) return { ok: false, error: "unknown_code" };
  const blocked = guardMutable(parent, input.actorId);
  if (blocked) return { ok: false, error: blocked };
  const child = await accountByPublicCode(input.childCode);
  if (!child) return { ok: false, error: "unknown_child" };
  if (child.referredByAccountId !== parent.id) return { ok: false, error: "not_referred_by_this" };
  const result = await ownerSetAccountReferrer(child.id, input.referredBy);
  if (!result.ok) return result;
  return { ok: true };
}

export async function setAttemptReferrer(input: {
  publicCode: string;
  kind: "casio" | "analyzer";
  attemptId: number;
  referrer: unknown;
  actorId: number;
}): Promise<ActionResult> {
  await ready();
  const target = await accountByPublicCode(input.publicCode);
  if (!target) return { ok: false, error: "unknown_code" };
  const blocked = guardMutable(target, input.actorId);
  if (blocked) return { ok: false, error: blocked };

  let referrerAccountId: number | null = null;
  if (input.referrer != null && input.referrer !== "") {
    const code = normalizePublicCode(input.referrer);
    if (!code) return { ok: false, error: "invalid_referral" };
    const id = await accountIdByPublicCode(code);
    if (!id) return { ok: false, error: "unknown_referral" };
    referrerAccountId = id;
  }

  if (input.kind === "casio") {
    const [row] = await db.select().from(casioAttempts).where(eq(casioAttempts.id, input.attemptId)).limit(1);
    if (!row) return { ok: false, error: "attempt_missing" };
    if (row.accountId !== target.id && row.referrerAccountId !== target.id) {
      return { ok: false, error: "attempt_unrelated" };
    }
    await db.update(casioAttempts).set({ referrerAccountId }).where(eq(casioAttempts.id, row.id));
    return { ok: true };
  }

  const [row] = await db.select().from(analyzerAttempts).where(eq(analyzerAttempts.id, input.attemptId)).limit(1);
  if (!row) return { ok: false, error: "attempt_missing" };
  if (row.accountId !== target.id && row.referrerAccountId !== target.id) {
    return { ok: false, error: "attempt_unrelated" };
  }
  await db.update(analyzerAttempts).set({ referrerAccountId }).where(eq(analyzerAttempts.id, row.id));
  return { ok: true };
}

export async function wipePerson(input: {
  publicCode: string;
  fields: unknown;
  confirm: unknown;
  actorId: number;
}): Promise<ActionResult> {
  await ready();
  const code = normalizePublicCode(input.publicCode);
  if (!code) return { ok: false, error: "unknown_code" };
  if (normalizePublicCode(input.confirm) !== code) return { ok: false, error: "confirm_mismatch" };
  const fields = parseWipe(input.fields);
  if (fields.length === 0) return { ok: false, error: "nothing_selected" };
  const target = await accountByPublicCode(code);
  if (!target) return { ok: false, error: "unknown_code" };
  const blocked = guardMutable(target, input.actorId);
  if (blocked) return { ok: false, error: blocked };

  const now = new Date();
  const patch: {
    updatedAt: Date;
    givenName?: null;
    familyName?: null;
    displayName?: null;
    email?: null;
    emailVerifiedAt?: null;
    passwordHash?: null;
    passwordSetAt?: null;
    telegramUserId?: null;
    telegramLinkedAt?: null;
    phone?: string;
    phoneVerifiedAt?: null;
    isActive?: boolean;
  } = { updatedAt: now };

  if (fields.includes("name")) {
    patch.givenName = null;
    patch.familyName = null;
    patch.displayName = null;
    await db
      .update(analyzerReports)
      .set({ personNameSnapshot: null })
      .where(eq(analyzerReports.accountId, target.id));
  }
  if (fields.includes("email")) {
    patch.email = null;
    patch.emailVerifiedAt = null;
  }
  if (fields.includes("password")) {
    patch.passwordHash = null;
    patch.passwordSetAt = null;
  }
  if (fields.includes("telegram") || fields.includes("phone")) {
    await scrubTelegramTraces(target.telegramUserId);
    patch.telegramUserId = null;
    patch.telegramLinkedAt = null;
  }
  if (fields.includes("otp") || fields.includes("phone")) {
    if (!isWipedPhone(target.phone)) {
      await db.delete(otpChallenges).where(eq(otpChallenges.phone, target.phone));
    }
  }
  if (fields.includes("sessions") || fields.includes("phone") || fields.includes("password")) {
    await revokeAccountSessions(target.id);
  }
  if (fields.includes("auth_events")) {
    await db.delete(authEvents).where(eq(authEvents.accountId, target.id));
    if (!isWipedPhone(target.phone)) {
      await db.delete(authEvents).where(eq(authEvents.phone, target.phone));
    }
  }
  if (fields.includes("attempts")) {
    await db.delete(analyzerReports).where(eq(analyzerReports.accountId, target.id));
    await db.delete(casioAttempts).where(eq(casioAttempts.accountId, target.id));
    await db.delete(analyzerAttempts).where(eq(analyzerAttempts.accountId, target.id));
  }
  if (fields.includes("phone")) {
    await scrubPhoneTraces(target.phone, target.id);
    patch.phone = placeholderPhone(target.id);
    patch.phoneVerifiedAt = null;
    patch.isActive = false;
  }

  await db.update(accounts).set(patch).where(eq(accounts.id, target.id));
  return { ok: true };
}

export async function deletePerson(input: {
  publicCode: string;
  confirm: unknown;
  actorId: number;
}): Promise<ActionResult> {
  await ready();
  const code = normalizePublicCode(input.publicCode);
  if (!code) return { ok: false, error: "unknown_code" };
  if (normalizePublicCode(input.confirm) !== code) return { ok: false, error: "confirm_mismatch" };
  const target = await accountByPublicCode(code);
  if (!target) return { ok: false, error: "unknown_code" };
  const blocked = guardMutable(target, input.actorId);
  if (blocked) return { ok: false, error: blocked };

  const [ownedBot] = await db.select({ id: bots.id }).from(bots).where(eq(bots.ownerId, target.id)).limit(1);
  if (ownedBot) return { ok: false, error: "owns_bots" };

  await db
    .update(accounts)
    .set({ referredByAccountId: null, updatedAt: new Date() })
    .where(eq(accounts.referredByAccountId, target.id));
  await db.update(casioAttempts).set({ referrerAccountId: null }).where(eq(casioAttempts.referrerAccountId, target.id));
  await db
    .update(analyzerAttempts)
    .set({ referrerAccountId: null })
    .where(eq(analyzerAttempts.referrerAccountId, target.id));
  await scrubPhoneTraces(target.phone, target.id);
  await scrubTelegramTraces(target.telegramUserId);
  await db.delete(analyzerReports).where(eq(analyzerReports.accountId, target.id));
  await db.delete(authEvents).where(eq(authEvents.accountId, target.id));
  await db.delete(accounts).where(eq(accounts.id, target.id));
  return { ok: true };
}
