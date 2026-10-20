import { ORDER_STATES, type OrderState } from "@/lib/shop/states";
import { reportPeriod, type ReportPeriod } from "./period";

export type FinanceQuery = ReportPeriod & {
  state: OrderState | "all";
  basis: "created" | "settled";
  product: string;
  currency: string;
  q: string;
  page: number;
};

export type FinanceMode = "orders" | "report" | "personal";

export function parseFinanceQuery(input: Record<string, string | undefined>, mode: FinanceMode, now?: Date): FinanceQuery {
  const state = mode === "report" ? "settled" : input.state || "all";
  if (state !== "all" && !ORDER_STATES.includes(state as OrderState)) throw new Error("invalid_state");
  const basis = mode === "report" ? "settled" : input.basis || "created";
  if (!["created", "settled"].includes(basis)) throw new Error("invalid_basis");
  const q = input.q?.trim() || "";
  const product = input.product?.trim() || "";
  if (q.length > 80 || product.length > 128) throw new Error("invalid_filter");
  const currency = input.currency?.trim() || "";
  if (currency && !/^[A-Z]{3,8}$/.test(currency)) throw new Error("invalid_currency");
  const page = input.page || "1";
  if (!/^\d+$/.test(page) || Number(page) < 1 || Number(page) > 10000) throw new Error("invalid_page");
  return {
    ...reportPeriod(input, now),
    state: state as FinanceQuery["state"],
    basis: basis as FinanceQuery["basis"],
    product,
    currency,
    q,
    page: Number(page),
  };
}

export function financeHref(path: string, query: FinanceQuery, patch: Partial<FinanceQuery> = {}) {
  const value = { ...query, ...patch };
  const params = new URLSearchParams({ period: value.period, state: value.state, basis: value.basis, page: String(value.page) });
  if (value.period === "custom") {
    params.set("from", value.from);
    params.set("to", value.to);
  }
  if (value.currency) params.set("currency", value.currency);
  if (value.product) params.set("product", value.product);
  if (value.q) params.set("q", value.q);
  return `${path}?${params}`;
}

export function financeMoney(amount: string | number | null, currency: string, locale = "fa"): string {
  if (amount == null || (typeof amount === "number" && !Number.isSafeInteger(amount)) || !/^-?\d+$/.test(String(amount))) {
    return "—";
  }
  const integer = BigInt(amount);
  const lang = locale === "fa" ? "fa-IR" : "en-US";
  if (currency !== "IRR") return `${integer.toLocaleString(lang)} ${currency}`;
  const negative = integer < BigInt(0);
  const absolute = negative ? -integer : integer;
  const whole = absolute / BigInt(10);
  const remainder = absolute % BigInt(10);
  const decimal = remainder ? `${locale === "fa" ? "٫" : "."}${remainder.toLocaleString(lang)}` : "";
  return `${negative ? "−" : ""}${whole.toLocaleString(lang)}${decimal} ${locale === "fa" ? "تومان" : "toman"}`;
}

export type FinanceRow = {
  id: string;
  title: string;
  product: string;
  buyer: string;
  state: string;
  amount: string;
  currency: string;
  discount: string;
  original: string | null;
  createdAt: string | null;
  settledAt: string | null;
  entitled: boolean;
};

export type FinanceSnapshot = {
  source: "live" | "unavailable" | "error";
  asOf: string | null;
  mode: FinanceMode;
  query: FinanceQuery;
  timeZone: "Asia/Tehran";
  total: number | null;
  pageSize: number;
  rows: FinanceRow[];
  stateCounts: Record<string, number> | null;
  totals: { currency: string; amount: string; discount: string; count: number; href: string }[];
  undatedSettled: number | null;
};
