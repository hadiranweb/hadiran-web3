import { NextResponse } from "next/server";
import { db } from "@/db";
import { assessmentAuthoringPlans, shopListings, shopOrders } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireOwner } from "@/lib/auth/guard";
import { parseListingBody } from "@/lib/shop/parse-listing";
import { applyUsdPricing, replaceListingImages } from "@/lib/shop/listing-write";
import { syncAssessmentAuthoringPlan } from "@/lib/shop/assessment-authoring-plan";

export const dynamic = "force-dynamic";

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: Ctx) {
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  const { id } = await params;
  const [existing] = await db.select().from(shopListings).where(eq(shopListings.id, id));
  if (!existing) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const body = (await request.json()) as Record<string, unknown>;
  const usesAuthoringPlan =
    existing.kind === "assessment_authoring_subscription" || body.kind === "assessment_authoring_subscription";
  const [existingPlan] = usesAuthoringPlan
    ? await db
        .select()
        .from(assessmentAuthoringPlans)
        .where(eq(assessmentAuthoringPlans.listingId, existing.id))
        .limit(1)
    : [null];
  const parsed = parseListingBody(
    {
      titleFa: body.titleFa ?? existing.titleFa,
      titleEn: body.titleEn ?? existing.titleEn,
      slug: body.slug ?? existing.slug,
      summaryFa: body.summaryFa ?? existing.summaryFa,
      bodyFa: body.bodyFa ?? existing.bodyFa,
      accessBodyFa: body.accessBodyFa ?? existing.accessBodyFa,
      amount: body.amount ?? existing.amount,
      currency: body.currency ?? existing.currency,
      kind: body.kind ?? existing.kind,
      usdRatio: body.usdRatio ?? existing.usdRatio,
      comparePrice: body.comparePrice ?? existing.comparePrice,
      specs: body.specs ?? existing.specs,
      images: body.images ?? body.imageUrls,
      courseId: body.courseId === undefined ? existing.courseId : body.courseId,
      authoringQuota: body.authoringQuota ?? existingPlan?.quotaPerPeriod,
      authoringDurationDays: body.authoringDurationDays ?? existingPlan?.durationDays,
      authoringRenewalPolicy: body.authoringRenewalPolicy ?? existingPlan?.renewalPolicy,
      published: body.published ?? existing.published,
    },
    existing.slug,
  );
  if (!parsed) {
    return NextResponse.json({ error: "عنوان، اسلاگ لاتین و مبلغ مثبت و برای اشتراک سهمیه و مدت معتبر لازم است." }, { status: 400 });
  }
  if (existing.kind === "assessment_authoring_subscription" && parsed.kind !== existing.kind) {
    const [order] = await db
      .select({ id: shopOrders.id })
      .from(shopOrders)
      .where(eq(shopOrders.listingId, existing.id))
      .limit(1);
    if (order) return NextResponse.json({ error: "kind_locked_after_orders" }, { status: 409 });
  }
  if (parsed.slug !== existing.slug) {
    const [dup] = await db.select({ id: shopListings.id }).from(shopListings).where(eq(shopListings.slug, parsed.slug));
    if (dup) return NextResponse.json({ error: "این اسلاگ قبلاً استفاده شده است." }, { status: 409 });
  }
  const priced = await applyUsdPricing(parsed);
  const { images, authoringQuota, authoringDurationDays, authoringRenewalPolicy, ...row } = priced;
  const updated = await db.transaction(async (tx) => {
    const [listing] = await tx
      .update(shopListings)
      .set({
        ...row,
        coverImageUrl: images[0]?.imageUrl ?? existing.coverImageUrl,
        updatedAt: new Date(),
      })
      .where(eq(shopListings.id, id))
      .returning();
    if (usesAuthoringPlan) {
      await syncAssessmentAuthoringPlan(tx, {
        listingId: id,
        kind: listing.kind,
        quotaPerPeriod: authoringQuota,
        durationDays: authoringDurationDays,
        renewalPolicy: authoringRenewalPolicy,
      });
    }
    return listing;
  });
  if (body.images !== undefined || body.imageUrls !== undefined) {
    await replaceListingImages(id, images);
  }
  return NextResponse.json({ ok: true, id: updated.id, slug: updated.slug });
}
