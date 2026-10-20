export type DataSource = "live" | "unavailable" | "error";

export const deskFilters = ["all", "drafts", "responses", "mine"] as const;
export type DeskFilter = (typeof deskFilters)[number];

export type DeskItem = {
  slug: string;
  title: string;
  status: string;
  updatedAt: string;
  mine: boolean;
  edit: boolean;
  responses: boolean;
  grant: boolean;
};

export type DeskSnapshot = {
  source: DataSource;
  asOf: string | null;
  counts: Record<DeskFilter, number | null>;
  items: DeskItem[];
  filter: DeskFilter;
  page: number;
  pageSize: number;
};

export function deskFilter(value: unknown): DeskFilter {
  return typeof value === "string" && deskFilters.includes(value as DeskFilter) ? (value as DeskFilter) : "all";
}

export function deskPage(value: unknown): number {
  const page = typeof value === "string" ? Number(value) : 1;
  return Number.isSafeInteger(page) && page >= 1 && page <= 10000 ? page : 1;
}
