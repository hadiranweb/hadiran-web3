import { notFound } from "next/navigation";
import { db } from "@/db";
import { courses, shopListingImages, shopListings } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { requirePageOwner } from "@/lib/auth/guard";
import { ListingEditor } from "@/components/shop/ListingEditor";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ویرایش کالا",
  robots: { index: false, follow: false },
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditListingPage({ params }: Props) {
  const { id } = await params;
  await requirePageOwner(`/workspace/shop/listings/${id}`);
  const [item] = await db.select().from(shopListings).where(eq(shopListings.id, id));
  if (!item) notFound();
  let imageUrls: string[] = [];
  try {
    const rows = await db
      .select()
      .from(shopListingImages)
      .where(eq(shopListingImages.listingId, item.id))
      .orderBy(asc(shopListingImages.position));
    imageUrls = rows.map((row) => row.imageUrl);
  } catch (error) {
    console.error("[hadiran] listing images", error);
  }
  let courseRows: { id: number; titleFa: string; slug: string }[] = [];
  try {
    courseRows = await db.select({ id: courses.id, titleFa: courses.titleFa, slug: courses.slug }).from(courses);
  } catch (error) {
    console.error("[hadiran] listing courses", error);
  }
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">{item.titleFa}</h1>
      <ListingEditor
        courses={courseRows}
        initial={{
          id: item.id,
          slug: item.slug,
          titleFa: item.titleFa,
          titleEn: item.titleEn,
          summaryFa: item.summaryFa,
          bodyFa: item.bodyFa,
          accessBodyFa: item.accessBodyFa,
          amount: item.amount,
          currency: item.currency,
          kind: item.kind,
          usdRatio: item.usdRatio,
          comparePrice: item.comparePrice,
          specs: item.specs,
          imageUrls,
          courseId: item.courseId,
          published: item.published,
        }}
      />
    </main>
  );
}
