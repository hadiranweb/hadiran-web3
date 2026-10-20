import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { db } from "@/db";
import { shopListings } from "@/db/schema";
import { desc, eq, and } from "drizzle-orm";
import { formatMoney } from "@/lib/shop/money";
import { isShopKind, shopKindFa } from "@/lib/shop/kinds";
import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { RoomPage } from "@/components/ui/RoomPage";
import { EmptyState } from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "فروشگاه",
  description:
    "محصول، مُهر، باکس آموزشی و دورهٔ هادیران. پرداخت بیرون از سایت است؛ دسترسی یا ارسال بعد از تأیید دریافت.",
  alternates: { canonical: "/shop" },
};

interface Props {
  searchParams: Promise<{ kind?: string }>;
}

export default async function ShopPage({ searchParams }: Props) {
  const { kind: kindRaw } = await searchParams;
  const kindFilter = kindRaw && isShopKind(kindRaw) ? kindRaw : null;
  let items: (typeof shopListings.$inferSelect)[] = [];
  try {
    const published = eq(shopListings.published, true);
    items = await db
      .select()
      .from(shopListings)
      .where(kindFilter ? and(published, eq(shopListings.kind, kindFilter)) : published)
      .orderBy(desc(shopListings.updatedAt));
  } catch (error) {
    console.error("[hadiran] shop list", error);
  }

  const filters = [
    { href: "/shop", label: "همه", active: !kindFilter },
    { href: "/shop?kind=physical_good", label: "فیزیکی", active: kindFilter === "physical_good" },
    { href: "/shop?kind=digital_entitlement", label: "دیجیتال", active: kindFilter === "digital_entitlement" },
    { href: "/shop?kind=course_access", label: "دوره", active: kindFilter === "course_access" },
  ];

  return (
    <RoomPage
      hero={
        <PageHeader
          title="فروشگاه"
          lede="کالاهای فیزیکی (محصول، مُهر، باکس آموزشی) و مجازی (دوره). پرداخت روی ریل بیرونی است؛ سایت پول را نگه نمی‌دارد."
        >
          <nav className="mt-6 flex flex-wrap gap-2 text-sm">
            {filters.map((filter) => (
              <Link key={filter.href} href={filter.href} className={filter.active ? "chip" : "ws-button"}>
                {filter.label}
              </Link>
            ))}
          </nav>
        </PageHeader>
      }
    >
      {items.length === 0 ? (
        <EmptyState title="هنوز کالای منتشرشده‌ای نیست." />
      ) : (
        <ul className="section-cards listing-cards">
          {items.map((item) => (
            <li key={item.id}>
              <Link href={`/shop/${item.slug}`} className="card card-hover section-card overflow-hidden p-0">
                {item.coverImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.coverImageUrl} alt="" className="h-44 w-full object-cover" />
                ) : null}
                <div className="flex flex-1 flex-col justify-between gap-6 p-6">
                  <div className="section-card-copy">
                    <p className="chip">{shopKindFa(item.kind)}</p>
                    <h2 className="section-card-title mt-2">{item.titleFa}</h2>
                    {item.summaryFa ? <p className="muted mt-2 line-clamp-3 text-sm leading-7">{item.summaryFa}</p> : null}
                    <p className="mt-4 text-sm font-medium text-ink">
                      {item.comparePrice && item.comparePrice > item.amount ? (
                        <span className="ml-2 text-muted line-through">
                          {formatMoney(item.comparePrice, item.currency)}
                        </span>
                      ) : null}
                      {formatMoney(item.amount, item.currency)}
                    </p>
                  </div>
                  <span className="more">
                    جزئیات
                    <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </RoomPage>
  );
}
