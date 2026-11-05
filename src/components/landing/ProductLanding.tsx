import type { ReactNode } from "react";
import Link from "@/components/workspace/WorkspaceLink";
import { ArrowUpLeft, ArrowLeft, Package, FileText, ShieldCheck } from "lucide-react";
import { isPhysicalKind, shopKindFa } from "@/lib/shop/kinds";
import { formatMoney } from "@/lib/shop/money";
import { MarkdownReadonly } from "@/components/MarkdownReadonly";
import { ListingSpecs } from "@/components/shop/ListingSpecs";
import { ProductGallery } from "./ProductGallery";
import { PreviewNotice } from "./PreviewNotice";
import { ProductCard, productPrice, type PublicProduct } from "./ProductCard";
import { LocalCollection, SaveButton, ShareButton } from "./LocalCollection";
import { ProductSample } from "./ProductSample";
export { ProductCard, productPrice } from "./ProductCard";
export type { PublicProduct } from "./ProductCard";
export function ProductLanding({ item, images, action, related = [], preview = false, connections, storageScope = "guest" }: { item: PublicProduct & { bodyFa?: string | null }; storageScope?: string; connections?: ReactNode; images: string[]; action: ReactNode; related?: PublicProduct[]; preview?: boolean }) {
  const physical = isPhysicalKind(item.kind);
  return <main className="lp-page"><nav className="lp-breadcrumb" aria-label="مسیر صفحه"><Link href="/">هادیران</Link><span>/</span><Link href="/shop">فروشگاه</Link><span>/</span><span>{shopKindFa(item.kind)}</span></nav>
    {preview && <PreviewNotice compact />}
    <article><section className="lp-product-hero"><ProductGallery urls={images} title={item.titleFa} /><div className="lp-buy-box"><span className="lp-eyebrow">چیزهایی برای یک قدم روشن‌تر <span> / {physical ? "۰۱" : "۰۲"}</span></span><p className="lp-kind">{shopKindFa(item.kind)}</p><h1>{item.titleFa}</h1>{item.summaryFa && <p className="lp-lede">{item.summaryFa}</p>}
      <div className="lp-price" title={formatMoney(item.amount, item.currency)}>{item.comparePrice && item.comparePrice > item.amount ? <del>{productPrice(item.comparePrice, item.currency)}</del> : null}<strong>{productPrice(item.amount, item.currency)}</strong>{preview && <span>قیمت نمونه</span>}</div>
      <div className="lp-order-action">{action}</div><p className="lp-fulfillment">{preview ? "این صفحه برای بررسی ظاهر و تجربهٔ کاربری است." : physical ? "موجودی و زمان ارسال هنگام تأیید سفارش مشخص می‌شود." : "دسترسی به محتوای خرید پس از تأیید سفارش باز می‌شود."}</p>
      <div className="lp-tool-row lp-product-tools"><SaveButton scope={storageScope} item={{ href: `/shop/${item.slug}`, title: item.titleFa, kind: "product" }} /><ShareButton /><LocalCollection scope={storageScope} /></div>{preview && !physical && <ProductSample />}<div className="lp-product-facts"><div>{physical ? <Package size={20} /> : <FileText size={20} />}<span>{physical ? "محصول فیزیکی" : "دسترسی دیجیتال"}</span></div><div><ShieldCheck size={20} /><span>{preview ? "بدون تراکنش واقعی" : "تأیید سفارش و دسترسی"}</span></div></div>
      <a href="#product-story" className="lp-text-link">این محصول را بیشتر بشناس <ArrowLeft size={16} /></a>
    </div></section>
    <nav className="lp-section-nav" aria-label="بخش‌های محصول"><a href="#product-story">دربارهٔ محصول</a>{item.specs?.length ? <a href="#product-specs">مشخصات</a> : null}<a href="#product-questions">پرسش‌های متداول</a></nav>
    <div className="lp-product-details"><section id="product-story" className="lp-product-story"><span className="lp-eyebrow">فراتر از یک محصول</span><h2>برای چیزی که می‌خواهی<br />روشن‌تر ببینی.</h2><MarkdownReadonly source={item.bodyFa} /></section><aside id="product-specs" className="lp-spec-panel"><span className="lp-eyebrow">در یک نگاه</span><h2>جزئیات کوچک،<br />انتخاب روشن‌تر.</h2><ListingSpecs specs={item.specs} />{!item.specs?.length && <p>مشخصات تکمیلی هنوز ثبت نشده است.</p>}<Link href="/contact" className="lp-text-link">سؤالی داری؟ گفت‌وگو کنیم <ArrowUpLeft size={16} /></Link></aside></div>
    <section className="lp-faq" id="product-questions"><div><span className="lp-eyebrow">پیش از انتخاب</span><h2>شاید سؤال تو هم باشد.</h2></div><div><details><summary>{physical ? "ارسال محصول چطور هماهنگ می‌شود؟" : "چطور به محتوای محصول دسترسی پیدا می‌کنم؟"}</summary><p>{preview ? "این محصول نمایشی است؛ سفارش، ارسال یا تحویل فایل واقعی برای آن فعال نیست." : physical ? "پس از تأیید سفارش، جزئیات ارسال با شما هماهنگ می‌شود. پیش از تأیید، دربارهٔ موجودی و زمان تحویل سؤال کنید." : "پس از تأیید سفارش، با همان حساب کاربری به این صفحه برگردید. محتوای تحویل در بخش دسترسی نمایش داده می‌شود."}</p></details><details><summary>قبل از انتخاب می‌توانم سؤال بپرسم؟</summary><p>بله. از <Link href="/contact">صفحهٔ ارتباط</Link> با هادیران گفت‌وگو کن و پرسشت را همراه نام محصول بنویس.</p></details><details><summary>آیا این محصول همان تفسیر آزمون است؟</summary><p>نه؛ خرید یک محصول مستقل با سفارش تفسیر یک نوبت آزمون متفاوت است. توضیحات همین صفحه، محتوای این محصول را مشخص می‌کند.</p></details></div></section>
    </article>{connections}{related.length > 0 && <section className="lp-related"><div className="lp-section-heading"><div><span className="lp-eyebrow">مسیرهای نزدیک</span><h2>شاید این هم به کارت بیاید.</h2></div><Link href="/shop" className="lp-text-link">همهٔ محصولات <ArrowLeft size={16} /></Link></div><div className="lp-product-grid">{related.map(product => <ProductCard key={product.slug} item={product} />)}</div></section>}
  </main>;
}
