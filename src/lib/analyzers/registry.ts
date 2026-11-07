import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { analyzerAttempts } from "@/db/schema";
import { mindsetGatePack } from "@/lib/analyzers/mindset-gate/pack";
import { systemDiagnosisPack } from "@/lib/analyzers/system-diagnosis/pack";
import { listAuthoredPacks, resolveLivePack } from "@/lib/analyzers/authored";
import { assertPack, type AnalyzerPack } from "@/lib/analyzers/pack";
import { sanitizePack } from "@/lib/analyzers/sanitize";
import { hasRelationalAuthoringSchema, readAuthoredPackVersion } from "@/lib/analyzers/relational-store";

/**
 * پک‌های کد فقط «بذر اولیه»‌اند (برای DB خالی و Fallback بدون دیتابیس).
 * منبع اجرای واقعی، ردیف analyzer_packs است — برای دو آزمون تازه با بذر مدیر
 * (authored.ts: ensureManagerSeeds). ویرایش از میز
 * آزمون‌ساز روی DB می‌نشیند و بر بذر کد غلبه می‌کند (loadPack/loadPacks).
 */
const codePacksList: AnalyzerPack[] = [mindsetGatePack, systemDiagnosisPack];

for (const pack of codePacksList) assertPack(pack);

export function codePacks(): AnalyzerPack[] {
  return codePacksList;
}

export function getCodePack(slug: string): AnalyzerPack | undefined {
  return codePacksList.find((pack) => pack.slug === slug);
}

export async function loadPacks(): Promise<AnalyzerPack[]> {
  let authored: AnalyzerPack[] = [];
  try {
    authored = await listAuthoredPacks();
  } catch {
    authored = [];
  }
  const bySlug = new Map<string, AnalyzerPack>();
  for (const pack of codePacksList) bySlug.set(pack.slug, pack);
  for (const pack of authored) {
    const clean = sanitizePack(pack, pack.slug);
    if (clean.ok) bySlug.set(pack.slug, clean.pack);
  }
  return [...bySlug.values()];
}

export async function loadPack(slug: string): Promise<AnalyzerPack | undefined> {
  try {
    const live = await resolveLivePack(slug);
    if (live) return live;
  } catch {
    // fall through to code
  }
  return getCodePack(slug);
}

/** Resolve an existing attempt against its immutable definition rather than the current release. */
export async function loadPackForAttemptId(slug: string, attemptId: number): Promise<AnalyzerPack | undefined> {
  if (!Number.isInteger(attemptId) || attemptId <= 0) return undefined;
  const relationalReady = await hasRelationalAuthoringSchema();
  if (!relationalReady) {
    const [legacyAttempt] = await db
      .select({ instrumentVersion: analyzerAttempts.instrumentVersion })
      .from(analyzerAttempts)
      .where(and(eq(analyzerAttempts.id, attemptId), eq(analyzerAttempts.slug, slug)))
      .limit(1);
    if (!legacyAttempt) return undefined;
    const current = await loadPack(slug);
    return current?.version === legacyAttempt.instrumentVersion ? current : undefined;
  }

  const [attempt] = await db
    .select({ packVersionId: analyzerAttempts.packVersionId, instrumentVersion: analyzerAttempts.instrumentVersion })
    .from(analyzerAttempts)
    .where(and(eq(analyzerAttempts.id, attemptId), eq(analyzerAttempts.slug, slug)))
    .limit(1);
  if (!attempt) return undefined;

  if (attempt.packVersionId != null) {
    const exact = await readAuthoredPackVersion(attempt.packVersionId);
    return exact?.slug === slug && exact.version === attempt.instrumentVersion ? exact : undefined;
  }

  const current = await loadPack(slug);
  return current?.version === attempt.instrumentVersion ? current : undefined;
}

export async function loadPackForAttempt(
  slug: string,
  accountId: number,
  status: "in_progress" | "submitted",
): Promise<{ pack: AnalyzerPack | undefined; attemptFound: boolean }> {
  try {
    const relationalReady = await hasRelationalAuthoringSchema();
    let attempt: { id: number; instrumentVersion: string; packVersionId?: number | null } | undefined;
    if (relationalReady) {
      const [row] = await db
        .select({ id: analyzerAttempts.id, packVersionId: analyzerAttempts.packVersionId, instrumentVersion: analyzerAttempts.instrumentVersion })
        .from(analyzerAttempts)
        .where(and(
          eq(analyzerAttempts.accountId, accountId),
          eq(analyzerAttempts.slug, slug),
          eq(analyzerAttempts.status, status),
        ))
        .orderBy(desc(analyzerAttempts.createdAt), desc(analyzerAttempts.id))
        .limit(1);
      attempt = row;
    } else {
      const [row] = await db
        .select({ id: analyzerAttempts.id, instrumentVersion: analyzerAttempts.instrumentVersion })
        .from(analyzerAttempts)
        .where(and(
          eq(analyzerAttempts.accountId, accountId),
          eq(analyzerAttempts.slug, slug),
          eq(analyzerAttempts.status, status),
        ))
        .orderBy(desc(analyzerAttempts.createdAt), desc(analyzerAttempts.id))
        .limit(1);
      attempt = row;
    }
    if (!attempt) return { pack: await loadPack(slug), attemptFound: false };
    if (relationalReady && attempt.packVersionId != null) {
      const exact = await readAuthoredPackVersion(attempt.packVersionId);
      if (exact?.slug === slug && exact.version === attempt.instrumentVersion) return { pack: exact, attemptFound: true };
    }
    const current = await loadPack(slug);
    return { pack: current?.version === attempt.instrumentVersion ? current : undefined, attemptFound: true };
  } catch {
    return { pack: await loadPack(slug), attemptFound: false };
  }
}

/** Packهای کد به‌عنوان بذر. فهرست زنده: loadPacks. */
export function analyzerPacks(): AnalyzerPack[] {
  return codePacksList;
}

export function getPack(slug: string): AnalyzerPack | undefined {
  return getCodePack(slug);
}
