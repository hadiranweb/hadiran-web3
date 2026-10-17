import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { casioAttempts } from "@/db/schema";
import { ensureCasioAttemptsSchema } from "@/lib/auth/schema-guard";
import {
  findItem,
  isComplete,
  normalizeAnswer,
  type AnswerMap,
  type AttemptView,
} from "./answers";
import { INSTRUMENT_VERSION } from "./instrument";

export type { AttemptView };

function asAnswers(value: unknown): AnswerMap {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: AnswerMap = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    const item = findItem(key);
    if (!item) continue;
    const normalized = normalizeAnswer(item, raw);
    if (normalized != null) out[key] = normalized;
  }
  return out;
}

function view(row: {
  instrumentVersion: string;
  status: string;
  consentAt: Date | null;
  answers: AnswerMap | null;
  submittedAt: Date | null;
}): AttemptView {
  return {
    instrumentVersion: row.instrumentVersion,
    status: row.status === "submitted" ? "submitted" : "in_progress",
    consentAt: row.consentAt ? row.consentAt.toISOString() : null,
    answers: asAnswers(row.answers),
    submittedAt: row.submittedAt ? row.submittedAt.toISOString() : null,
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

async function createOpen(accountId: number) {
  try {
    const [row] = await db
      .insert(casioAttempts)
      .values({
        accountId,
        instrumentVersion: INSTRUMENT_VERSION,
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

export async function readAttempt(accountId: number): Promise<AttemptView | null> {
  await ensureCasioAttemptsSchema();
  const open = await openAttempt(accountId);
  if (open) return view(open);
  const submitted = await latestSubmitted(accountId);
  return submitted ? view(submitted) : null;
}

export async function consentAttempt(accountId: number): Promise<AttemptView> {
  await ensureCasioAttemptsSchema();
  const submitted = await latestSubmitted(accountId);
  if (submitted && !(await openAttempt(accountId))) {
    return view(submitted);
  }
  let row = await openAttempt(accountId);
  if (!row) row = await createOpen(accountId);
  if (row.consentAt) return view(row);
  const [updated] = await db
    .update(casioAttempts)
    .set({ consentAt: new Date(), updatedAt: new Date() })
    .where(eq(casioAttempts.id, row.id))
    .returning();
  return view(updated);
}

export async function saveAnswer(
  accountId: number,
  id: string,
  value: unknown,
): Promise<{ ok: true; attempt: AttemptView } | { ok: false; error: string }> {
  await ensureCasioAttemptsSchema();
  const item = findItem(id);
  if (!item) return { ok: false, error: "unknown_item" };
  const normalized = normalizeAnswer(item, value);
  if (normalized == null) return { ok: false, error: "invalid_answer" };

  let row = await openAttempt(accountId);
  if (!row) {
    const submitted = await latestSubmitted(accountId);
    if (submitted) return { ok: false, error: "already_submitted" };
    row = await createOpen(accountId);
  }
  if (!row.consentAt) return { ok: false, error: "consent_required" };

  const answers = { ...asAnswers(row.answers), [id]: normalized };
  const [updated] = await db
    .update(casioAttempts)
    .set({ answers, updatedAt: new Date() })
    .where(eq(casioAttempts.id, row.id))
    .returning();
  return { ok: true, attempt: view(updated) };
}

export async function submitAttempt(
  accountId: number,
): Promise<{ ok: true; attempt: AttemptView } | { ok: false; error: string }> {
  await ensureCasioAttemptsSchema();
  const row = await openAttempt(accountId);
  if (!row) {
    const submitted = await latestSubmitted(accountId);
    if (submitted) return { ok: true, attempt: view(submitted) };
    return { ok: false, error: "not_started" };
  }
  if (!row.consentAt) return { ok: false, error: "consent_required" };
  const answers = asAnswers(row.answers);
  if (!isComplete(answers)) return { ok: false, error: "incomplete" };
  const [updated] = await db
    .update(casioAttempts)
    .set({
      status: "submitted",
      submittedAt: new Date(),
      updatedAt: new Date(),
      answers,
    })
    .where(eq(casioAttempts.id, row.id))
    .returning();
  return { ok: true, attempt: view(updated) };
}
