import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { shopListings, shopOrders } from "@/db/schema";
import { requirePageOwner } from "@/lib/auth/guard";
import { formatMoney } from "@/lib/shop/money";
import { orderStateFa } from "@/lib/shop/states";
import Link from "@/components/workspace/WorkspaceLink";
import { OwnerOrderActions } from "@/components/shop/OwnerOrderActions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "جزئیات سفارش", robots: { index: false, follow: false } };
export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const account = await requirePageOwner("/workspace/shop");
  const { id } = await params;
  if (id.length > 128) notFound();
  let item: { order: typeof shopOrders.$inferSelect; title: string } | null = null;
  let unavailable = account.id === 0;
  if (!unavailable) {
    try {
      const [row] = await db.select({ order: shopOrders, title: shopListings.titleFa }).from(shopOrders)
        .innerJoin(shopListings, eq(shopOrders.listingId, shopListings.id)).where(eq(shopOrders.id, id)).limit(1);
      item = row ?? null;
    } catch { unavailable = true; }
  }
  if (!unavailable && !item) notFound();
  return <main className="ws-page repo-module space-y-6">
    <Link className="ws-text-link" href="/workspace/actions?kind=orders">بازگشت به سفارش‌های منتظر بررسی</Link>
    <h1 className="text-2xl font-bold text-ink">جزئیات سفارش</h1>
    {unavailable ? <p className="integration-notice" role="status">دادهٔ سفارش در دسترس نیست؛ اطلاعات نمونه جایگزین نشده است.</p> : item ? <section className="ws-panel space-y-5 p-6">
      <h2 className="text-lg font-bold text-ink">{item.title}</h2>
      <p className="text-xs text-muted break-all" dir="ltr">{item.order.id}</p>
      <dl className="grid gap-5 sm:grid-cols-2">
        <div><dt className="text-xs text-muted">وضعیت</dt><dd className="mt-1 text-sm text-ink">{orderStateFa(item.order.state)}</dd></div>
        <div><dt className="text-xs text-muted">مبلغ ثبت‌شدهٔ سفارش</dt><dd className="mt-1 text-sm text-ink">{formatMoney(item.order.amount, item.order.currency)}</dd></div>
        <div><dt className="text-xs text-muted">شمارهٔ پیگیری</dt><dd className="mt-1 break-all text-sm text-ink" dir="ltr">{item.order.paymentReference || "—"}</dd></div>
        <div><dt className="text-xs text-muted">علت رد</dt><dd className="mt-1 text-sm text-ink">{item.order.declineReason || "—"}</dd></div>
      </dl>
      <OwnerOrderActions orderId={item.order.id} state={item.order.state} />
    </section> : null}
  </main>;
}
