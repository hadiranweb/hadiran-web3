import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { shopListingImages, shopListings } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { getCurrentAccount } from "@/lib/auth/session";
import { hasListingEntitlement } from "@/lib/shop/access";
import { formatMoney } from "@/lib/shop/money";
import { isPhysicalKind, shopKindFa } from "@/lib/shop/kinds";
import { MarkdownReadonly } from "@/components/MarkdownReadonly";
import { StartOrderButton } from "@/components/shop/StartOrderButton";
import { ListingGallery } from "@/components/shop/ListingGallery";
import { ListingSpecs } from "@/components/shop/ListingSpecs";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const [item] = await db.select().from(shopListings).where(eq(shopListings.slug, slug));
    if (!item || !item.published) return { title: "یافت نشد", robots: { index: false, follow: false } };
    return {
      title: item.titleFa,
      description: item.summaryFa ?? undefined,
      alternates: { canonical: `/shop/${slug}` },
    };
  } catch {
    return { title: "فروشگاه" };
  }
}

export default async function ShopItemPage({ params }: Props) {
  const { slug } = await params;
  const [item] = await db.select().from(shopListings).where(eq(shopListings.slug, slug));
  if (!item || !item.published) notFound();
  const account = await getCurrentAccount();
  const entitled =
    account?.role === "owner" || (account ? await hasListingEntitlement(account.id, item.id) : false);
  let images: string[] = [];
  try {
    const rows = await db
      .select()
      .from(shopListingImages)
      .where(eq(shopListingImages.listingId, item.id))
      .orderBy(asc(shopListingImages.position));
    images = rows.map((row) => row.imageUrl);
  } catch (error) {
    console.error("[hadiran] listing images", error);
  }
  if (!images.length && item.coverImageUrl) images = [item.coverImageUrl];

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/shop" className="mb-6 inline-block text-sm text-muted hover:text-ink">
        بازگشت به فروشگاه
      </Link>
      <article className="space-y-6">
        <ListingGallery urls={images} title={item.titleFa} />
        <div className="surface p-6 sm:p-10">
          <p className="text-xs font-medium text-mark">{shopKindFa(item.kind)}</p>
          <h1 className="mt-1 text-3xl font-extrabold leading-[1.35] text-ink">{item.titleFa}</h1>
          <p className="mt-2 text-lg font-medium text-ink">
            {item.comparePrice && item.comparePrice > item.amount ? (
              <span className="ml-2 text-base text-muted line-through">
                {formatMoney(item.comparePrice, item.currency)}
              </span>
            ) : null}
            {formatMoney(item.amount, item.currency)}
          </p>
          {item.summaryFa ? <p className="mt-4 leading-[1.85] text-muted">{item.summaryFa}</p> : null}
          <ListingSpecs specs={item.specs} />
          <div className="mt-6">
            <MarkdownReadonly source={item.bodyFa} />
          </div>
          <div className="mt-8 border-t border-line pt-6">
            {entitled ? (
              <div className="space-y-4">
                <p className="text-sm font-medium text-good">
                  {isPhysicalKind(item.kind) ? "سفارش تأیید شد." : "دسترسی باز است."}
                </p>
                <MarkdownReadonly
                  source={item.accessBodyFa}
                  emptyLabel={
                    isPhysicalKind(item.kind)
                      ? "هماهنگی ارسال پس از تأیید انجام می‌شود."
                      : "محتوای تحویل ثبت نشده."
                  }
                />
              </div>
            ) : account ? (
              <StartOrderButton slug={item.slug} />
            ) : (
              <Link
                href={`/signin?next=${encodeURIComponent(`/shop/${item.slug}`)}`}
                className="inline-flex rounded-[var(--radius-md)] bg-accent px-4 py-2 text-sm font-medium text-accent-fg"
              >
                ورود برای خرید
              </Link>
            )}
          </div>
        </div>
      </article>
    </main>
  );
}
