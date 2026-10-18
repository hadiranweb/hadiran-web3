import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { analyzerAttempts } from "@/db/schema";
import { ensureAnalyzerAuthoringSchema } from "@/lib/auth/schema-guard";
import type { AnalyzerPack } from "@/lib/analyzers/pack";
import { findItem } from "@/lib/analyzers/pack";
import { scorePack } from "@/lib/analyzers/score";
import {
  filterAnswers,
  isComplete,
  normalizeAnswer,
  type AnswerMap,
  type AttemptView,
} from "@/lib/analyzers/runtime";

export type { AttemptView };

function view(row: {
  instrumentVersion: string;
  status: string;
  consentAt: Date | null;
  answers: AnswerMap | null;
  submittedAt: Date | null;
  results?: AttemptView["results"];
  referrerPublicCode?: string | null;
  discountCode?: string | null;
}, pack: AnalyzerPack): AttemptView {
  return {
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

async function openAttempt(accountId: number, slug: string) {
  const [row] = await db
    .select()
    .from(analyzerAttempts)
    .where(
      and(
        eq(analyzerAttempts.accountId, accountId),
        eq(analyzerAttempts.slug, slug),
        eq(analyzerAttempts.status, "in_progress"),
      ),
    )
    .limit(1);
  return row ?? null;
}

async function latestSubmitted(accountId: number, slug: string) {
  const [row] = await db
    .select()
    .from(analyzerAttempts)
    .where(
      and(
        eq(analyzerAttempts.accountId, accountId),
        eq(analyzerAttempts.slug, slug),
        eq(analyzerAttempts.status, "submitted"),
      ),
    )
    .orderBy(desc(analyzerAttempts.submittedAt))
    .limit(1);
  return row ?? null;
}

async function createOpen(accountId: number, pack: AnalyzerPack) {
  try {
    const [row] = await db
      .insert(analyzerAttempts)
      .values({
        accountId,
        slug: pack.slug,
        instrumentVersion: pack.version,
        answers: {},
        status: "in_progress",
      })
      .returning();
    return row;
  } catch {
    const existing = await openAttempt(accountId, pack.slug);
    if (existing) return existing;
    throw new Error("analyzer_attempt_create_failed");
  }
}

export async function readAttempt(accountId: number, pack: AnalyzerPack): Promise<AttemptView | null> {
  await ensureAnalyzerAuthoringSchema();
  const open = await openAttempt(accountId, pack.slug);
  if (open) return view(open, pack);
  const submitted = await latestSubmitted(accountId, pack.slug);
  return submitted ? view(submitted, pack) : null;
}

export async function consentAttempt(
  accountId: number,
  pack: AnalyzerPack,
  codes?: { referralCode?: unknown; discountCode?: unknown },
): Promise<AttemptView | { error: string }> {
  await ensureAnalyzerAuthoringSchema();
  const submitted = await latestSubmitted(accountId, pack.slug);
  if (submitted && !(await openAttempt(accountId, pack.slug))) {
    return view(submitted, pack);
  }
  let row = await openAttempt(accountId, pack.slug);
  if (!row) row = await createOpen(accountId, pack);
  if (!row.consentAt) {
    const [updated] = await db
      .update(analyzerAttempts)
      .set({ consentAt: new Date(), updatedAt: new Date(), instrumentVersion: pack.version })
      .where(eq(analyzerAttempts.id, row.id))
      .returning();
    row = updated;
  }
  if (codes) {
    const applied = await (await import("@/lib/analyzers/attempt-codes")).applyAttemptCodes({
      slug: pack.slug,
      accountId,
      referralCode: codes.referralCode,
      discountCode: codes.discountCode,
    });
    if (!applied.ok) return { error: applied.error };
  }
  return view(row, pack);
}

export async function saveAnswer(
  accountId: number,
  pack: AnalyzerPack,
  id: string,
  value: unknown,
): Promise<{ ok: true; attempt: AttemptView } | { ok: false; error: string }> {
  await ensureAnalyzerAuthoringSchema();
  const item = findItem(pack, id);
  if (!item) return { ok: false, error: "unknown_item" };
  const normalized = normalizeAnswer(item, value);
  if (normalized == null) return { ok: false, error: "invalid_answer" };

  let row = await openAttempt(accountId, pack.slug);
  if (!row) {
    const submitted = await latestSubmitted(accountId, pack.slug);
    if (submitted) return { ok: false, error: "already_submitted" };
    row = await createOpen(accountId, pack);
  }
  if (!row.consentAt) return { ok: false, error: "consent_required" };

  const answers = { ...filterAnswers(pack, row.answers), [id]: normalized };
  const [updated] = await db
    .update(analyzerAttempts)
    .set({ answers, updatedAt: new Date(), instrumentVersion: pack.version })
    .where(eq(analyzerAttempts.id, row.id))
    .returning();
  return { ok: true, attempt: view(updated, pack) };
}

export async function submitAttempt(
  accountId: number,
  pack: AnalyzerPack,
): Promise<{ ok: true; attempt: AttemptView } | { ok: false; error: string }> {
  await ensureAnalyzerAuthoringSchema();
  const row = await openAttempt(accountId, pack.slug);
  if (!row) {
    const submitted = await latestSubmitted(accountId, pack.slug);
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
    .update(analyzerAttempts)
    .set({
      status: "submitted",
      submittedAt: new Date(),
      updatedAt: new Date(),
      answers,
      results,
      instrumentVersion: pack.version,
    })
    .where(eq(analyzerAttempts.id, row.id))
    .returning();
  return { ok: true, attempt: view(updated, pack) };
}
