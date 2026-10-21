import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { casioAttempts } from "@/db/schema";
import { ensureCasioAttemptsSchema } from "@/lib/auth/schema-guard";
import { resolveLivePack } from "@/lib/analyzers/authored";
import { findItem, type AnalyzerPack } from "@/lib/analyzers/pack";
import { scorePack } from "@/lib/analyzers/score";
import {
  filterAnswers,
  isComplete,
  normalizeAnswer,
  type AnswerMap,
  type AttemptView,
} from "@/lib/analyzers/runtime";
import { referrerCodeOf } from "@/lib/analyzers/attempt-codes";
import { buildCasioAuthoredPack } from "./authored-pack";

export type { AttemptView };

async function livePack(): Promise<AnalyzerPack> {
  return (await resolveLivePack("casio-ss")) ?? buildCasioAuthoredPack();
}

function view(
  row: {
    id: number;
    instrumentVersion: string;
    status: string;
    consentAt: Date | null;
    answers: AnswerMap | null;
    submittedAt: Date | null;
    results?: AttemptView["results"];
    referrerPublicCode?: string | null;
    discountCode?: string | null;
  },
  pack: AnalyzerPack,
): AttemptView {
  return {
    id: row.id,
    instrumentVersion: row.instrumentVersion,
    status: row.status === "submitted" ? "submitted" : "in_progress",
    consentAt: row.consentAt ? row.consentAt.toISOString() : null,
    answers: filterAnswers(pack, row.answers),
    submittedAt: row.submittedAt ? row.submittedAt.toISOString() : null,
    referrerPublicCode: row.referrerPublicCode ?? null,
    discountCode: row.discountCode ?? null,
    results: row.results ?? null,
  };
}

async function openAttempt(accountId: number) {
  const [row] = await db
    .select()
    .from(casioAttempts)
    .where(and(eq(casioAttempts.accountId, accountId), eq(casioAttempts.status, "in_progress")))
    .limit(1);
  return row ?? null;
}

async function latestSubmitted(accountId: number) {
  const [row] = await db
    .select()
    .from(casioAttempts)
    .where(and(eq(casioAttempts.accountId, accountId), eq(casioAttempts.status, "submitted")))
    .orderBy(desc(casioAttempts.submittedAt))
    .limit(1);
  return row ?? null;
}

async function createOpen(accountId: number, pack: AnalyzerPack) {
  try {
    const [row] = await db
      .insert(casioAttempts)
      .values({
        accountId,
        instrumentVersion: pack.version,
        answers: {},
        status: "in_progress",
      })
      .returning();
    return row;
  } catch {
    const existing = await openAttempt(accountId);
    if (existing) return existing;
    throw new Error("casio_attempt_create_failed");
  }
}

async function withCodes<T extends { referrerAccountId?: number | null; discountCode?: string | null }>(row: T) {
  return {
    ...row,
    referrerPublicCode: await referrerCodeOf(row.referrerAccountId),
    discountCode: row.discountCode ?? null,
  };
}

export async function readAttempt(accountId: number): Promise<AttemptView | null> {
  await ensureCasioAttemptsSchema();
  const pack = await livePack();
  const open = await openAttempt(accountId);
  if (open) return view(await withCodes(open), pack);
  const submitted = await latestSubmitted(accountId);
  return submitted ? view(await withCodes(submitted), pack) : null;
}

export async function retakeAttempt(accountId: number): Promise<AttemptView> {
  await ensureCasioAttemptsSchema();
  const pack = await livePack();
  const open = await openAttempt(accountId);
  if (open) {
    await db
      .update(casioAttempts)
      .set({ status: "abandoned", updatedAt: new Date() })
      .where(eq(casioAttempts.id, open.id));
  }
  const row = await createOpen(accountId, pack);
  return view(await withCodes(row), pack);
}

export async function consentAttempt(
  accountId: number,
  codes?: { referralCode?: unknown; discountCode?: unknown },
): Promise<AttemptView | { error: string }> {
  await ensureCasioAttemptsSchema();
  const pack = await livePack();
  const submitted = await latestSubmitted(accountId);
  if (submitted && !(await openAttempt(accountId))) {
    return view(await withCodes(submitted), pack);
  }
  let row = await openAttempt(accountId);
  if (!row) row = await createOpen(accountId, pack);
  if (!row.consentAt) {
    const [updated] = await db
      .update(casioAttempts)
      .set({ consentAt: new Date(), updatedAt: new Date(), instrumentVersion: pack.version })
      .where(eq(casioAttempts.id, row.id))
      .returning();
    row = updated;
  }
  if (codes) {
    const applied = await (await import("@/lib/analyzers/attempt-codes")).applyAttemptCodes({
      slug: "casio-ss",
      accountId,
      referralCode: codes.referralCode,
      discountCode: codes.discountCode,
    });
    if (!applied.ok) return { error: applied.error };
    row = (await openAttempt(accountId)) ?? row;
  }
  return view(await withCodes(row), pack);
}

export async function saveAnswer(
  accountId: number,
  id: string,
  value: unknown,
): Promise<{ ok: true; attempt: AttemptView } | { ok: false; error: string }> {
  await ensureCasioAttemptsSchema();
  const pack = await livePack();
  const item = findItem(pack, id);
  if (!item) return { ok: false, error: "unknown_item" };
  const normalized = normalizeAnswer(item, value);
  if (normalized == null) return { ok: false, error: "invalid_answer" };

  let row = await openAttempt(accountId);
  if (!row) {
    const submitted = await latestSubmitted(accountId);
    if (submitted) return { ok: false, error: "already_submitted" };
    row = await createOpen(accountId, pack);
  }
  if (!row.consentAt) return { ok: false, error: "consent_required" };

  const answers = { ...filterAnswers(pack, row.answers), [id]: normalized };
  const [updated] = await db
    .update(casioAttempts)
    .set({ answers, updatedAt: new Date(), instrumentVersion: pack.version })
    .where(eq(casioAttempts.id, row.id))
    .returning();
  return { ok: true, attempt: view(updated, pack) };
}

export async function submitAttempt(
  accountId: number,
): Promise<{ ok: true; attempt: AttemptView } | { ok: false; error: string }> {
  await ensureCasioAttemptsSchema();
  const pack = await livePack();
  const row = await openAttempt(accountId);
  if (!row) {
    const submitted = await latestSubmitted(accountId);
    if (submitted) return { ok: true, attempt: view(submitted, pack) };
    return { ok: false, error: "not_started" };
  }
  if (!row.consentAt) return { ok: false, error: "consent_required" };
  const answers = filterAnswers(pack, row.answers);
  if (!isComplete(pack, answers)) return { ok: false, error: "incomplete" };
  let results: AttemptView["results"];
  try {
    results = scorePack(pack, answers);
  } catch {
    return { ok: false, error: "score_failed" };
  }
  const [updated] = await db
    .update(casioAttempts)
    .set({
      status: "submitted",
      submittedAt: new Date(),
      updatedAt: new Date(),
      answers,
      results,
      instrumentVersion: pack.version,
    })
    .where(eq(casioAttempts.id, row.id))
    .returning();
  return { ok: true, attempt: view(updated, pack) };
}
