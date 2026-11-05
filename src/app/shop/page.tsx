import Link from "@/components/workspace/WorkspaceLink";
import { db } from "@/db";
import { shopListings } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { isShopKind } from "@/lib/shop/kinds";
import type { Metadata } from "next";
import { ProductExplorer } from "@/components/landing/ProductExplorer";
import { getCurrentAccount } from "@/lib/auth/session";
import { browserScope } from "@/lib/landing/scope";
import { PreviewNotice } from "@/components/landing/PreviewNotice";
import { landingPreviewEnabled, sampleListings } from "@/lib/landing/preview";
import { ArrowUpLeft } from "lucide-react";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "فروشگاه", description: "محصول‌ها و ابزارهایی برای فکر کردن، یاد گرفتن و یک قدم روشن‌تر برداشتن.", alternates: { canonical: "/shop" } };
export default async function ShopPage({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  const { kind: kindRaw } = await searchParams;
  const kind = kindRaw && isShopKind(kindRaw) ? kindRaw : null;
  const preview = landingPreviewEnabled();
  let items: (typeof shopListings.$inferSelect)[] = [];
  const account = await getCurrentAccount();
  if (preview) items = sampleListings;
  else try {
    const published = eq(shopListings.published, true);
    items = await db.select().from(shopListings).where(published).orderBy(desc(shopListings.updatedAt));
  } catch (error) { console.error("[hadiran] shop list", error); }
  return <main className="lp-page"><header className="lp-collection-header"><span className="lp-eyebrow">فروشگاه هادیران / برای یک قدم روشن‌تر</span><h1>چیزهای کوچک.<br /><span>امکان‌های تازه.</span></h1><div className="lp-collection-intro"><p>ابزارهایی برای مکث کردن، دیدن رابطه‌ها و ساختنِ قدم بعدی.<br />از یک دفتر روی میز، تا راهنمایی که همراهت می‌ماند.</p><Link href="/knowledge" className="lp-text-link">اول کمی بخوانیم <ArrowUpLeft size={18} /></Link></div></header>
    {preview && <PreviewNotice compact />}
    <ProductExplorer preview={preview} scope={browserScope(account)} initialKind={kind || ""} items={items.map(item => ({ slug: item.slug, titleFa: item.titleFa, summaryFa: item.summaryFa, amount: item.amount, currency: item.currency, kind: item.kind, specs: item.specs, comparePrice: item.comparePrice, coverImageUrl: item.coverImageUrl }))} />
    <section className="lp-shop-note"><span className="lp-eyebrow">از دانستن تا به‌کار بستن</span><h2>یک ابزار خوب،<br />جای فکر کردن را نمی‌گیرد.</h2><p>فقط کمک می‌کند واضح‌تر ببینی، سؤال بهتری بپرسی<br />و از همان جایی که هستی، شروع کنی.</p><Link href="/analyzers" className="lp-text-link">خودت را در آینه‌ها ببین <ArrowUpLeft size={18} /></Link></section>
  </main>;
}
