import type { FinanceMode, FinanceQuery } from "./types";
import { parseFinanceQuery } from "./types";

export function flatSearchParams(input: Record<string, string | string[] | undefined>): Record<string, string | undefined> {
  return Object.fromEntries(
    Object.entries(input).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]),
  );
}

const periods = new Set(["month", "previous", "all", "custom"]);

export function financeQueryFromSearch(
  raw: Record<string, string | undefined>,
  mode: FinanceMode,
): { query: FinanceQuery; error: string | null } {
  try {
    return { query: parseFinanceQuery(raw, mode), error: null };
  } catch (error) {
    const period = periods.has(raw.period || "") ? (raw.period as FinanceQuery["period"]) : "custom";
    return {
      error: error instanceof Error ? error.message : "invalid_filter",
      query: {
        period,
        from: raw.from?.trim() || "",
        to: raw.to?.trim() || "",
        start: null,
        end: null,
        state: mode === "report" ? "settled" : "all",
        basis: mode === "report" ? "settled" : "created",
        product: (raw.product || "").trim().slice(0, 128),
        currency: (raw.currency || "").trim().slice(0, 8),
        q: (raw.q || "").trim().slice(0, 80),
        page: 1,
      },
    };
  }
}
