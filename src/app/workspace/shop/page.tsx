import Link from "next/link";
import { db } from "@/db";
import { accounts, assessmentOrders, shopListings, shopOrders, shopPayoutDestinations } from "@/db/schema";
import { desc, eq, inArray } from "drizzle-orm";
import { requirePageOwner } from "@/lib/auth/guard";
import { financeDateFa } from "@/lib/finance/period";
import { financeMoney } from "@/lib/finance/types";
import { formatMoney } from "@/lib/shop/money";
import { orderStateFa } from "@/lib/shop/states";
import { PayoutForm } from "@/components/shop/PayoutForm";
import { OwnerOrderActions } from "@/components/shop/OwnerOrderActions";
import { AssessmentOrderActions } from "@/components/shop/AssessmentOrderActions";
import { UsdRateForm } from "@/components/shop/UsdRateForm";
import { getShopUsdRate } from "@/lib/shop/price-engine";
import { shopKindFa } from "@/lib/shop/kinds";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "فروشگاه میز",
  robots: { index: false, follow: false },
};

export default async function WorkspaceShopPage() {
  await requirePageOwner("/workspace/shop");
  let listings: (typeof shopListings.$inferSelect)[] = [];
  let orders: {
    order: typeof shopOrders.$inferSelect;
    listingTitle: string;
    listingSlug: string;
    buyerPhone: string;
  }[] = [];
  let payout: typeof shopPayoutDestinations.$inferSelect | null = null;
  let usdRate: number | null = null;
  let pending: {
    order: typeof shopOrders.$inferSelect;
    listingTitle: string;
    listingSlug: string;
    buyerPhone: string;
  }[] = [];
  let assessmentPending: {
    order: typeof assessmentOrders.$inferSelect;
    buyerPhone: string;
  }[] = [];
  try {
    listings = await db.select().from(shopListings).orderBy(desc(shopListings.updatedAt));
    pending = await db
      .select({
        order: shopOrders,
        listingTitle: shopListings.titleFa,
        listingSlug: shopListings.slug,
        buyerPhone: accounts.phone,
      })
      .from(shopOrders)
      .innerJoin(shopListings, eq(shopOrders.listingId, shopListings.id))
      .innerJoin(accounts, eq(shopOrders.buyerId, accounts.id))
      .where(eq(shopOrders.state, "awaiting_confirmation"))
      .orderBy(desc(shopOrders.updatedAt));
    const orderRows = await db
      .select({
        order: shopOrders,
        listingTitle: shopListings.titleFa,
        listingSlug: shopListings.slug,
        buyerPhone: accounts.phone,
      })
      .from(shopOrders)
      .innerJoin(shopListings, eq(shopOrders.listingId, shopListings.id))
      .innerJoin(accounts, eq(shopOrders.buyerId, accounts.id))
      .orderBy(desc(shopOrders.updatedAt))
      .limit(40);
    orders = orderRows;
    try {
      assessmentPending = await db
        .select({
          order: assessmentOrders,
          buyerPhone: accounts.phone,
        })
        .from(assessmentOrders)
        .innerJoin(accounts, eq(assessmentOrders.buyerId, accounts.id))
        .where(inArray(assessmentOrders.state, ["awaiting_confirmation", "captured"]))
        .orderBy(desc(assessmentOrders.updatedAt));
    } catch (error) {
      console.error("[hadiran] workspace shop assessment", error);
      assessmentPending = [];
    }
    const [row] = await db.select().from(shopPayoutDestinations).where(eq(shopPayoutDestinations.id, 1));
    payout = row ?? null;
    usdRate = await getShopUsdRate();
  } catch (error) {
    console.error("[hadiran] workspace shop", error);
  }

  return (
    <main className="mx-auto max-w-3xl space-y-10 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">فروشگاه</h1>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link href="/workspace/shop/orders" className="text-accent">
            مرکز سفارش
          </Link>
          <Link href="/workspace/finance" className="text-accent">
            گزارش مالی
          </Link>
          <Link href="/workspace/shop/listings/new" className="rounded-xl bg-slate-900 px-4 py-2 text-white">
            کالای جدید
          </Link>
        </div>
      </div>

      {!payout ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          تا مقصد دریافت ذخیره نشود، خریدار نمی‌تواند سفارش بسازد.
        </p>
      ) : null}
      <UsdRateForm initialRate={usdRate} />
      <PayoutForm
        initial={payout ? { accountHandle: payout.accountHandle, accountAlias: payout.accountAlias } : null}
      />

      <section>
        <h2 className="mb-3 text-lg font-bold text-slate-900">در انتظار تأیید</h2>
        {pending.length === 0 ? (
          <p className="text-sm text-slate-500">سفارشی منتظر تأیید نیست.</p>
        ) : (
          <ul className="space-y-4">
            {pending.map(({ order, listingTitle, buyerPhone }) => (
              <li key={order.id} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
                <p className="font-medium text-slate-900">{listingTitle}</p>
                <p className="text-xs text-slate-500" dir="ltr">
                  {order.id}
                </p>
                <p className="text-xs text-slate-500">
                  {formatMoney(order.amount, order.currency)} · خریدار {buyerPhone} · پیگیری{" "}
                  <span dir="ltr">{order.paymentReference}</span>
                </p>
                <p className="text-xs text-slate-500">ثبت {financeDateFa(order.createdAt)}</p>
                <OwnerOrderActions orderId={order.id} state={order.state} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold text-slate-900">خدمات آزمون در انتظار</h2>
        {assessmentPending.length === 0 ? (
          <p className="text-sm text-slate-500">سفارش آزمونی منتظر تأیید یا برگشت نیست.</p>
        ) : (
          <ul className="space-y-4">
            {assessmentPending.map(({ order, buyerPhone }) => (
              <li key={order.id} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
                <p className="font-medium text-slate-900">
                  {order.analyzerSlug} · {order.service === "document" ? "سند" : "تفسیر"}
                </p>
                <p className="text-xs text-slate-500" dir="ltr">
                  {order.id}
                </p>
                <p className="text-xs text-slate-500">
                  {financeMoney(String(order.payableIrr), order.currency)} · خریدار {buyerPhone}
                  {order.paymentReference ? (
                    <>
                      {" "}
                      · پیگیری <span dir="ltr">{order.paymentReference}</span>
                    </>
                  ) : null}
                </p>
                <p className="text-xs text-slate-500">ثبت {financeDateFa(order.createdAt)}</p>
                <AssessmentOrderActions orderId={order.id} state={order.state} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold text-slate-900">کالاها</h2>
        {listings.length === 0 ? (
          <p className="text-sm text-slate-500">کالایی نیست.</p>
        ) : (
          <ul className="space-y-2">
            {listings.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/workspace/shop/listings/${item.id}`}
                  className="block rounded-2xl border border-slate-200 bg-white p-4 hover:border-indigo-200"
                >
                  <p className="font-medium text-slate-900">{item.titleFa}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {item.published ? "منتشر" : "پیش‌نویس"} · {shopKindFa(item.kind)} ·{" "}
                    {formatMoney(item.amount, item.currency)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold text-slate-900">سفارش‌های اخیر</h2>
        {orders.length === 0 ? (
          <p className="text-sm text-slate-500">سفارشی نیست.</p>
        ) : (
          <ul className="space-y-2">
            {orders.map(({ order, listingTitle, listingSlug }) => (
              <li key={order.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">
                <p className="font-medium text-slate-900">{listingTitle}</p>
                <p className="text-xs text-slate-500" dir="ltr">
                  {order.id}
                </p>
                <p className="text-xs text-slate-500">
                  {orderStateFa(order.state)} · {formatMoney(order.amount, order.currency)} · ثبت {financeDateFa(order.createdAt)}
                </p>
                <Link href={`/shop/${listingSlug}`} className="text-xs text-indigo-600">
                  صفحهٔ عمومی
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
