/** Pure publication-state helpers; a saved draft never withdraws the live snapshot. */

function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, stable(item)]),
    );
  }
  return value;
}

export function hasUnpublishedDraft(draftData: unknown, publishedData: unknown): boolean {
  if (publishedData === null || publishedData === undefined) return false;
  return JSON.stringify(stable(draftData)) !== JSON.stringify(stable(publishedData));
}

export function statusAfterSavingDraft(currentStatus: string, publishedData: unknown): string {
  if (currentStatus === "archived") return "archived";
  return publishedData !== null && publishedData !== undefined ? "published" : "draft";
}
