"use client";
import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, Scale, X, Eye, ArrowLeft } from "lucide-react";
import Link from "@/components/workspace/WorkspaceLink";
import { normalizeSearch, useBrowserState, localKey } from "@/lib/landing/browser-state";
import { shopKindFa } from "@/lib/shop/kinds";
import { ProductCard, productPrice, type PublicProduct } from "./ProductCard";
import { LocalCollection, SaveButton, useCollection } from "./LocalCollection";
import { ToolDialog } from "./ToolDialog";
const empty: string[] = [];
function validCompare(value: unknown): value is string[] { return Array.isArray(value) && value.length <= 3 && value.every(row => typeof row === "string"); }
export function ProductExplorer({ items, initialKind = "", scope, preview = false }: { items: PublicProduct[]; initialKind?: string; scope: string; preview?: boolean }) {
  const [kind, setKind] = useState(initialKind);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");
  const [onlySaved, setOnlySaved] = useState(false);
  const [saved] = useCollection(scope);
  const [compareIds, setCompare] = useBrowserState(localKey(scope, "compare"), empty, validCompare);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [quick, setQuick] = useState<PublicProduct | null>(null);
  const [status, setStatus] = useState("");
  const selected = items.filter(item => compareIds.includes(item.slug));
  const rows = useMemo(() => {
    const q = normalizeSearch(query);
    const result = items.filter(item => (!kind || item.kind === kind) && (!onlySaved || saved.some(row => row.href === `/shop/${item.slug}`)) && normalizeSearch(`${item.titleFa} ${item.summaryFa || ""} ${shopKindFa(item.kind)}`).includes(q));
    if (sort === "title") result.sort((a, b) => a.titleFa.localeCompare(b.titleFa, "fa"));
    if (sort === "low" || sort === "high") result.sort((a, b) => {
      const ac = ["IRR", "IRT"].includes(a.currency) ? "IRAN" : a.currency;
      const bc = ["IRR", "IRT"].includes(b.currency) ? "IRAN" : b.currency;
      if (ac !== bc) return ac.localeCompare(bc);
      const av = a.currency === "IRR" ? a.amount / 10 : a.amount;
      const bv = b.currency === "IRR" ? b.amount / 10 : b.amount;
      return (av - bv) * (sort === "low" ? 1 : -1);
    });
    return result;
  }, [items, kind, onlySaved, query, saved, sort]);
  function chooseKind(next: string) {
    setKind(next);
    const url = new URL(window.location.href); if (next) url.searchParams.set("kind", next); else url.searchParams.delete("kind");
    window.history.replaceState(null, "", url.pathname + url.search);
  }
  function toggleCompare(item: PublicProduct) {
    if (compareIds.includes(item.slug)) { setCompare(compareIds.filter(slug => slug !== item.slug)); setStatus("از مقایسه برداشته شد."); }
    else if (selected.length >= 3) setStatus("حداکثر سه محصول را مقایسه کن؛ ابتدا یکی را بردار.");
    else { const persisted = setCompare([...selected.map(row => row.slug), item.slug]); setStatus(persisted ? "به مقایسه اضافه شد." : "فقط تا بستن صفحه در مقایسه می‌ماند؛ حافظهٔ مرورگر در دسترس نیست."); }
  }
  return <>
    <section className="lp-intent-finder" aria-labelledby="intent-title"><div><span className="lp-eyebrow">راهنمای انتخاب / بر اساس قالب محصول</span><h2 id="intent-title">این بار چطور شروع می‌کنی؟</h2><p>یک قالب انتخاب کن؛ قفسه را برایت مرتب می‌کنیم.</p></div><div className="lp-intent-options">{[["physical_good", "با دست بنویسم", "دفتر و ابزار فیزیکی", "۰۱"], ["digital_entitlement", "همراهم بخوانم", "راهنمای دیجیتال", "۰۲"], ["course_access", "با آموزش جلو بروم", "دوره و آموزش", "۰۳"]].map(([value, title, note, number]) => <button type="button" key={value} aria-pressed={kind === value} onClick={() => chooseKind(kind === value ? "" : value)}><span>{number}</span><strong>{title}</strong><small>{note}</small><ArrowLeft size={16} /></button>)}</div></section>
    <div className="lp-explorer-toolbar"><label className="lp-search"><Search size={18} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="نام یا توضیح محصول…" aria-label="جست‌وجوی محصول" />{query && <button type="button" aria-label="پاک کردن جست‌وجو" onClick={() => setQuery("")}><X size={16} /></button>}</label><label className="lp-sort"><SlidersHorizontal size={16} /><span className="sr-only">مرتب‌سازی محصولات</span><select value={sort} onChange={e => setSort(e.target.value)} aria-label="مرتب‌سازی محصولات"><option value="newest">ترتیب پیش‌فرض</option><option value="low">قیمت کمتر</option><option value="high">قیمت بیشتر</option><option value="title">نام محصول</option></select></label><LocalCollection scope={scope} /></div>
    {new Set(items.map(item => ["IRR", "IRT"].includes(item.currency) ? "IRAN" : item.currency)).size > 1 && <p className="lp-local-note">مرتب‌سازی قیمت داخل هر واحد پولی انجام می‌شود؛ نرخ تبدیل ارز اعمال نمی‌شود.</p>}
    <div className="lp-catalog-bar"><nav className="lp-filters" aria-label="نوع محصول">{[["", "همهٔ محصولات"], ["physical_good", "فیزیکی"], ["digital_entitlement", "دیجیتال"], ["course_access", "دوره‌ها"]].map(([value, label]) => <button type="button" key={value} aria-pressed={kind === value} onClick={() => chooseKind(value)}>{label}</button>)}</nav><button type="button" className="lp-tool-button" aria-pressed={onlySaved} onClick={() => setOnlySaved(value => !value)}>فقط نشان‌شده‌ها</button><span role="status">{rows.length.toLocaleString("fa-IR")} محصول</span></div>
    {rows.length ? <div className="lp-product-grid">{rows.map(item => <article key={item.slug} className="lp-interactive-card"><ProductCard item={item} /><div className="lp-card-actions"><SaveButton scope={scope} item={{ href: `/shop/${item.slug}`, title: item.titleFa, kind: "product" }} /><button type="button" className="lp-tool-button" aria-pressed={compareIds.includes(item.slug)} onClick={() => toggleCompare(item)}><Scale size={16} /> مقایسه<span className="sr-only"> {item.titleFa}</span></button><button type="button" className="lp-icon-button" aria-label={`نگاه سریع به ${item.titleFa}`} onClick={() => setQuick(item)}><Eye size={18} /></button></div></article>)}</div> : <div className="lp-empty"><Search size={32} /><h2>این انتخاب هنوز نتیجه‌ای ندارد.</h2><p>جست‌وجو یا فیلتر را تغییر بده؛ محصولی به‌جای نتیجهٔ واقعی نمی‌سازیم.</p><button type="button" className="lp-tool-button" onClick={() => { setQuery(""); chooseKind(""); setOnlySaved(false); }}>پاک کردن فیلترها</button></div>}
    <p className="lp-feedback" role="status">{status}</p>
    {selected.length > 0 && <aside className="lp-compare-tray" aria-label="محصول‌های انتخاب‌شده برای مقایسه"><div><Scale size={20} /><strong>{selected.length.toLocaleString("fa-IR")} محصول</strong><span>{selected.map(item => item.titleFa).join(" / ")}</span></div><button type="button" className="lp-button" disabled={selected.length < 2} onClick={() => setComparisonOpen(true)}>مقایسه کن <ArrowLeft size={17} /></button><button type="button" className="lp-icon-button" aria-label="پاک کردن مقایسه" onClick={() => setCompare([])}><X size={18} /></button>{selected.length === 1 && <small>یک محصول دیگر انتخاب کن.</small>}</aside>}
    <ToolDialog open={comparisonOpen} onClose={() => setComparisonOpen(false)} title="کنار هم، روشن‌تر انتخاب کن" wide><p className="lp-local-note">{preview ? "حالت نمایشی: قیمت‌ها نمونه‌اند و خرید غیرفعال است. " : ""}اطلاعات ثبت‌شدهٔ محصول‌ها؛ نبود اطلاعات به معنی نبود ویژگی نیست. قیمت ارزهای متفاوت بدون تبدیل نمایش داده می‌شود.</p><div className="lp-comparison-scroll"><table className="lp-comparison"><caption className="sr-only">مقایسهٔ ویژگی و قیمت محصول‌ها</caption><thead><tr><th scope="col">ویژگی</th>{selected.map(item => <th scope="col" key={item.slug}><Link href={`/shop/${item.slug}`}>{item.titleFa} ↖</Link></th>)}</tr></thead><tbody><tr><th scope="row">قالب</th>{selected.map(item => <td key={item.slug}>{shopKindFa(item.kind)}</td>)}</tr><tr><th scope="row">قیمت</th>{selected.map(item => <td key={item.slug}>{productPrice(item.amount, item.currency)}</td>)}</tr><tr><th scope="row">درباره</th>{selected.map(item => <td key={item.slug}>{item.summaryFa || "ثبت نشده"}</td>)}</tr>{[...new Set(selected.flatMap(item => (item.specs || []).map(spec => spec.key)))].map(label => <tr key={label}><th scope="row">{label}</th>{selected.map(item => <td key={item.slug}>{item.specs?.find(spec => spec.key === label)?.value || "ثبت نشده"}</td>)}</tr>)}<tr><th scope="row">انتخاب</th>{selected.map(item => <td key={item.slug}><button type="button" className="lp-tool-button" onClick={() => toggleCompare(item)}>برداشتن از مقایسه</button></td>)}</tr></tbody></table></div></ToolDialog>
    <ToolDialog open={Boolean(quick)} onClose={() => setQuick(null)} title={quick?.titleFa || "نگاه سریع"}>{quick && <>{preview && <p className="lp-local-note">محصول و قیمت نمایشی؛ خرید غیرفعال است.</p>}<ProductCard item={quick} /><div className="lp-tool-row"><SaveButton scope={scope} item={{ href: `/shop/${quick.slug}`, title: quick.titleFa, kind: "product" }} /><button type="button" className="lp-tool-button" aria-pressed={compareIds.includes(quick.slug)} onClick={() => toggleCompare(quick)}><Scale size={17} /> مقایسه</button><Link href={`/shop/${quick.slug}`} className="lp-button">جزئیات و دسترسی <ArrowLeft size={17} /></Link></div></>}</ToolDialog>
  </>;
}
