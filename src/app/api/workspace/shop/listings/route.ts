import { NextResponse } from "next/server";
import { db } from "@/db";
import { shopListings } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { requireOwner } from "@/lib/auth/guard";
import { newCanonicalId } from "@/lib/knowledge/ids";
import { parseListingBody } from "@/lib/shop/parse-listing";
import { applyUsdPricing, replaceListingImages } from "@/lib/shop/listing-write";
import { syncAssessmentAuthoringPlan } from "@/lib/shop/assessment-authoring-plan";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  const items = await db.select().from(shopListings).orderBy(desc(shopListings.updatedAt));
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  const body = (await request.json()) as Record<string, unknown>;
  const parsed = parseListingBody(body);
  if (!parsed) {
    return NextResponse.json({ error: "عنوان، اسلاگ لاتین و مبلغ مثبت لازم است." }, { status: 400 });
  }
  const [dup] = await db.select({ id: shopListings.id }).from(shopListings).where(eq(shopListings.slug, parsed.slug));
  if (dup) return NextResponse.json({ error: "این اسلاگ قبلاً استفاده شده است." }, { status: 409 });
  const priced = await applyUsdPricing(parsed);
  const { images, authoringQuota, authoringDurationDays, authoringRenewalPolicy, ...row } = priced;
  const created = await db.transaction(async (tx) => {
    const [listing] = await tx
      .insert(shopListings)
      .values({
        id: newCanonicalId("LISTING"),
        ...row,
        coverImageUrl: images[0]?.imageUrl ?? null,
      })
      .returning();
    if (listing.kind === "assessment_authoring_subscription") {
      await syncAssessmentAuthoringPlan(tx, {
        listingId: listing.id,
        kind: listing.kind,
        quotaPerPeriod: authoringQuota,
        durationDays: authoringDurationDays,
        renewalPolicy: authoringRenewalPolicy,
      });
    }
    return listing;
  });
  await replaceListingImages(created.id, images);
  return NextResponse.json({ ok: true, id: created.id, slug: created.slug });
}
