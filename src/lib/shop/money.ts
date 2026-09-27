export function formatMoney(amount: number, currency = "IRR"): string {
  const unit = currency === "IRR" ? "ریال" : currency;
  return `${amount.toLocaleString("fa-IR")} ${unit}`;
}
