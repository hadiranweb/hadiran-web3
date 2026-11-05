"use client";
import { useState } from "react";
import { Bookmark, Check, Library, Share2, Trash2, ArrowUpLeft } from "lucide-react";
import Link from "@/components/workspace/WorkspaceLink";
import { localKey, useBrowserState } from "@/lib/landing/browser-state";
import { ToolDialog } from "./ToolDialog";

export type SavedItem = { href: string; title: string; kind: "product" | "knowledge" };
const empty: SavedItem[] = [];
function validSaved(value: unknown): value is SavedItem[] {
  return Array.isArray(value) && value.length <= 200 && value.every(item => item && typeof item.title === "string" && typeof item.href === "string" && /^\/(shop|knowledge)\/[^/?#]+$/.test(item.href) && ["product", "knowledge"].includes(item.kind));
}
export function useCollection(scope: string) { return useBrowserState(localKey(scope, "saved"), empty, validSaved); }
export function SaveButton({ scope, item }: { scope: string; item: SavedItem }) {
  const [items, update] = useCollection(scope);
  const [status, setStatus] = useState("");
  const saved = items.some(row => row.href === item.href);
  return <><button type="button" className="lp-tool-button" aria-pressed={saved} onClick={() => {
    const persisted = update(saved ? items.filter(row => row.href !== item.href) : [...items.filter(row => row.href !== item.href).slice(-199), item]);
    setStatus(persisted ? saved ? "نشان برداشته شد." : "در همین مرورگر نشان شد." : "حافظهٔ مرورگر در دسترس نیست؛ فقط تا بستن این صفحه می‌ماند.");
  }}>{saved ? <Check size={17} /> : <Bookmark size={17} />}{saved ? "نشان شده" : "نشان کردن"}</button><span className="sr-only" role="status">{status}</span></>;
}
export function LocalCollection({ scope }: { scope: string }) {
  const [items, update] = useCollection(scope);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const visible = items.filter(item => filter === "all" || item.kind === filter);
  return <><button type="button" className="lp-tool-button" onClick={() => setOpen(true)}><Library size={17} /> نشان‌شده‌ها <span className="lp-counter">{items.length.toLocaleString("fa-IR")}</span></button>
    <ToolDialog open={open} onClose={() => setOpen(false)} title="قفسهٔ نشان‌شده‌های من">
      <p className="lp-local-note">فقط در این مرورگر، جدا برای مهمان و هر حساب؛ بدون همگام‌سازی یا رمزگذاری. روی دستگاه مشترک، مواردت را پاک کن. تا ۲۰۰ نشان آخر نگه داشته می‌شود؛ نشان‌ها مجوز خرید یا دسترسی نیستند.</p>
      <div className="lp-tool-row">{[["all", "همه"], ["product", "محصول"], ["knowledge", "نوشته"]].map(([value, label]) => <button type="button" key={value} className="lp-tool-button" aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}</button>)}</div>
      <div className="lp-saved-list">{visible.length ? [...visible].reverse().map(item => <article key={item.href}><div><span className="lp-eyebrow">{item.kind === "product" ? "فروشگاه" : "باغ دانش"}</span><Link href={item.href} onClick={() => setOpen(false)}>{item.title} <ArrowUpLeft size={16} /></Link></div><button type="button" className="lp-icon-button" aria-label={`برداشتن نشان ${item.title}`} onClick={() => update(items.filter(row => row.href !== item.href))}><Trash2 size={17} /></button></article>) : <div className="lp-empty"><Bookmark size={30} /><h3>برای بعد، چیزی نگه دار.</h3><p>محصول‌ها و نوشته‌ها را با دکمهٔ نشان کردن به این قفسه اضافه کن.</p></div>}</div>
    </ToolDialog></>;
}
export function ShareButton() {
  const [message, setMessage] = useState("");
  const [manual, setManual] = useState("");
  async function copy() {
    // Never include preview tickets, account queries, or private fragments.
    const url = window.location.origin + window.location.pathname;
    try { await navigator.clipboard.writeText(url); setMessage("پیوند عمومی کپی شد."); setManual(""); }
    catch { setManual(url); setMessage("کپی خودکار ممکن نشد؛ پیوند زیر را انتخاب و کپی کن."); }
  }
  return <><button type="button" onClick={copy} className="lp-tool-button"><Share2 size={17} /> کپی پیوند</button><span className="lp-share-status" role="status">{message}</span>{manual && <input className="lp-manual-link" aria-label="پیوند عمومی برای کپی دستی" dir="ltr" readOnly value={manual} onFocus={e => e.currentTarget.select()} />}</>;
}
