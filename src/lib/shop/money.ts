import { financeMoney } from "@/lib/finance/types";

export function formatMoney(amount: number, currency = "IRR"): string {
  if (!Number.isInteger(amount)) return "—";
  return financeMoney(amount, currency);
}
