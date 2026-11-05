import Link from "@/components/workspace/WorkspaceLink";
import type { shopListings } from "@/db/schema";
import { ArrowUpLeft, Package } from "lucide-react";
import { isPhysicalKind, shopKindFa } from "@/lib/shop/kinds";
import { formatMoney } from "@/lib/shop/money";
export type PublicProduct = Pick<typeof shopListings.$inferSelect, "slug" | "titleFa" | "summaryFa" | "amount" | "currency" | "kind" | "specs" | "comparePrice" | "coverImageUrl">;
export function productPrice(amount: number, currency: string) {
  return currency === "IRR" ? `${(amount / 10).toLocaleString("fa-IR", { maximumFractionDigits: 1 })} تومان` : currency === "IRT" ? `${amount.toLocaleString("fa-IR")} تومان` : formatMoney(amount, currency);
}
export function ProductCard({ item }: { item: PublicProduct }) {
  return <Link href={`/shop/${item.slug}`} className="lp-product-card"><div className={`lp-card-image ${isPhysicalKind(item.kind) ? "" : "is-digital"}`}>
    {item.coverImageUrl ? <>{/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={item.coverImageUrl} alt={item.titleFa} loading="lazy" /></> : <Package size={60} strokeWidth={.8} />}
    <span className="lp-image-label">{shopKindFa(item.kind)}</span><span className="lp-card-arrow"><ArrowUpLeft size={19} /></span>
  </div><div className="lp-card-line"><h2>{item.titleFa}</h2><span>{productPrice(item.amount, item.currency)}</span></div>{item.summaryFa && <p>{item.summaryFa}</p>}</Link>;
}
