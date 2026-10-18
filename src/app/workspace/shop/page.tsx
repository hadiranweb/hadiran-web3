import { ModuleHeading } from "@/components/workspace/ModuleHeading";
import Link from "@/components/workspace/WorkspaceLink";
import { db } from "@/db";
import { accounts, shopListings, shopOrders, shopPayoutDestinations } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { requirePageOwner } from "@/lib/auth/guard";
import { formatMoney } from "@/lib/shop/money";
import { orderStateFa } from "@/lib/shop/states";
import { PayoutForm } from "@/components/shop/PayoutForm";
import { OwnerOrderActions } from "@/components/shop/OwnerOrderActions";
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
  const account = await requirePageOwner("/workspace/shop");
  let unavailable = false;
  let listings: (typeof shopListings.$inferSelect)[] = [];
  let orders: {
    order: typeof shopOrders.$inferSelect;
    listingTitle: string;
    listingSlug: string;
    buyerPhone: string;
  }[] = [];
  let payout: typeof shopPayoutDestinations.$inferSelect | null = null;
  let usdRate: number | null = null;
  try {
    if (account.id === 0) throw new Error("preview_without_database");
    listings = await db.select().from(shopListings).orderBy(desc(shopListings.updatedAt));
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
    const [row] = await db.select().from(shopPayoutDestinations).where(eq(shopPayoutDestinations.id, 1));
    payout = row ?? null;
    usdRate = await getShopUsdRate();
  } catch (error) {
    unavailable = true;
    if (account.id !== 0) console.error("[hadiran] workspace shop", error);
  }

  const pending = orders.filter((row) => row.order.state === "awaiting_confirmation");

  return (
    <main className="ws-page repo-module space-y-8">
      <ModuleHeading title="فروشگاه" en="Shop management" lede="مدیریت کالاها، سفارش‌ها، مقصد دریافت و قیمت‌گذاری دلاری." ledeEn="Manage listings, orders, payout details and USD pricing." action={<Link href="/workspace/shop/listings/new" className="ws-button ws-primary">کالای جدید</Link>} />
      {unavailable ? <p className="integration-notice">{account.id === 0 ? "در پیش‌نمایش، فروشگاه واقعی به دیتابیس متصل نیست. فرم‌های جدید قابل مشاهده‌اند اما ذخیره، تأیید سفارش و پرداخت نمایشی ساخته نمی‌شود." : "اتصال فروشگاه برقرار نیست؛ فهرست خالی زیر به معنی نبود کالا یا سفارش نیست. اتصال و migrationها را بررسی کنید."}</p> : null}


      {!payout ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          تا مقصد دریافت ذخیره نشود، خریدار نمی‌تواند سفارش بسازد.
        </p>
      ) : null}
      <fieldset disabled={unavailable} className="space-y-6 disabled:opacity-60"><UsdRateForm initialRate={usdRate} />
      <PayoutForm
        initial={payout ? { accountHandle: payout.accountHandle, accountAlias: payout.accountAlias } : null}
      />
      </fieldset>

      <section>
        <h2 className="mb-3 text-lg font-bold text-ink">در انتظار تأیید</h2>
        {pending.length === 0 ? (
          <p className="text-sm text-muted">سفارشی منتظر تأیید نیست.</p>
        ) : (
          <ul className="space-y-4">
            {pending.map(({ order, listingTitle, buyerPhone }) => (
              <li key={order.id} className="space-y-3 rounded-2xl border border-line bg-elev p-4">
                <p className="font-medium text-ink">{listingTitle}</p>
                <p className="text-xs text-muted">
                  {formatMoney(order.amount, order.currency)} · خریدار {buyerPhone} · پیگیری{" "}
                  <span dir="ltr">{order.paymentReference}</span>
                </p>
                <OwnerOrderActions orderId={order.id} state={order.state} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold text-ink">کالاها</h2>
        {listings.length === 0 ? (
          <p className="text-sm text-muted">کالایی نیست.</p>
        ) : (
          <ul className="space-y-2">
            {listings.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/workspace/shop/listings/${item.id}`}
                  className="block rounded-2xl border border-line bg-elev p-4 hover:border-accent"
                >
                  <p className="font-medium text-ink">{item.titleFa}</p>
                  <p className="mt-1 text-xs text-muted">
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
        <h2 className="mb-3 text-lg font-bold text-ink">سفارش‌های اخیر</h2>
        {orders.length === 0 ? (
          <p className="text-sm text-muted">سفارشی نیست.</p>
        ) : (
          <ul className="space-y-2">
            {orders.map(({ order, listingTitle, listingSlug }) => (
              <li key={order.id} className="rounded-2xl border border-line bg-elev px-4 py-3 text-sm">
                <p className="font-medium text-ink">{listingTitle}</p>
                <p className="text-xs text-muted">
                  {orderStateFa(order.state)} · {formatMoney(order.amount, order.currency)}
                </p>
                <Link href={`/shop/${listingSlug}`} className="text-xs text-mark">
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
