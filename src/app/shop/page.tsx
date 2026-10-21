import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { formatMoney } from "@/lib/shop/money";
import { isShopKind, shopKindFa } from "@/lib/shop/kinds";
import { loadPublicShopList } from "@/lib/public/catalog";
import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { RoomPage } from "@/components/ui/RoomPage";
import { EmptyState } from "@/components/ui/EmptyState";
import { PublicSourceNotice } from "@/components/ui/PublicSourceNotice";
import { CollectionChips, CollectionEmpty, CollectionSearch } from "@/components/ui/CollectionControls";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "فروشگاه",
  description:
    "محصول، مُهر، باکس آموزشی و دورهٔ هادیران. پرداخت بیرون از سایت است؛ دسترسی یا ارسال بعد از تأیید دریافت.",
  alternates: { canonical: "/shop" },
};

interface Props {
  searchParams: Promise<{ kind?: string; q?: string; sort?: string }>;
}

function shopHref(patch: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(patch)) if (value) params.set(key, value);
  const query = params.toString();
  return query ? `/shop?${query}` : "/shop";
}

export default async function ShopPage({ searchParams }: Props) {
  const { kind: kindRaw, q = "", sort: sortRaw } = await searchParams;
  const kindFilter = kindRaw && isShopKind(kindRaw) ? kindRaw : null;
  const { source, items } = await loadPublicShopList(kindFilter);
  const sort = sortRaw === "price-asc" || sortRaw === "price-desc" || sortRaw === "title" ? sortRaw : "new";
  const query = q.trim().toLowerCase();

  const visible = items
    .filter((item) => (query ? `${item.titleFa} ${item.summaryFa ?? ""}`.toLowerCase().includes(query) : true))
    .slice()
    .sort((a, b) => {
      if (sort === "price-asc") return a.amount - b.amount;
      if (sort === "price-desc") return b.amount - a.amount;
      if (sort === "title") return a.titleFa.localeCompare(b.titleFa, "fa");
      return 0;
    });

  const keepSort = sort === "new" ? undefined : sort;
  const filters = [
    { href: shopHref({ q, sort: keepSort }), label: "همه", active: !kindFilter },
    { href: shopHref({ q, kind: "physical_good", sort: keepSort }), label: "فیزیکی", active: kindFilter === "physical_good" },
    {
      href: shopHref({ q, kind: "digital_entitlement", sort: keepSort }),
      label: "دیجیتال",
      active: kindFilter === "digital_entitlement",
    },
    { href: shopHref({ q, kind: "course_access", sort: keepSort }), label: "دوره", active: kindFilter === "course_access" },
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
      <CollectionSearch
        action="/shop"
        q={q}
        placeholder="جستجو در نام و خلاصهٔ کالاها..."
        hidden={{ kind: kindFilter ?? undefined, sort }}
      />
      <CollectionChips
        label="مرتب‌سازی"
        links={[
          { href: shopHref({ q, kind: kindFilter ?? undefined, sort: "new" }), label: "تازه‌ترین", active: sort === "new" },
          {
            href: shopHref({ q, kind: kindFilter ?? undefined, sort: "price-asc" }),
            label: "ارزان‌ترین",
            active: sort === "price-asc",
          },
          {
            href: shopHref({ q, kind: kindFilter ?? undefined, sort: "price-desc" }),
            label: "گران‌ترین",
            active: sort === "price-desc",
          },
          { href: shopHref({ q, kind: kindFilter ?? undefined, sort: "title" }), label: "الفبا", active: sort === "title" },
        ]}
      />

      {source !== "live" ? (
        <PublicSourceNotice source={source} />
      ) : items.length === 0 ? (
        <EmptyState title="هنوز کالای منتشرشده‌ای نیست." />
      ) : visible.length === 0 ? (
        <CollectionEmpty title="با این جستجو کالایی نبود." hint="جستجو را پاک کن؛ صافی نوع دست‌نخورده است." />
      ) : (
        <ul className="section-cards listing-cards">
          {visible.map((item) => (
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
