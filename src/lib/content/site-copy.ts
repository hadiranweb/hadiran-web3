import "server-only";
import { unstable_cache } from "next/cache";
import { eq } from "drizzle-orm";
import { db, hasDatabaseUrl } from "@/db";
import { siteCopy } from "@/db/schema";
import { applyOverrides, DEFAULT_COPY, type SiteCopy } from "./registry";

/**
 * خواندن متن زنده.
 *
 * قواعد:
 *  - فقط `live_value` به صفحهٔ عمومی می‌رسد؛ پیش‌نویس هرگز.
 *  - سطر بدون `live_value` = پیش‌فرض رجیستری (هیچ override ای نیست).
 *  - قطع DB یا نبود `DATABASE_URL` خطا نمی‌دهد؛ پیش‌فرض کامل برمی‌گردد.
 *  - کش برچسب‌دار: صفحه‌های عمومی static می‌مانند و فقط پس از انتشار تازه می‌شوند
 *    (`revalidateTag(SITE_COPY_TAG)` در route انتشار).
 */

export const SITE_COPY_TAG = "site-copy";

export type SiteCopySource = "live" | "error";

export type SiteCopySnapshot = { copy: SiteCopy; source: SiteCopySource };

async function readLiveOverrides(): Promise<Record<string, string>> {
  if (!hasDatabaseUrl()) return {};
  try {
    const rows = await db
      .select({ key: siteCopy.key, value: siteCopy.liveValue })
      .from(siteCopy)
      .where(eq(siteCopy.locale, "fa"));
    const out: Record<string, string> = {};
    for (const row of rows) {
      if (typeof row.value === "string" && row.value.trim()) out[row.key] = row.value;
    }
    return out;
  } catch {
    return {};
  }
}

const cachedOverrides = unstable_cache(readLiveOverrides, ["site-copy-live-v1"], {
  tags: [SITE_COPY_TAG],
  revalidate: 3600,
});

/** متن زنده برای صفحه‌های عمومی. */
export async function getSiteCopy(): Promise<SiteCopy> {
  try {
    return applyOverrides(DEFAULT_COPY, await cachedOverrides());
  } catch {
    return structuredClone(DEFAULT_COPY);
  }
}

/** همان، با نشانهٔ منبع برای صفحه‌هایی که باید پیام قطع اتصال را نشان دهند. */
export async function getSiteCopySnapshot(): Promise<SiteCopySnapshot> {
  if (!hasDatabaseUrl()) return { copy: structuredClone(DEFAULT_COPY), source: "error" };
  try {
    const overrides = await cachedOverrides();
    return { copy: applyOverrides(DEFAULT_COPY, overrides), source: "live" };
  } catch {
    return { copy: structuredClone(DEFAULT_COPY), source: "error" };
  }
}
