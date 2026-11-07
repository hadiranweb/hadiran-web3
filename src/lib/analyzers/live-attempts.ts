import {
  consentAttempt,
  readAttempt,
  retakeAttempt,
  saveAnswer,
  submitAttempt,
} from "@/lib/analyzers/attempts";
import { resolveLivePack } from "@/lib/analyzers/authored";
import type { AnalyzerPack } from "@/lib/analyzers/pack";
import type { AttemptView } from "@/lib/analyzers/runtime";

export async function livePack(slug: string): Promise<AnalyzerPack | null> {
  return resolveLivePack(slug);
}

export async function liveReadAttempt(accountId: number, slug: string): Promise<AttemptView | null> {
  const pack = await resolveLivePack(slug);
  if (!pack) return null;
  return readAttempt(accountId, pack);
}

export async function liveRetakeAttempt(accountId: number, slug: string): Promise<AttemptView | null> {
  const pack = await resolveLivePack(slug);
  if (!pack) return null;
  return retakeAttempt(accountId, pack);
}

export async function liveConsentAttempt(
  accountId: number,
  slug: string,
  codes?: { referralCode?: unknown; discountCode?: unknown },
): Promise<AttemptView | null | { error: string }> {
  const pack = await resolveLivePack(slug);
  if (!pack) return null;
  return consentAttempt(accountId, pack, codes);
}

export async function liveSaveAnswer(
  accountId: number,
  slug: string,
  id: string,
  value: unknown,
): Promise<{ ok: true; attempt: AttemptView } | { ok: false; error: string }> {
  const pack = await resolveLivePack(slug);
  if (!pack) return { ok: false, error: "missing_pack" };
  return saveAnswer(accountId, pack, id, value);
}

export async function liveSubmitAttempt(
  accountId: number,
  slug: string,
): Promise<{ ok: true; attempt: AttemptView } | { ok: false; error: string }> {
  const pack = await resolveLivePack(slug);
  if (!pack) return { ok: false, error: "missing_pack" };
  return submitAttempt(accountId, pack);
}
