import { normalizePhone } from "./phone";

export const SESSION_COOKIE = "hadiran_session";
export const SESSION_DAYS = 30;
export const OTP_TTL_SECONDS = Number(process.env.OTP_TTL_SECONDS || 120);
export const OTP_MAX_ATTEMPTS = Number(process.env.OTP_MAX_ATTEMPTS || 5);

export function smsIrConfig() {
  const apiKey = process.env.SMSIR_API_KEY?.trim() || "";
  const templateRaw = process.env.SMSIR_TEMPLATE_ID?.trim() || "";
  const templateId = Number(templateRaw);
  return {
    apiKey,
    templateId: Number.isFinite(templateId) ? templateId : 0,
    codeParameter: process.env.SMSIR_CODE_PARAMETER?.trim() || "CODE",
    timeoutMs: Number(process.env.SMSIR_TIMEOUT_MS || 10000),
    configured: Boolean(apiKey && templateRaw),
  };
}

export function ownerPhones(): Set<string> {
  const raw = process.env.HADIRAN_OWNER_PHONES || "";
  const set = new Set<string>();
  for (const part of raw.split(/[,\s]+/)) {
    if (!part) continue;
    try {
      set.add(normalizePhone(part));
    } catch {
      // skip malformed env entries
    }
  }
  return set;
}

export function isProduction() {
  return process.env.NODE_ENV === "production";
}
