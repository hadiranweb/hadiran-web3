import { db } from "@/db";
import { shopListingImages, shopListings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { amountFromRatio, getShopUsdRate, ratioFromAmount } from "./price-engine";
import type { ParsedListing } from "./parse-listing";

export async function applyUsdPricing(parsed: ParsedListing): Promise<ParsedListing> {
  const rate = await getShopUsdRate();
  if (!rate) return parsed;
  if (parsed.usdRatio) {
    return { ...parsed, amount: amountFromRatio(parsed.usdRatio, rate) };
  }
  return { ...parsed, usdRatio: ratioFromAmount(parsed.amount, rate) };
}

export async function replaceListingImages(
  listingId: string,
  images: { imageUrl: string; thumbUrl: string | null }[],
) {
  await db.delete(shopListingImages).where(eq(shopListingImages.listingId, listingId));
  if (!images.length) {
    await db.update(shopListings).set({ coverImageUrl: null }).where(eq(shopListings.id, listingId));
    return;
  }
  await db.insert(shopListingImages).values(
    images.map((img, position) => ({
      listingId,
      imageUrl: img.imageUrl,
      thumbUrl: img.thumbUrl,
      position,
    })),
  );
  await db
    .update(shopListings)
    .set({ coverImageUrl: images[0].imageUrl })
    .where(eq(shopListings.id, listingId));
}
