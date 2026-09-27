import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { shopEntitlements, shopListings } from "@/db/schema";

export async function hasListingEntitlement(accountId: number, listingId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: shopEntitlements.id })
    .from(shopEntitlements)
    .where(and(eq(shopEntitlements.accountId, accountId), eq(shopEntitlements.listingId, listingId)))
    .limit(1);
  return Boolean(row);
}

export async function listingForPaidCourse(courseId: number) {
  const [listing] = await db
    .select()
    .from(shopListings)
    .where(and(eq(shopListings.courseId, courseId), eq(shopListings.published, true)))
    .limit(1);
  return listing ?? null;
}

export async function hasCourseEntitlement(accountId: number, courseId: number): Promise<boolean> {
  const listing = await listingForPaidCourse(courseId);
  if (!listing) return true;
  return hasListingEntitlement(accountId, listing.id);
}
