import { slugify } from "@/lib/markdown";
import { isShopKind, type ShopKind } from "./kinds";
import type { ShopSpec } from "@/db/schema";

const MAX_SPECS = 15;
const MAX_IMAGES = 10;

export type ParsedListing = {
  slug: string;
  titleFa: string;
  titleEn: string | null;
  summaryFa: string | null;
  bodyFa: string | null;
  accessBodyFa: string | null;
  amount: number;
  currency: string;
  kind: ShopKind;
  usdRatio: number | null;
  comparePrice: number | null;
  specs: ShopSpec[];
  images: { imageUrl: string; thumbUrl: string | null }[];
  courseId: number | null;
  published: boolean;
};

function parseSpecs(raw: unknown): ShopSpec[] {
  if (!Array.isArray(raw)) return [];
  const rows: ShopSpec[] = [];
  for (const item of raw.slice(0, MAX_SPECS)) {
    if (!item || typeof item !== "object") continue;
    const row = item as { key?: unknown; value?: unknown };
    const key = typeof row.key === "string" ? row.key.trim().slice(0, 80) : "";
    const value = typeof row.value === "string" ? row.value.trim().slice(0, 200) : "";
    if (!key || !value) continue;
    rows.push({ key, value });
  }
  return rows;
}

function parseImages(raw: unknown): { imageUrl: string; thumbUrl: string | null }[] {
  const urls: string[] = [];
  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (typeof item === "string") urls.push(item);
      else if (item && typeof item === "object" && typeof (item as { imageUrl?: unknown }).imageUrl === "string") {
        urls.push((item as { imageUrl: string }).imageUrl);
      }
    }
  } else if (typeof raw === "string") {
    urls.push(...raw.split(/\r?\n/));
  }
  const out: { imageUrl: string; thumbUrl: string | null }[] = [];
  for (const url of urls) {
    const imageUrl = url.trim();
    if (!imageUrl) continue;
    try {
      const parsed = new URL(imageUrl);
      if (!["http:", "https:"].includes(parsed.protocol)) continue;
    } catch {
      continue;
    }
    out.push({ imageUrl, thumbUrl: null });
    if (out.length >= MAX_IMAGES) break;
  }
  return out;
}

export function parseListingBody(body: Record<string, unknown>, existingSlug?: string): ParsedListing | null {
  const titleFa = typeof body.titleFa === "string" ? body.titleFa.trim() : "";
  const titleEn = typeof body.titleEn === "string" ? body.titleEn.trim() : "";
  const requested = typeof body.slug === "string" ? slugify(body.slug) : "";
  const slug = requested || slugify(titleEn) || existingSlug || "";
  const amount = Number(body.amount);
  if (titleFa.length < 3 || !slug) return null;
  if (["orders", "new", "edit"].includes(slug)) return null;
  if (!Number.isFinite(amount) || amount <= 0) return null;
  const kindRaw = typeof body.kind === "string" ? body.kind : "digital_entitlement";
  const kind: ShopKind = isShopKind(kindRaw) ? kindRaw : "digital_entitlement";
  const courseIdRaw = body.courseId;
  const courseId =
    typeof courseIdRaw === "number"
      ? courseIdRaw
      : typeof courseIdRaw === "string" && courseIdRaw.trim()
        ? Number(courseIdRaw)
        : null;
  const usdRaw = body.usdRatio;
  const usdRatio =
    usdRaw === "" || usdRaw === null || usdRaw === undefined
      ? null
      : Number(usdRaw);
  const compareRaw = body.comparePrice;
  const comparePrice =
    compareRaw === "" || compareRaw === null || compareRaw === undefined
      ? null
      : Number(compareRaw);
  return {
    slug,
    titleFa,
    titleEn: titleEn || null,
    summaryFa: typeof body.summaryFa === "string" ? body.summaryFa.trim() || null : null,
    bodyFa: typeof body.bodyFa === "string" ? body.bodyFa : null,
    accessBodyFa: typeof body.accessBodyFa === "string" ? body.accessBodyFa : null,
    amount: Math.round(amount),
    currency: typeof body.currency === "string" && body.currency.trim() ? body.currency.trim() : "IRR",
    kind,
    usdRatio: usdRatio !== null && Number.isFinite(usdRatio) && usdRatio > 0 ? usdRatio : null,
    comparePrice: comparePrice !== null && Number.isFinite(comparePrice) && comparePrice > 0 ? Math.round(comparePrice) : null,
    specs: parseSpecs(body.specs),
    images: parseImages(body.images ?? body.imageUrls),
    courseId: courseId && Number.isFinite(courseId) ? courseId : null,
    published: Boolean(body.published),
  };
}
