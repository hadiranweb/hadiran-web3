import Link from "next/link";
import { db } from "@/db";
import { shopListings } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { formatMoney } from "@/lib/shop/money";
import type { Metadata } from "next";
import { HadiranMark } from "@/components/HadiranMark";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "فروشگاه",
  description: "محصولات هادیران. پرداخت بیرون از سایت است؛ دسترسی بعد از تأیید دریافت باز می‌شود.",
  alternates: { canonical: "/shop" },
};

export default async function ShopPage() {
  let items: (typeof shopListings.$inferSelect)[] = [];
  try {
    items = await db
      .select()
      .from(shopListings)
      .where(eq(shopListings.published, true))
      .orderBy(desc(shopListings.updatedAt));
  } catch (error) {
    console.error("[hadiran] shop list", error);
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-10 text-center">
        <HadiranMark className="mx-auto mb-4 h-12 w-12 text-[#1b1464]" />
        <h1 className="text-3xl font-bold text-slate-900">فروشگاه</h1>
        <p className="mt-3 text-slate-600">
          پرداخت روی ریل بیرونی است. سایت پول را نگه نمی‌دارد؛ بعد از تأیید دریافت، دسترسی دیجیتال باز می‌شود.
        </p>
      </header>
      {items.length === 0 ? (
        <p className="text-center text-slate-500">هنوز کالای منتشرشده‌ای نیست.</p>
      ) : (
        <ul className="grid gap-5 md:grid-cols-2">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={`/shop/${item.slug}`}
                className="block rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:border-indigo-200"
              >
                <h2 className="text-lg font-bold text-slate-900">{item.titleFa}</h2>
                <p className="mt-2 line-clamp-3 text-sm text-slate-600">{item.summaryFa}</p>
                <p className="mt-4 text-sm font-medium text-indigo-700">{formatMoney(item.amount, item.currency)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
