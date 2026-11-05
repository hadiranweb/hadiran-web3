import Link from "@/components/workspace/WorkspaceLink";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { shopListingImages, shopListings } from "@/db/schema";
import { eq, asc, and, ne } from "drizzle-orm";
import { getCurrentAccount } from "@/lib/auth/session";
import { hasListingEntitlement } from "@/lib/shop/access";
import { isPhysicalKind } from "@/lib/shop/kinds";
import { MarkdownReadonly } from "@/components/MarkdownReadonly";
import { StartOrderButton } from "@/components/shop/StartOrderButton";
import { browserScope } from "@/lib/landing/scope";
import { ResourceConnections } from "@/components/landing/ResourceConnections";
import { ProductLanding } from "@/components/landing/ProductLanding";
import { landingPreviewEnabled, sampleListings } from "@/lib/landing/preview";
import type { Metadata } from "next";
export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };
async function readListing(slug: string) {
  if (landingPreviewEnabled()) return sampleListings.find(item => item.slug === slug);
  const [item] = await db.select().from(shopListings).where(and(eq(shopListings.slug, slug), eq(shopListings.published, true)));
  return item;
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try { const item = await readListing(slug); if (!item) return { title: "یافت نشد", robots: { index: false, follow: false } };
    return { title: item.titleFa, description: item.summaryFa ?? undefined, alternates: { canonical: `/shop/${slug}` }, ...(landingPreviewEnabled() ? { robots: { index: false, follow: false } } : {}) };
  } catch { return { title: "فروشگاه" }; }
}
export default async function ShopItemPage({ params }: Props) {
  const { slug } = await params;
  const preview = landingPreviewEnabled();
  const item = await readListing(slug);
  if (!item) notFound();
  let images = item.coverImageUrl ? [item.coverImageUrl] : [];
  let related: (typeof shopListings.$inferSelect)[] = [];
  if (preview) related = sampleListings.filter(row => row.id !== item.id);
  else {
    try {
      const rows = await db.select().from(shopListingImages).where(eq(shopListingImages.listingId, item.id)).orderBy(asc(shopListingImages.position));
      if (rows.length) images = rows.map(row => row.imageUrl);
    } catch (error) { console.error("[hadiran] listing images", error); }
    try { related = await db.select().from(shopListings).where(and(eq(shopListings.published, true), ne(shopListings.id, item.id))).limit(2); }
    catch (error) { console.error("[hadiran] related products", error); }
  }
  const account = await getCurrentAccount();
  const entitled = !preview && (account?.role === "owner" || (account ? await hasListingEntitlement(account.id, item.id) : false));
  const action = preview ? <div><button className="lp-button" type="button" disabled>محصول نمایشی · خرید غیرفعال</button><p className="lp-action-note">این نمونه سفارش یا پرداخت ایجاد نمی‌کند.</p></div> : entitled ? <div className="lp-access"><p>{isPhysicalKind(item.kind) ? "هماهنگی و اطلاعات تحویل" : "دسترسی باز است."}</p><MarkdownReadonly source={item.accessBodyFa} emptyLabel={isPhysicalKind(item.kind) ? "هماهنگی ارسال پس از تأیید انجام می‌شود." : "محتوای تحویل ثبت نشده."} /></div> : account ? <StartOrderButton slug={item.slug} /> : <Link href={`/signin?next=${encodeURIComponent(`/shop/${item.slug}`)}`} className="lp-button">ورود برای خرید <span aria-hidden="true">←</span></Link>;
  return <ProductLanding connections={<ResourceConnections resourceId={`product:${item.slug}`} />} storageScope={browserScope(account)} item={item} images={images} related={related} preview={preview} action={action} />;
}
