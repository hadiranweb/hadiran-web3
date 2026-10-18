export type DataSource = "live" | "preview" | "unavailable" | "error";
export const personalKinds = ["orders", "inProgress", "reports"] as const;
export type PersonalKind = typeof personalKinds[number];
export type PersonalItem = { key: string; kind: PersonalKind; title: string; href: string | null; status: string; updatedAt: string | null; amount?: number; currency?: string };
export type PersonalSnapshot = { source: DataSource; asOf: string | null; counts: Record<PersonalKind, number | null>; items: PersonalItem[]; filter: PersonalKind | null; page: number; pageSize: number };
export const deskFilters = ["all", "drafts", "responses", "mine"] as const;
export type DeskFilter = typeof deskFilters[number];
export type DeskItem = { slug: string; title: string; status: string; updatedAt: string; mine: boolean; edit: boolean; responses: boolean; grant: boolean };
export type DeskSnapshot = { source: DataSource; asOf: string | null; counts: Record<DeskFilter, number | null>; items: DeskItem[]; filter: DeskFilter; page: number; pageSize: number };
export function personalKind(value: unknown): PersonalKind | null {
  return typeof value === "string" && personalKinds.includes(value as PersonalKind) ? value as PersonalKind : null;
}
export function deskFilter(value: unknown): DeskFilter {
  return typeof value === "string" && deskFilters.includes(value as DeskFilter) ? value as DeskFilter : "all";
}
