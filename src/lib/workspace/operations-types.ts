export const actionKinds = ["orders", "notes", "collaborations", "analyzers", "bots"] as const;
export type ActionKind = (typeof actionKinds)[number];

export type OperationalItem = {
  key: string;
  kind: ActionKind;
  title: string;
  href: string;
  updatedAt: string | null;
  amount?: number;
  currency?: string;
};

export type OperationalSnapshot = {
  source: "live" | "unavailable" | "error";
  asOf: string | null;
  counts: Record<ActionKind, number | null>;
  actions: OperationalItem[];
  recent: OperationalItem[];
  filter: ActionKind | null;
  page: number;
  pageSize: number;
};

export function parseActionKind(value: unknown): ActionKind | null {
  return typeof value === "string" && actionKinds.includes(value as ActionKind) ? (value as ActionKind) : null;
}

export function parseActionPage(value: unknown): number {
  const page = typeof value === "string" ? Number(value) : 1;
  return Number.isSafeInteger(page) && page >= 1 && page <= 10000 ? page : 1;
}
