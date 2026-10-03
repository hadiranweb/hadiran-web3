import { NextResponse } from "next/server";
import { db } from "@/db";
import { shopListings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireOwner } from "@/lib/auth/guard";
import { parseListingBody } from "@/lib/shop/parse-listing";
import { applyUsdPricing, replaceListingImages } from "@/lib/shop/listing-write";

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
      published: body.published ?? existing.published,
    },
    existing.slug,
  );
  if (!parsed) {
    return NextResponse.json({ error: "عنوان، اسلاگ لاتین و مبلغ مثبت لازم است." }, { status: 400 });
  }
  if (parsed.slug !== existing.slug) {
    const [dup] = await db.select({ id: shopListings.id }).from(shopListings).where(eq(shopListings.slug, parsed.slug));
    if (dup) return NextResponse.json({ error: "این اسلاگ قبلاً استفاده شده است." }, { status: 409 });
  }
  const priced = await applyUsdPricing(parsed);
  const { images, ...row } = priced;
  const [updated] = await db
    .update(shopListings)
    .set({
      ...row,
      coverImageUrl: images[0]?.imageUrl ?? existing.coverImageUrl,
      updatedAt: new Date(),
    })
    .where(eq(shopListings.id, id))
    .returning();
  if (body.images !== undefined || body.imageUrls !== undefined) {
    await replaceListingImages(id, images);
  }
  return NextResponse.json({ ok: true, id: updated.id, slug: updated.slug });
}
