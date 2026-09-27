export const ORDER_STATES = [
  "awaiting_payment_reference",
  "awaiting_confirmation",
  "settled",
  "declined",
  "cancelled",
] as const;

export type OrderState = (typeof ORDER_STATES)[number];

export const OPEN_ORDER_STATES: OrderState[] = [
  "awaiting_payment_reference",
  "awaiting_confirmation",
  "declined",
];

export function orderStateFa(state: string): string {
  const map: Record<string, string> = {
    awaiting_payment_reference: "در انتظار شمارهٔ پیگیری",
    awaiting_confirmation: "در انتظار تأیید فروشنده",
    settled: "تسویه‌شده — دسترسی باز است",
    declined: "دریافت تأیید نشد",
    cancelled: "لغو شده",
  };
  return map[state] || state;
}
