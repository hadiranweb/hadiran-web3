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

/**
 * Seed فقط جایگزین draft خالیِ تازه‌ساخته/دست‌نخورده می‌شود؛ draft خالیِ ذخیره‌شدهٔ صاحب صفحه محفوظ است.
 * زمان‌های ایجاد و به‌روزرسانی برای ردیف تازه به‌طور معمول یکسان‌اند.
 */
export function canSeedUnmodifiedEmptyDraft(
  draftData: unknown,
  createdAt: Date | string | null | undefined,
  updatedAt: Date | string | null | undefined,
): boolean {
  if (!draftData || typeof draftData !== "object" || !Array.isArray((draftData as { content?: unknown }).content)) return false;
  if ((draftData as { content: unknown[] }).content.length !== 0) return false;
  const created = createdAt instanceof Date ? createdAt.getTime() : typeof createdAt === "string" ? new Date(createdAt).getTime() : NaN;
  const updated = updatedAt instanceof Date ? updatedAt.getTime() : typeof updatedAt === "string" ? new Date(updatedAt).getTime() : NaN;
  return Number.isFinite(created) && Number.isFinite(updated) && updated === created;
}
