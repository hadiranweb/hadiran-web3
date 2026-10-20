export type GardenPhase = "draft" | "review" | "published" | "archived";

export function gardenPhase(row: { status: string; promotedMemoryId?: string | null }): GardenPhase {
  if (row.status === "archived") return "archived";
  if (row.status === "pending_review") return "review";
  if (row.status === "published" || row.promotedMemoryId) return "published";
  return "draft";
}

export function gardenPhaseFa(phase: GardenPhase): string {
  if (phase === "review") return "در بازبینی";
  if (phase === "published") return "منتشرشده";
  if (phase === "archived") return "بایگانی";
  return "پیش‌نویس";
}

export function canDeleteDraft(row: { status: string; promotedMemoryId?: string | null }): boolean {
  return gardenPhase(row) === "draft";
}
