import type { OrderState } from "@/lib/shop/states";

export type Localized = { fa: string; en: string };
export type SampleOrder = {
  code: string;
  product: Localized;
  buyer: Localized;
  amount: number;
  currency: "IRR";
  state: OrderState;
  createdAt: string;
  settledAt: string | null;
};

export const snapshotAt = "2026-10-19T09:30:00Z";
export const orders: SampleOrder[] = [
  { code: "S-1047", product: { fa: "بستهٔ شروع کسب‌وکار", en: "Business starter pack" }, buyer: { fa: "سارا نمونه", en: "Sara Sample" }, amount: 2400000, currency: "IRR", state: "awaiting_confirmation", createdAt: "2026-10-19T07:30:00Z", settledAt: null },
  { code: "S-1046", product: { fa: "کارگاه طراحی مسیر", en: "Path design workshop" }, buyer: { fa: "آرمان نمونه", en: "Arman Sample" }, amount: 1800000, currency: "IRR", state: "awaiting_confirmation", createdAt: "2026-10-18T11:00:00Z", settledAt: null },
  { code: "S-1045", product: { fa: "بستهٔ شروع کسب‌وکار", en: "Business starter pack" }, buyer: { fa: "نگار نمونه", en: "Negar Sample" }, amount: 2400000, currency: "IRR", state: "settled", createdAt: "2026-10-17T09:00:00Z", settledAt: "2026-10-18T08:00:00Z" },
  { code: "S-1044", product: { fa: "دفتر مسیر شخصی", en: "Personal path journal" }, buyer: { fa: "رضا نمونه", en: "Reza Sample" }, amount: 900000, currency: "IRR", state: "awaiting_payment_reference", createdAt: "2026-10-16T10:00:00Z", settledAt: null },
  { code: "S-1043", product: { fa: "کارگاه طراحی مسیر", en: "Path design workshop" }, buyer: { fa: "لیلا نمونه", en: "Leila Sample" }, amount: 1800000, currency: "IRR", state: "declined", createdAt: "2026-10-15T12:00:00Z", settledAt: null },
  { code: "S-1042", product: { fa: "دفتر مسیر شخصی", en: "Personal path journal" }, buyer: { fa: "مهران نمونه", en: "Mehran Sample" }, amount: 900000, currency: "IRR", state: "cancelled", createdAt: "2026-10-12T08:00:00Z", settledAt: null },
  { code: "S-1041", product: { fa: "دفتر مسیر شخصی", en: "Personal path journal" }, buyer: { fa: "آوا نمونه", en: "Ava Sample" }, amount: 900000, currency: "IRR", state: "settled", createdAt: "2026-09-25T08:00:00Z", settledAt: "2026-09-26T08:00:00Z" },
];

export const stateLabels: Record<OrderState, Localized> = {
  awaiting_confirmation: { fa: "منتظر تأیید", en: "Needs confirmation" },
  awaiting_payment_reference: { fa: "منتظر پیگیری", en: "Awaiting reference" },
  settled: { fa: "تسویه‌شده", en: "Settled" },
  declined: { fa: "تأییدنشده", en: "Declined" },
  cancelled: { fa: "لغوشده", en: "Cancelled" },
};

export type SampleMember = { code: string; name: Localized; parent: string | null; level: number };
export const members: SampleMember[] = [
  { code: "10000001", name: { fa: "ریشهٔ نمونه", en: "Sample root" }, parent: null, level: 0 },
  { code: "10000002", name: { fa: "سارا", en: "Sara" }, parent: "10000001", level: 1 },
  { code: "10000003", name: { fa: "آرمان", en: "Arman" }, parent: "10000001", level: 1 },
  { code: "10000004", name: { fa: "نگار", en: "Negar" }, parent: "10000002", level: 2 },
  { code: "10000005", name: { fa: "رضا", en: "Reza" }, parent: "10000002", level: 2 },
  { code: "10000006", name: { fa: "لیلا", en: "Leila" }, parent: "10000003", level: 2 },
  { code: "10000007", name: { fa: "آوا", en: "Ava" }, parent: "10000003", level: 2 },
];

export function filterOrders(state: string, query: string, days: number): SampleOrder[] {
  const cutoff = Date.parse(snapshotAt) - days * 86400000;
  const search = query.trim().toLocaleLowerCase();
  return orders.filter((order) => (state === "all" || order.state === state)
    && Date.parse(order.createdAt) >= cutoff
    && `${order.code} ${order.product.fa} ${order.product.en} ${order.buyer.fa} ${order.buyer.en}`.toLocaleLowerCase().includes(search));
}

export function settledAmount(rows: SampleOrder[]): number {
  return rows.filter((order) => order.state === "settled").reduce((sum, order) => sum + order.amount, 0);
}
