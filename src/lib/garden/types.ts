export type GardenNote = {
  slug: string;
  title: string;
  summary: string;
  body: string;
  excerpted: boolean;
  type: string;
  updatedAt: string | null;
  topics: { slug: string; label: string }[];
};
export type GardenSnapshot = {
  source: "live" | "unavailable" | "error";
  asOf: string | null;
  total: number | null;
  notes: GardenNote[];
  limit: number;
};
export function nextGardenIndex(length: number, previous: number | null, random: number): number | null {
  if (!Number.isSafeInteger(length) || length < 1) return null;
  if (length === 1) return 0;
  const value = Number.isFinite(random) ? Math.max(0, Math.min(.999999999, random)) : 0;
  const exclude = previous != null && Number.isSafeInteger(previous) && previous >= 0 && previous < length;
  const index = Math.floor(value * (exclude ? length - 1 : length));
  return exclude && index >= previous! ? index + 1 : index;
}
