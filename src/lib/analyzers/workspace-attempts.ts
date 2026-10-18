import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { accountPublicCodes, accounts, analyzerAttempts, casioAttempts } from "@/db/schema";
import { resolveLivePack } from "@/lib/analyzers/authored";
import { findItem, itemsOf, type AnalyzerPack } from "@/lib/analyzers/pack";
import {
  ensureAccountProfileSchema,
  ensureAnalyzerAuthoringSchema,
  ensureCasioAttemptsSchema,
} from "@/lib/auth/schema-guard";
import type {
  WorkspaceAttemptAnswer,
  WorkspaceAttemptRow,
  WorkspaceAttemptScore,
} from "@/lib/analyzers/workspace-attempt-types";

export type { WorkspaceAttemptAnswer, WorkspaceAttemptRow, WorkspaceAttemptScore };

const HIDDEN_SCORE_IDS = new Set(["gate-band"]);
const HIDDEN_SCORE_VALUES = new Set(["green", "yellow", "red"]);

function nameOf(row: { givenName: string | null; familyName: string | null; displayName: string | null }): string {
  const joined = [row.givenName, row.familyName].filter(Boolean).join(" ").trim();
  if (joined) return joined;
  if (row.displayName?.trim()) return row.displayName.trim();
  return "بدون نام";
}

function formatValue(value: number | string): string {
  if (typeof value === "number") {
    const rounded = Math.round(value * 10) / 10;
    return String(rounded);
  }
  return value;
}

function answerRows(pack: AnalyzerPack, answers: Record<string, number | string> | null): WorkspaceAttemptAnswer[] {
  const map = answers ?? {};
  const out: WorkspaceAttemptAnswer[] = [];
  for (const item of itemsOf(pack)) {
    const raw = map[item.id];
    if (raw == null || raw === "") continue;
    let valueFa = String(raw);
    if (item.kind === "choice" && typeof raw === "string") {
      valueFa = item.options.find((option) => option.value === raw)?.label ?? raw;
    }
    out.push({ id: item.id, labelFa: item.text, valueFa });
  }
  return out;
}

function scoreRows(pack: AnalyzerPack, results: { scores?: Record<string, number | string> } | null): WorkspaceAttemptScore[] {
  const scores = results?.scores;
  if (!scores) return [];
  const out: WorkspaceAttemptScore[] = [];
  for (const [id, value] of Object.entries(scores)) {
    if (HIDDEN_SCORE_IDS.has(id) || id.endsWith(":gate-band")) continue;
    if (typeof value === "string" && HIDDEN_SCORE_VALUES.has(value)) continue;
    const finding = pack.findings.find((row) => row.id === id);
    const formula = pack.formulas.find((row) => row.id === id);
    let titleFa = finding?.titleFa ?? formula?.id ?? id;
    if (id === "bottleneck" && typeof value === "string") {
      const target = pack.findings.find((row) => row.id === value);
      out.push({ id, titleFa: "گلوگاه", valueFa: target?.titleFa ?? value });
      continue;
    }
    if (id === "maturity" && typeof value === "string") {
      const label = formula?.bands?.find((band) => band.id === value)?.labelFa ?? value;
      out.push({ id, titleFa: "بلوغ", valueFa: label });
      continue;
    }
    if (id === "diagnosis-total") titleFa = "نمرهٔ کل";
    out.push({ id, titleFa, valueFa: formatValue(value) });
  }
  return out;
}

function businessNameOf(pack: AnalyzerPack, answers: Record<string, number | string> | null): string | null {
  const id = pack.report?.businessNameItemId ?? "BIZ.1";
  const raw = answers?.[id];
  if (typeof raw === "string" && raw.trim()) return raw.trim();
  const item = findItem(pack, id);
  if (item?.kind === "choice" && typeof raw === "string") {
    return item.options.find((option) => option.value === raw)?.label ?? null;
  }
  return null;
}

type Joined = {
  attemptId: number;
  instrumentVersion: string;
  status: string;
  answers: Record<string, number | string> | null;
  results: { scores?: Record<string, number | string> } | null;
  submittedAt: Date | null;
  updatedAt: Date | null;
  givenName: string | null;
  familyName: string | null;
  displayName: string | null;
  phone: string;
  publicCode: string | null;
};

function toRow(pack: AnalyzerPack, row: Joined): WorkspaceAttemptRow {
  return {
    attemptId: row.attemptId,
    publicCode: row.publicCode,
    nameFa: nameOf(row),
    phone: row.phone,
    status: row.status === "submitted" ? "submitted" : "in_progress",
    instrumentVersion: row.instrumentVersion,
    submittedAt: row.submittedAt ? row.submittedAt.toISOString() : null,
    updatedAt: row.updatedAt ? row.updatedAt.toISOString() : null,
    businessName: businessNameOf(pack, row.answers),
    scores: scoreRows(pack, row.results),
    answers: answerRows(pack, row.answers),
  };
}

export async function listWorkspaceAttempts(slug: string): Promise<WorkspaceAttemptRow[]> {
  const pack = await resolveLivePack(slug);
  if (!pack) return [];
  await ensureAccountProfileSchema();

  if (slug === "casio-ss") {
    await ensureCasioAttemptsSchema();
    const rows = await db
      .select({
        attemptId: casioAttempts.id,
        instrumentVersion: casioAttempts.instrumentVersion,
        status: casioAttempts.status,
        answers: casioAttempts.answers,
        results: casioAttempts.results,
        submittedAt: casioAttempts.submittedAt,
        updatedAt: casioAttempts.updatedAt,
        givenName: accounts.givenName,
        familyName: accounts.familyName,
        displayName: accounts.displayName,
        phone: accounts.phone,
        publicCode: accountPublicCodes.code,
      })
      .from(casioAttempts)
      .innerJoin(accounts, eq(accounts.id, casioAttempts.accountId))
      .leftJoin(accountPublicCodes, eq(accountPublicCodes.accountId, accounts.id))
      .orderBy(desc(casioAttempts.submittedAt), desc(casioAttempts.updatedAt))
      .limit(300);
    return rows.map((row) => toRow(pack, row));
  }

  await ensureAnalyzerAuthoringSchema();
  const rows = await db
    .select({
      attemptId: analyzerAttempts.id,
      instrumentVersion: analyzerAttempts.instrumentVersion,
      status: analyzerAttempts.status,
      answers: analyzerAttempts.answers,
      results: analyzerAttempts.results,
      submittedAt: analyzerAttempts.submittedAt,
      updatedAt: analyzerAttempts.updatedAt,
      givenName: accounts.givenName,
      familyName: accounts.familyName,
      displayName: accounts.displayName,
      phone: accounts.phone,
      publicCode: accountPublicCodes.code,
    })
    .from(analyzerAttempts)
    .innerJoin(accounts, eq(accounts.id, analyzerAttempts.accountId))
    .leftJoin(accountPublicCodes, eq(accountPublicCodes.accountId, accounts.id))
    .where(eq(analyzerAttempts.slug, slug))
    .orderBy(desc(analyzerAttempts.submittedAt), desc(analyzerAttempts.updatedAt))
    .limit(300);
  return rows.map((row) => toRow(pack, row));
}
