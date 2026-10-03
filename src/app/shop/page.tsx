import Link from "next/link";
import { db } from "@/db";
import { shopListings } from "@/db/schema";
import { desc, eq, and } from "drizzle-orm";
import { formatMoney } from "@/lib/shop/money";
import { isShopKind, shopKindFa } from "@/lib/shop/kinds";
import type { Metadata } from "next";
import { HadiranMark } from "@/components/HadiranMark";

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
    <main className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-10 text-center">
        <HadiranMark className="mx-auto mb-4 h-12 w-12" />
        <h1 className="text-3xl font-bold text-slate-900">فروشگاه</h1>
        <p className="mt-3 text-slate-600">
          کالاهای فیزیکی (محصول، مُهر، باکس آموزشی) و مجازی (دوره). پرداخت روی ریل بیرونی است؛ سایت پول را نگه
          نمی‌دارد.
        </p>
        <nav className="mt-6 flex flex-wrap justify-center gap-2 text-sm">
          {filters.map((filter) => (
            <Link
              key={filter.href}
              href={filter.href}
              className={`rounded-full px-3 py-1 ${filter.active ? "bg-indigo-700 text-white" : "bg-slate-100 text-slate-700"}`}
            >
              {filter.label}
            </Link>
          ))}
        </nav>
      </header>
      {items.length === 0 ? (
        <p className="text-center text-slate-500">هنوز کالای منتشرشده‌ای نیست.</p>
      ) : (
        <ul className="grid gap-5 md:grid-cols-2">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={`/shop/${item.slug}`}
                className="block overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm hover:border-indigo-200"
              >
                {item.coverImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.coverImageUrl} alt="" className="h-44 w-full object-cover" />
                ) : null}
                <div className="p-6">
                  <p className="text-xs text-indigo-600">{shopKindFa(item.kind)}</p>
                  <h2 className="mt-1 text-lg font-bold text-slate-900">{item.titleFa}</h2>
                  <p className="mt-2 line-clamp-3 text-sm text-slate-600">{item.summaryFa}</p>
                  <p className="mt-4 text-sm font-medium text-indigo-700">
                    {item.comparePrice && item.comparePrice > item.amount ? (
                      <span className="ml-2 text-slate-400 line-through">
                        {formatMoney(item.comparePrice, item.currency)}
                      </span>
                    ) : null}
                    {formatMoney(item.amount, item.currency)}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
