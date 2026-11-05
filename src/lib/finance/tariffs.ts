import { calculateCommissionFee, FEE_ROUNDING_MODES, type FeeRounding } from "../commerce/assessment-policy";

export type TariffPayer = "buyer" | "creator" | "platform";
type TariffBase = { key: string; label: string; enabled: boolean; payer: TariffPayer };
export type Tariff = TariffBase & (
  { mode: "fixed"; amountIRR: string } |
  { mode: "percentage"; basisPoints: number; basis: "pre_discount" } |
  { mode: "free" }
);
export type FinancePlanDraft = {
  key: string; name: string; currency: "IRR"; rounding: FeeRounding;
  refundPolicy: "before_delivery_only"; tariffs: Tariff[];
};
export type FinancePlanRevision = FinancePlanDraft & { version: number; digest: string; createdAt: string };
export const TARIFF_SUGGESTIONS = [
  { key: "assessment.interpretation.commission", label: "کارمزد تفسیر", payer: "creator" },
  { key: "assessment.document.commission", label: "کارمزد سند محصول", payer: "creator" },
  { key: "document.direct", label: "ساخت و ارسال مستقیم سند", payer: "creator" },
  { key: "wallet.topup", label: "شارژ دستی کیف پول", payer: "buyer" },
  { key: "wallet.payout", label: "تسویهٔ دستی سازنده", payer: "creator" },
  { key: "plan.subscription", label: "اشتراک پلن", payer: "buyer" },
] as const;
export class TariffError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
const keyPattern = /^[a-z][a-z0-9_.-]{0,79}$/;
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TariffError("invalid_configuration");
  return value as Record<string, unknown>;
}
function exactKeys(value: Record<string, unknown>, allowed: string[]) {
  if (Object.keys(value).some(key => !allowed.includes(key))) throw new TariffError("unknown_configuration_field");
}
function label(value: unknown, max: number): string {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max || /[\u0000-\u001f\u007f]/.test(value)) throw new TariffError("invalid_label");
  return value.trim();
}
export function assertFinanceKey(value: unknown): string {
  if (typeof value !== "string" || !keyPattern.test(value)) throw new TariffError("invalid_finance_key");
  return value;
}
export function normalizePlanDraft(value: unknown): FinancePlanDraft {
  const raw = object(value);
  exactKeys(raw, ["key", "name", "currency", "rounding", "refundPolicy", "tariffs"]);
  if (raw.currency !== "IRR") throw new TariffError("currency_must_be_IRR");
  if (!FEE_ROUNDING_MODES.includes(raw.rounding as FeeRounding)) throw new TariffError("rounding_required");
  if (raw.refundPolicy !== "before_delivery_only") throw new TariffError("refund_policy_not_enabled");
  if (!Array.isArray(raw.tariffs) || raw.tariffs.length > 200) throw new TariffError("invalid_tariff_list");
  const seen = new Set<string>();
  const tariffs = raw.tariffs.map((value): Tariff => {
    const item = object(value), key = assertFinanceKey(item.key);
    if (seen.has(key)) throw new TariffError("duplicate_tariff_key");
    seen.add(key);
    if (typeof item.enabled !== "boolean" || !["buyer", "creator", "platform"].includes(String(item.payer))) throw new TariffError("invalid_tariff");
    const base: TariffBase = { key, label: label(item.label, 120), enabled: item.enabled, payer: item.payer as TariffPayer };
    const common = ["key", "label", "enabled", "payer", "mode"];
    if (item.mode === "free") { exactKeys(item, common); return { ...base, mode: "free" }; }
    if (item.mode === "fixed") {
      exactKeys(item, [...common, "amountIRR"]);
      if (typeof item.amountIRR !== "string" || !/^(0|[1-9]\d{0,29})$/.test(item.amountIRR)) throw new TariffError("invalid_IRR_integer_string");
      return { ...base, mode: "fixed", amountIRR: item.amountIRR };
    }
    if (item.mode === "percentage") {
      exactKeys(item, [...common, "basisPoints", "basis"]);
      if (!Number.isInteger(item.basisPoints) || Number(item.basisPoints) < 0 || Number(item.basisPoints) > 10000 || item.basis !== "pre_discount") throw new TariffError("invalid_percentage_tariff");
      return { ...base, mode: "percentage", basisPoints: item.basisPoints as number, basis: "pre_discount" };
    }
    throw new TariffError("unsupported_tariff_mode");
  }).sort((a, b) => a.key < b.key ? -1 : a.key > b.key ? 1 : 0);
  return { key: assertFinanceKey(raw.key), name: label(raw.name, 120), currency: "IRR", rounding: raw.rounding as FeeRounding, refundPolicy: "before_delivery_only", tariffs };
}
/** Canonical snapshot for hashing. Different input key order must not change the digest. */
export function serializePlanDraft(value: unknown): string { return JSON.stringify(normalizePlanDraft(value)); }
export function quoteConfiguredTariff(draft: FinancePlanDraft, tariffKey: string, preDiscountIRR?: bigint) {
  const plan = normalizePlanDraft(draft), key = assertFinanceKey(tariffKey);
  const tariff = plan.tariffs.find(row => row.key === key);
  if (!tariff) throw new TariffError("tariff_not_configured", 409);
  if (!tariff.enabled) throw new TariffError("tariff_disabled", 409);
  let amountIRR: bigint;
  if (tariff.mode === "free") amountIRR = BigInt(0);
  else if (tariff.mode === "fixed") amountIRR = BigInt(tariff.amountIRR);
  else {
    if (typeof preDiscountIRR !== "bigint" || preDiscountIRR < BigInt(0)) throw new TariffError("pre_discount_basis_required");
    amountIRR = calculateCommissionFee(preDiscountIRR, tariff.basisPoints, plan.rounding);
  }
  return { planKey: plan.key, tariffKey: key, currency: "IRR" as const, payer: tariff.payer, mode: tariff.mode, amountIRR, rounding: plan.rounding };
}
/** This is a form template, not a saved price list or permission to charge. */
export function emptyPlanDraft(): FinancePlanDraft {
  return { key: "standard", name: "پلن پایه", currency: "IRR", rounding: "reject_fraction", refundPolicy: "before_delivery_only", tariffs: [] };
}
