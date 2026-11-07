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
import { getAssessmentAuthoringQuota } from "@/lib/analyzers/subscriptions";
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
  const isAuthoringSubscription = listing.kind === "assessment_authoring_subscription";
  const entitled = !isAuthoringSubscription && (account.role === "owner" || (await hasListingEntitlement(account.id, listing.id)));
  const authoringQuota =
    isAuthoringSubscription && account.role !== "owner"
      ? await getAssessmentAuthoringQuota(account.id).catch((error) => {
          console.error("[hadiran] shop order authoring quota", error);
          return null;
        })
      : null;

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <Link href={`/shop/${listing.slug}`} className="text-sm text-muted hover:text-ink">
        بازگشت به کالا
      </Link>
      <h1 className="text-2xl font-bold text-ink">{listing.titleFa}</h1>
      <p className="text-sm text-muted">{orderStateFa(order.state)}</p>
      <p className="text-lg font-medium text-accent">{formatMoney(order.amount, order.currency)}</p>

      <section className="surface p-4 text-sm">
        <p className="font-medium text-ink">مقصد دریافت (ریل بیرونی)</p>
        <p className="mt-2 font-mono text-ink" dir="ltr">
          {order.payoutHandleSnapshot}
        </p>
        {order.payoutAliasSnapshot ? <p className="mt-1 text-muted">{order.payoutAliasSnapshot}</p> : null}
        <p className="mt-3 text-xs text-muted">
          مبلغ را بیرون از سایت بفرست، بعد شمارهٔ پیگیری را همین‌جا بگذار. هادیران این شماره را معنا نمی‌کند.
        </p>
      </section>

      {order.paymentReference ? (
        <p className="text-sm text-muted">
          پیگیری ثبت‌شده: <span dir="ltr">{order.paymentReference}</span>
        </p>
      ) : null}
      {order.declineReason ? <p className="text-sm text-red-700 dark:text-red-300">دلیل رد: {order.declineReason}</p> : null}

      {account.role !== "owner" ? <BuyerOrderActions orderId={order.id} state={order.state} /> : null}

      {isAuthoringSubscription && order.state === "settled" ? (
        <section className="surface space-y-3 p-4">
          <p className="text-sm font-medium text-good">اشتراک آزمون‌ساز پس از تأیید سفارش فعال شده است.</p>
          {authoringQuota ? (
            <p className="text-sm text-muted">
              سهمیهٔ قابل استفاده: {authoringQuota.remaining?.toLocaleString("fa-IR") ?? "۰"} آزمون.
            </p>
          ) : null}
          <Link href="/workspace/analyzers" className="inline-block text-sm text-accent">
            رفتن به میز آزمون‌ساز
          </Link>
        </section>
      ) : entitled && order.state === "settled" ? (
        <section className="surface p-4">
          <p className="mb-2 text-sm font-medium text-good">تحویل دسترسی</p>
          <MarkdownReadonly source={listing.accessBodyFa} emptyLabel="محتوای تحویل خالی است." />
          <Link href={`/shop/${listing.slug}`} className="mt-3 inline-block text-sm text-accent">
            صفحهٔ کالا
          </Link>
        </section>
      ) : null}
    </main>
  );
}
