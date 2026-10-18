import {
  consentAttempt as consentGeneric,
  readAttempt as readGeneric,
  saveAnswer as saveGeneric,
  submitAttempt as submitGeneric,
} from "@/lib/analyzers/attempts";
import { resolveLivePack } from "@/lib/analyzers/authored";
import {
  consentAttempt as consentCasio,
  readAttempt as readCasio,
  saveAnswer as saveCasio,
  submitAttempt as submitCasio,
} from "@/lib/analyzers/casio-ss/attempts";
import type { AnalyzerPack } from "@/lib/analyzers/pack";
import type { AttemptView } from "@/lib/analyzers/runtime";

export async function livePack(slug: string): Promise<AnalyzerPack | null> {
  return resolveLivePack(slug);
}

export async function liveReadAttempt(accountId: number, slug: string): Promise<AttemptView | null> {
  if (slug === "casio-ss") return readCasio(accountId);
  const pack = await resolveLivePack(slug);
  if (!pack) return null;
  return readGeneric(accountId, pack);
}

export async function liveConsentAttempt(
  accountId: number,
  slug: string,
  codes?: { referralCode?: unknown; discountCode?: unknown },
): Promise<AttemptView | null | { error: string }> {
  if (slug === "casio-ss") return consentCasio(accountId, codes);
  const pack = await resolveLivePack(slug);
  if (!pack) return null;
  return consentGeneric(accountId, pack, codes);
}

export async function liveSaveAnswer(
  accountId: number,
  slug: string,
  id: string,
  value: unknown,
): Promise<{ ok: true; attempt: AttemptView } | { ok: false; error: string }> {
  if (slug === "casio-ss") return saveCasio(accountId, id, value);
  const pack = await resolveLivePack(slug);
  if (!pack) return { ok: false, error: "missing_pack" };
  return saveGeneric(accountId, pack, id, value);
}

export async function liveSubmitAttempt(
  accountId: number,
  slug: string,
): Promise<{ ok: true; attempt: AttemptView } | { ok: false; error: string }> {
  if (slug === "casio-ss") return submitCasio(accountId);
  const pack = await resolveLivePack(slug);
  if (!pack) return { ok: false, error: "missing_pack" };
  return submitGeneric(accountId, pack);
}
