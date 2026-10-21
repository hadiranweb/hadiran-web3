import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { shopListingImages, shopListings } from "@/db/schema";
import { and, asc, eq, ne } from "drizzle-orm";
import { getCurrentAccount } from "@/lib/auth/session";
import { hasListingEntitlement } from "@/lib/shop/access";
import { formatMoney } from "@/lib/shop/money";
import { isPhysicalKind, shopKindFa } from "@/lib/shop/kinds";
import { publicShopFilter } from "@/lib/public/policy";
import { MarkdownReadonly } from "@/components/MarkdownReadonly";
import { StartOrderButton } from "@/components/shop/StartOrderButton";
import { ListingGallery } from "@/components/shop/ListingGallery";
import { ListingSpecs } from "@/components/shop/ListingSpecs";
import { SharePrint } from "@/components/shop/SharePrint";
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

  let related: { slug: string; titleFa: string; amount: number; currency: string }[] = [];
  try {
    related = await db
      .select({
        slug: shopListings.slug,
        titleFa: shopListings.titleFa,
        amount: shopListings.amount,
        currency: shopListings.currency,
      })
      .from(shopListings)
      .where(and(publicShopFilter, eq(shopListings.kind, item.kind), ne(shopListings.id, item.id)))
      .limit(3);
  } catch (error) {
    console.error("[hadiran] related listings", error);
  }

  const deliverySteps = isPhysicalKind(item.kind)
    ? [
        "مبلغ را روی ریل بیرونی سایت پرداخت می‌کنی و شمارهٔ پیگیری را می‌گذاری.",
        "مالک رسید را می‌بیند و تأیید یا رد می‌کند؛ سایت خودش نمی‌گوید پول آمده.",
        "بعد از تأیید، هماهنگی ارسال همین‌جا نوشته می‌شود.",
      ]
    : [
        "مبلغ را روی ریل بیرونی سایت پرداخت می‌کنی و شمارهٔ پیگیری را می‌گذاری.",
        "بعد از تأیید دریافت، متن دسترسی یا محتوای تحویل باز می‌شود.",
        "همین خرید برای همین کالا یک‌بار دسترسی می‌دهد؛ خرید دوباره لازم نیست.",
      ];

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
          <SharePrint title={item.titleFa} />
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

      <section className="surface mt-6 p-6 sm:p-8">
        <h2 className="text-lg font-bold text-ink">خرید و تحویل چطور انجام می‌شود؟</h2>
        <ol className="mt-4 space-y-3 text-sm leading-7 text-muted">
          {deliverySteps.map((step, index) => (
            <li key={step} className="flex gap-3">
              <span className="chip shrink-0">{(index + 1).toLocaleString("fa-IR")}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
        <dl className="mt-6 space-y-4 border-t border-line pt-5 text-sm leading-7">
          <div>
            <dt className="font-medium text-ink">پرداخت داخل سایت است؟</dt>
            <dd className="text-muted">نه. درگاه پرداختی در سایت نیست؛ پرداخت بیرونی است و سایت فقط ادعای وصول را ثبت می‌کند.</dd>
          </div>
          <div>
            <dt className="font-medium text-ink">اگر دریافت نشد چه می‌شود؟</dt>
            <dd className="text-muted">مالک سفارش را رد می‌کند و دسترسی باز نمی‌شود. برگشت پول روی همان ریل بیرونی است.</dd>
          </div>
          <div>
            <dt className="font-medium text-ink">این کالا اشتراک یا کیف پول است؟</dt>
            <dd className="text-muted">نه. این خرید یک دسترسی برای همین کالاست، نه ماندهٔ مالی قابل خرج.</dd>
          </div>
        </dl>
      </section>

      {related.length ? (
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-bold text-ink">کالاهای مرتبط</h2>
          <ul className="section-cards listing-cards">
            {related.map((row) => (
              <li key={row.slug}>
                <Link href={`/shop/${row.slug}`} className="card card-hover section-card">
                  <div className="section-card-copy">
                    <h3 className="section-card-title">{row.titleFa}</h3>
                    <p className="mt-2 text-sm font-medium text-ink">{formatMoney(row.amount, row.currency)}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
