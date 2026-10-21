import "server-only";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db, hasDatabaseUrl } from "@/db";
import { contentRevision, siteCopy } from "@/db/schema";
import {
  COPY_FIELDS,
  COPY_GROUPS,
  defaultValue,
  FIELD_BY_KEY,
  fieldsOfGroup,
  normalizeCopyValue,
  type CopyField,
  type CopyGroup,
} from "./registry";
import type { CopyDeskSource, CopyEntry, GroupSummary, HistoryRow } from "./types";

export type { CopyDeskSource, CopyEntry, GroupSummary, HistoryRow };

/** دادهٔ میز متن: پیش‌فرض + پیش‌نویس + زنده + شمار نسخه. DB اجباری است. */


function toEntry(field: CopyField, row?: typeof siteCopy.$inferSelect): CopyEntry {
  const fallback = defaultValue(field.key) ?? "";
  const live = row?.liveValue?.trim() ? row.liveValue : null;
  const draft = row?.draftValue?.trim() ? row.draftValue : null;
  return {
    key: field.key,
    group: field.group,
    label: field.label,
    hint: field.hint,
    maxLength: field.maxLength,
    multiline: Boolean(field.multiline),
    usedAt: field.usedAt,
    fallback,
    live,
    draft,
    revision: row?.liveRevision ?? 0,
    updatedAt: row?.updatedAt ? row.updatedAt.toISOString() : null,
    publishedAt: row?.publishedAt ? row.publishedAt.toISOString() : null,
    note: row?.draftNote ?? null,
  };
}

async function rowsFor(keys: string[]) {
  if (!keys.length) return [] as (typeof siteCopy.$inferSelect)[];
  return db
    .select()
    .from(siteCopy)
    .where(and(eq(siteCopy.locale, "fa"), inArray(siteCopy.key, keys)));
}

export async function loadCopyGroup(
  group: CopyGroup,
): Promise<{ source: CopyDeskSource; entries: CopyEntry[] }> {
  const fields = fieldsOfGroup(group);
  if (!hasDatabaseUrl()) {
    return { source: "error", entries: fields.map((field) => toEntry(field)) };
  }
  try {
    const rows = await rowsFor(fields.map((field) => field.key));
    const byKey = new Map(rows.map((row) => [row.key, row]));
    return { source: "live", entries: fields.map((field) => toEntry(field, byKey.get(field.key))) };
  } catch {
    return { source: "error", entries: fields.map((field) => toEntry(field)) };
  }
}

export async function loadCopyOverview(): Promise<{ source: CopyDeskSource; groups: GroupSummary[] }> {
  const empty: GroupSummary[] = COPY_GROUPS.map((group) => ({
    group,
    total: fieldsOfGroup(group).length,
    overrides: 0,
    drafts: 0,
  }));
  if (!hasDatabaseUrl()) return { source: "error", groups: empty };
  try {
    const rows = await db
      .select({
        key: siteCopy.key,
        liveValue: siteCopy.liveValue,
        draftValue: siteCopy.draftValue,
      })
      .from(siteCopy)
      .where(eq(siteCopy.locale, "fa"));
    const byKey = new Map(rows.map((row) => [row.key, row]));
    return {
      source: "live",
      groups: COPY_GROUPS.map((group) => {
        const fields = fieldsOfGroup(group);
        let overrides = 0;
        let drafts = 0;
        for (const field of fields) {
          const row = byKey.get(field.key);
          if (row?.liveValue?.trim()) overrides += 1;
          if (row?.draftValue?.trim()) drafts += 1;
        }
        return { group, total: fields.length, overrides, drafts };
      }),
    };
  } catch {
    return { source: "error", groups: empty };
  }
}

export type SaveResult =
  | { ok: true; saved: number }
  | { ok: false; status: number; error: string };

export async function saveCopyDrafts(
  actorId: number | null,
  input: { values: Record<string, unknown>; note?: string | null },
): Promise<SaveResult> {
  const entries = Object.entries(input.values ?? {});
  if (!entries.length) return { ok: false, status: 400, error: "چیزی برای ذخیره نبود." };
  const clean: { key: string; value: string }[] = [];
  for (const [key, raw] of entries) {
    const field = FIELD_BY_KEY.get(key);
    if (!field) return { ok: false, status: 400, error: `کلید ناشناخته: ${key}` };
    const normalized = normalizeCopyValue(field, raw);
    if (!normalized.ok) return { ok: false, status: 400, error: `${field.label}: ${normalized.error}` };
    clean.push({ key, value: normalized.value });
  }
  const note = typeof input.note === "string" ? input.note.trim().slice(0, 280) || null : null;
  try {
    await db.transaction(async (tx) => {
      for (const item of clean) {
        await tx
          .insert(siteCopy)
          .values({
            key: item.key,
            locale: "fa",
            draftValue: item.value,
            draftNote: note,
            updatedBy: actorId,
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: [siteCopy.key, siteCopy.locale],
            set: {
              draftValue: item.value,
              draftNote: note,
              updatedBy: actorId,
              updatedAt: new Date(),
            },
          });
      }
    });
    return { ok: true, saved: clean.length };
  } catch {
    return { ok: false, status: 500, error: "ذخیره نشد؛ اتصال DB را بررسی کن." };
  }
}

export type PublishResult =
  | { ok: true; published: string[] }
  | { ok: false; status: number; error: string; conflicts?: string[] };

export async function publishCopy(
  actorId: number | null,
  input: { keys?: string[]; revisions?: Record<string, number>; note?: string | null },
): Promise<PublishResult> {
  const keys = (input.keys ?? []).filter((key) => FIELD_BY_KEY.has(key));
  if (!keys.length) return { ok: false, status: 400, error: "کلیدی برای انتشار نبود." };
  const note = typeof input.note === "string" ? input.note.trim().slice(0, 280) : "";
  if (!note) return { ok: false, status: 400, error: "یادداشت تغییر اجباری است." };
  const revisions = input.revisions ?? {};
  const conflicts: string[] = [];
  const published: string[] = [];
  try {
    await db.transaction(async (tx) => {
      const rows = await tx
        .select()
        .from(siteCopy)
        .where(and(eq(siteCopy.locale, "fa"), inArray(siteCopy.key, keys)));
      const byKey = new Map(rows.map((row) => [row.key, row]));
      for (const key of keys) {
        const row = byKey.get(key);
        if (!row) continue;
        const expected = revisions[key];
        if (typeof expected === "number" && expected !== row.liveRevision) {
          conflicts.push(key);
          continue;
        }
        if (row.draftValue == null) continue;
        const nextRevision = row.liveRevision + 1;
        await tx
          .update(siteCopy)
          .set({
            liveValue: row.draftValue,
            liveRevision: nextRevision,
            draftValue: null,
            draftNote: null,
            publishedBy: actorId,
            publishedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(siteCopy.id, row.id));
        await tx.insert(contentRevision).values({
          entity: "site_copy",
          entityKey: key,
          revision: nextRevision,
          snapshot: { fa: row.draftValue },
          note,
          actorId,
        });
        published.push(key);
      }
      if (conflicts.length) throw new ConflictError();
    });
  } catch (error) {
    if (error instanceof ConflictError) {
      return {
        ok: false,
        status: 409,
        error: "کسی دیگر این متن را عوض کرده؛ صفحه را تازه کن و دوباره ببین.",
        conflicts,
      };
    }
    return { ok: false, status: 500, error: "انتشار نشد؛ اتصال DB را بررسی کن." };
  }
  if (!published.length) return { ok: false, status: 400, error: "پیش‌نویسی برای انتشار نبود." };
  return { ok: true, published };
}

export async function revertCopy(
  actorId: number | null,
  input: { key: string; note?: string | null },
): Promise<SaveResult> {
  const field = FIELD_BY_KEY.get(input.key);
  if (!field) return { ok: false, status: 400, error: "کلید ناشناخته." };
  const note = typeof input.note === "string" ? input.note.trim().slice(0, 280) : "";
  if (!note) return { ok: false, status: 400, error: "یادداشت تغییر اجباری است." };
  try {
    await db.transaction(async (tx) => {
      const [row] = await tx
        .select()
        .from(siteCopy)
        .where(and(eq(siteCopy.locale, "fa"), eq(siteCopy.key, field.key)))
        .limit(1);
      const nextRevision = (row?.liveRevision ?? 0) + 1;
      await tx
        .update(siteCopy)
        .set({
          liveValue: null,
          draftValue: null,
          draftNote: null,
          liveRevision: nextRevision,
          updatedBy: actorId,
          publishedBy: actorId,
          publishedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(siteCopy.id, row?.id ?? -1));
      await tx.insert(contentRevision).values({
        entity: "site_copy",
        entityKey: field.key,
        revision: nextRevision,
        snapshot: { fa: null, revertedTo: "default" },
        note,
        actorId,
      });
    });
    return { ok: true, saved: 1 };
  } catch {
    return { ok: false, status: 500, error: "بازگشت انجام نشد." };
  }
}

/** بازگردانی: یک نسخهٔ قدیمی را به‌عنوان رویداد تازه منتشر می‌کند. */
export async function restoreCopyVersion(
  actorId: number | null,
  input: { key: string; revision: number; note?: string | null },
): Promise<SaveResult> {
  const field = FIELD_BY_KEY.get(input.key);
  if (!field) return { ok: false, status: 400, error: "کلید ناشناخته." };
  const note = typeof input.note === "string" ? input.note.trim().slice(0, 280) : "";
  if (!note) return { ok: false, status: 400, error: "یادداشت تغییر اجباری است." };
  try {
    const result = await db.transaction(async (tx) => {
      const [old] = await tx
        .select()
        .from(contentRevision)
        .where(
          and(
            eq(contentRevision.entity, "site_copy"),
            eq(contentRevision.entityKey, field.key),
            eq(contentRevision.revision, input.revision),
          ),
        )
        .limit(1);
      if (!old) return { ok: false as const, status: 404, error: "این نسخه پیدا نشد." };
      const snapshot = old.snapshot as { fa?: string | null };
      const normalized = normalizeCopyValue(field, snapshot.fa ?? "");
      if (!normalized.ok) return { ok: false as const, status: 400, error: normalized.error };
      const [row] = await tx
        .select()
        .from(siteCopy)
        .where(and(eq(siteCopy.locale, "fa"), eq(siteCopy.key, field.key)))
        .limit(1);
      const nextRevision = (row?.liveRevision ?? 0) + 1;
      await tx
        .update(siteCopy)
        .set({
          liveValue: normalized.value,
          liveRevision: nextRevision,
          draftValue: null,
          draftNote: null,
          updatedBy: actorId,
          publishedBy: actorId,
          publishedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(siteCopy.id, row?.id ?? -1));
      await tx.insert(contentRevision).values({
        entity: "site_copy",
        entityKey: field.key,
        revision: nextRevision,
        snapshot: { fa: normalized.value, restoredFrom: input.revision },
        note,
        actorId,
      });
      return { ok: true as const, saved: 1 };
    });
    return result;
  } catch {
    return { ok: false, status: 500, error: "بازگردانی انجام نشد." };
  }
}

class ConflictError extends Error {}


export async function loadCopyHistory(key: string, limit = 12): Promise<HistoryRow[]> {
  if (!FIELD_BY_KEY.has(key) || !hasDatabaseUrl()) return [];
  try {
    const rows = await db
      .select()
      .from(contentRevision)
      .where(and(eq(contentRevision.entity, "site_copy"), eq(contentRevision.entityKey, key)))
      .orderBy(desc(contentRevision.revision))
      .limit(limit);
    return rows.map((row) => ({
      revision: row.revision,
      snapshot: row.snapshot,
      note: row.note,
      at: row.createdAt ? row.createdAt.toISOString() : null,
      actorId: row.actorId,
    }));
  } catch {
    return [];
  }
}

export const COPY_TOTAL = COPY_FIELDS.length;
