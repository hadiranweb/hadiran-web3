/** ذخیره‌سازی صفحه‌های استودیو؛ Fail-soft وقتی جدول ساخته نشده یا DB نیست. */
import { desc, eq } from "drizzle-orm";
import { db, hasDatabaseUrl } from "@/db";
import { studioPageVersions, studioPages } from "@/db/schema";
import { validateStudioData, type StudioData } from "./validate";
import { siteSlug, siteTarget } from "./site-pages";
import { statusAfterSavingDraft } from "./publication-state";

export function studioEnabled(): boolean {
  return process.env.HADIRAN_STUDIO_ENABLED === "true";
}

export type StudioPageRow = typeof studioPages.$inferSelect;

function ready(): boolean {
  return studioEnabled() && hasDatabaseUrl();
}

export async function listStudioPages(): Promise<{ ready: boolean; pages: StudioPageRow[] }> {
  if (!ready()) return { ready: false, pages: [] };
  try {
    const pages = await db.select().from(studioPages).orderBy(desc(studioPages.updatedAt));
    return { ready: true, pages };
  } catch {
    return { ready: false, pages: [] };
  }
}

export async function getStudioPage(id: string): Promise<StudioPageRow | null> {
  if (!ready()) return null;
  try {
    const [row] = await db.select().from(studioPages).where(eq(studioPages.id, id)).limit(1);
    return row ?? null;
  } catch {
    return null;
  }
}

export async function createStudioPage(input: {
  slug: string;
  titleFa: string;
  ownerId: number | null;
  target?: string;
}): Promise<StudioPageRow | null> {
  if (!ready()) return null;
  const id = crypto.randomUUID();
  try {
    const [row] = await db
      .insert(studioPages)
      .values({ id, slug: input.slug, titleFa: input.titleFa, ownerId: input.ownerId, target: input.target ?? "standalone" })
      .returning();
    return row ?? null;
  } catch {
    return null;
  }
}

export async function getStudioPageByTarget(target: string): Promise<StudioPageRow | null> {
  if (!ready()) return null;
  try {
    const [row] = await db.select().from(studioPages).where(eq(studioPages.target, target)).limit(1);
    return row ?? null;
  } catch {
    return null;
  }
}

/**
 * صفحهٔ استودیویی متناظر یک صفحهٔ سایت را برمی‌گرداند و اگر نبود می‌سازد.
 * اسلاگ داخلی است (`site-<key>`)؛ مسیر عمومی همان مسیر واقعی سایت است.
 */
export async function ensureSiteStudioPage(
  def: { key: string; titleFa: string },
  ownerId: number | null,
): Promise<StudioPageRow | null> {
  if (!ready()) return null;
  const existing = await getStudioPageByTarget(siteTarget(def.key));
  if (existing) return existing;
  return createStudioPage({
    slug: siteSlug(def.key),
    titleFa: def.titleFa,
    ownerId,
    target: siteTarget(def.key),
  });
}

export async function saveStudioDraft(
  id: string,
  input: { titleFa?: string; slug?: string; draft: StudioData; seo: Record<string, unknown> },
): Promise<boolean> {
  if (!ready()) return false;
  try {
    return await db.transaction(async (tx) => {
      const [existing] = await tx
        .select({ status: studioPages.status, publishedData: studioPages.publishedData })
        .from(studioPages)
        .where(eq(studioPages.id, id))
        .for("update")
        .limit(1);
      if (!existing) return false;
      // قفل ردیف و حفظ status، انتشار هم‌زمان را از unpublish شدن ناخواسته حفظ می‌کند.
      const status = statusAfterSavingDraft(existing.status, existing.publishedData);
      const updated = await tx
        .update(studioPages)
        .set({
          ...(input.titleFa !== undefined ? { titleFa: input.titleFa } : {}),
          ...(input.slug !== undefined ? { slug: input.slug } : {}),
          draftData: input.draft as unknown as Record<string, unknown>,
          seo: input.seo,
          status,
          updatedAt: new Date(),
        })
        .where(eq(studioPages.id, id))
        .returning({ id: studioPages.id });
      return updated.length > 0;
    });
  } catch {
    return false;
  }
}

export type StudioPublishInput = {
  titleFa?: string;
  slug?: string;
  draft?: StudioData;
  seo?: Record<string, unknown>;
};

/**
 * انتشار اتمیک: قفل صفحه، اعتبارسنجی ترکیب، ثبت snapshot و جابه‌جایی publishedData
 * در یک تراکنش. اگر ورودی تازه نرسد، draft ذخیره‌شدهٔ قبلی منتشر می‌شود.
 */
export async function publishStudioPage(
  id: string,
  actorId: number | null,
  input?: StudioPublishInput,
): Promise<{ ok: boolean; version?: number; error?: string }> {
  if (!ready()) return { ok: false, error: "not_ready" };
  try {
    return await db.transaction(async (tx) => {
      const [page] = await tx.select().from(studioPages).where(eq(studioPages.id, id)).for("update").limit(1);
      if (!page) return { ok: false, error: "not_found" };
      const clean = validateStudioData(input?.draft ?? page.draftData, { target: page.target, forPublish: true });
      if (!clean) return { ok: false, error: "invalid_composition" };
      const titleFa = input?.titleFa?.trim().slice(0, 256) || page.titleFa;
      const slug = page.target === "standalone" ? input?.slug ?? page.slug : page.slug;
      const seo = input?.seo ?? page.seo;
      const versions = await tx
        .select({ version: studioPageVersions.version })
        .from(studioPageVersions)
        .where(eq(studioPageVersions.pageId, id))
        .orderBy(desc(studioPageVersions.version))
        .limit(1);
      const nextVersion = (versions[0]?.version ?? 0) + 1;
      const now = new Date();
      const updated = await tx
        .update(studioPages)
        .set({
          titleFa,
          slug,
          draftData: clean as unknown as Record<string, unknown>,
          publishedData: clean as unknown as Record<string, unknown>,
          seo,
          status: "published",
          publishedAt: now,
          updatedAt: now,
        })
        .where(eq(studioPages.id, id))
        .returning({ id: studioPages.id });
      if (!updated.length) return { ok: false, error: "not_found" };
      await tx.insert(studioPageVersions).values({
        id: crypto.randomUUID(),
        pageId: id,
        version: nextVersion,
        data: clean as unknown as Record<string, unknown>,
        createdBy: actorId,
      });
      return { ok: true, version: nextVersion };
    });
  } catch {
    return { ok: false, error: "publish_failed" };
  }
}

export async function archiveStudioPage(id: string): Promise<boolean> {
  if (!ready()) return false;
  try {
    await db
      .update(studioPages)
      .set({ status: "archived", updatedAt: new Date() })
      .where(eq(studioPages.id, id));
    return true;
  } catch {
    return false;
  }
}

export async function duplicateStudioPage(id: string, actorId: number | null): Promise<StudioPageRow | null> {
  if (!ready()) return null;
  const page = await getStudioPage(id);
  if (!page) return null;
  const source = validateStudioData(page.draftData, { target: page.target });
  const draftData: StudioData = {
    content: (source?.content ?? []).filter(
      (block) => !["HadiranHomeHero", "SignInPanel", "AccountPanel"].includes(block.type),
    ),
    root: source?.root ?? { props: { title: "" } },
  };
  return createStudioPage({
    slug: `${page.slug}-copy`.slice(0, 128),
    titleFa: `${page.titleFa} — رونوشت`,
    ownerId: actorId,
  }).then(async (copy) => {
    if (!copy) return null;
    try {
      await db
        .update(studioPages)
        .set({ draftData: draftData as unknown as Record<string, unknown>, seo: page.seo, updatedAt: new Date() })
        .where(eq(studioPages.id, copy.id));
      return { ...copy, draftData: draftData as unknown as Record<string, unknown>, seo: page.seo };
    } catch {
      return copy;
    }
  });
}

/** فقط نسخهٔ منتشرشده برای یک target (مثلاً `site:home`)؛ پیش‌نویس هرگز برنمی‌گردد. */
export async function getPublishedByTarget(target: string): Promise<StudioPageRow | null> {
  if (!studioEnabled() || !hasDatabaseUrl()) return null;
  try {
    const [row] = await db
      .select()
      .from(studioPages)
      .where(eq(studioPages.target, target))
      .limit(1);
    if (!row || row.status !== "published" || !row.publishedData) return null;
    return row;
  } catch {
    return null;
  }
}

/** فقط نسخهٔ منتشرشده برای سایت عمومی؛ پیش‌نویس هرگز از این مسیر برنمی‌گردد. */
export async function getPublishedBySlug(slug: string): Promise<StudioPageRow | null> {
  if (!studioEnabled() || !hasDatabaseUrl()) return null;
  try {
    const [row] = await db
      .select()
      .from(studioPages)
      .where(eq(studioPages.slug, slug))
      .limit(1);
    if (!row || row.status !== "published" || !row.publishedData) return null;
    return row;
  } catch {
    return null;
  }
}
