import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { shopListings, shopOrders } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requirePageAccount } from "@/lib/auth/guard";
import { formatMoney } from "@/lib/shop/money";
import { orderStateFa } from "@/lib/shop/states";
import { BuyerOrderActions } from "@/components/shop/BuyerOrderActions";
import { MarkdownReadonly } from "@/components/MarkdownReadonly";
import { hasListingEntitlement } from "@/lib/shop/access";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "سفارش",
  robots: { index: false, follow: false },
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ShopOrderPage({ params }: Props) {
  const { id } = await params;
  const account = await requirePageAccount(`/shop/orders/${id}`);
  const [order] = await db.select().from(shopOrders).where(eq(shopOrders.id, id));
  if (!order) notFound();
  if (account.role !== "owner" && order.buyerId !== account.id) notFound();
  const [listing] = await db.select().from(shopListings).where(eq(shopListings.id, order.listingId));
  if (!listing) notFound();
  const entitled = account.role === "owner" || (await hasListingEntitlement(account.id, listing.id));

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <Link href={`/shop/${listing.slug}`} className="text-sm text-slate-500 hover:text-indigo-600">
        بازگشت به کالا
      </Link>
      <h1 className="text-2xl font-bold text-slate-900">{listing.titleFa}</h1>
      <p className="text-sm text-slate-500">{orderStateFa(order.state)}</p>
      <p className="text-lg font-medium text-indigo-700">{formatMoney(order.amount, order.currency)}</p>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 text-sm">
        <p className="font-medium text-slate-900">مقصد دریافت (ریل بیرونی)</p>
        <p className="mt-2 font-mono text-slate-800" dir="ltr">
          {order.payoutHandleSnapshot}
        </p>
        {order.payoutAliasSnapshot ? <p className="mt-1 text-slate-500">{order.payoutAliasSnapshot}</p> : null}
        <p className="mt-3 text-xs text-slate-500">
          مبلغ را بیرون از سایت بفرست، بعد شمارهٔ پیگیری را همین‌جا بگذار. هادیران این شماره را معنا نمی‌کند.
        </p>
      </section>

      {order.paymentReference ? (
        <p className="text-sm text-slate-600">
          پیگیری ثبت‌شده: <span dir="ltr">{order.paymentReference}</span>
        </p>
      ) : null}
      {order.declineReason ? <p className="text-sm text-rose-700">دلیل رد: {order.declineReason}</p> : null}

      {account.role !== "owner" ? <BuyerOrderActions orderId={order.id} state={order.state} /> : null}

      {entitled && order.state === "settled" ? (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="mb-2 text-sm font-medium text-emerald-800">تحویل دسترسی</p>
          <MarkdownReadonly source={listing.accessBodyFa} emptyLabel="محتوای تحویل خالی است." />
          <Link href={`/shop/${listing.slug}`} className="mt-3 inline-block text-sm text-indigo-600">
            صفحهٔ کالا
          </Link>
        </section>
      ) : null}
    </main>
  );
}
