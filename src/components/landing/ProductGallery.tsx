"use client";
/* Gallery supports arbitrary public image URLs without a remote image optimizer. */
/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { BookOpen, Expand, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from "lucide-react";
import { ToolDialog } from "./ToolDialog";
export function ProductGallery({ urls, title }: { urls: string[]; title: string }) {
  const [selected, setSelected] = useState(0);
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(false);
  const active = urls[selected] || urls[0];
  function move(delta: number) { setSelected(value => (value + delta + urls.length) % urls.length); setZoom(false); }
  return <div className="lp-gallery"><div className="lp-product-image">{active ? <button type="button" className="lp-gallery-open" onClick={() => { setOpen(true); setZoom(false); }} aria-label={`بزرگ‌نمایی تصویر ${title}`}>
    <img src={active} alt={title} fetchPriority="high" /><span className="lp-expand"><Expand size={18} /> مشاهدهٔ تصویر</span></button> : <BookOpen size={96} strokeWidth={.7} aria-label="تصویر محصول ثبت نشده" />}
    <span className="lp-image-signature">هادیران / انتخابی برای فکر کردن</span>
  </div>{urls.length > 1 && <div className="lp-thumbnails" aria-label="تصاویر محصول">{urls.map((url, i) => <button key={`${url}-${i}`} type="button" aria-label={`تصویر ${(i + 1).toLocaleString("fa-IR")}`} aria-pressed={selected === i} onClick={() => setSelected(i)}><img src={url} alt="" loading="lazy" /></button>)}</div>}
    <ToolDialog open={open} onClose={() => setOpen(false)} title={title} wide><div className="lp-lightbox" onKeyDown={e => { if (urls.length > 1 && ["ArrowLeft", "ArrowRight"].includes(e.key)) { e.preventDefault(); move(e.key === "ArrowLeft" ? 1 : -1); } }}><div className="lp-zoom-viewport" tabIndex={0} aria-label="تصویر؛ در حالت بزرگ‌نمایی با پیمایش حرکت کن"><img src={active} alt={title} style={{ width: zoom ? "180%" : "100%", maxWidth: zoom ? "none" : "100%" }} /></div><div className="lp-tool-row"><button type="button" className="lp-tool-button" aria-pressed={zoom} onClick={() => setZoom(value => !value)}>{zoom ? <ZoomOut size={18} /> : <ZoomIn size={18} />}{zoom ? "اندازهٔ عادی" : "بزرگ‌نمایی"}</button>{urls.length > 1 && <><button type="button" className="lp-icon-button" aria-label="تصویر قبلی" onClick={() => move(-1)}><ChevronRight /></button><span>{(selected + 1).toLocaleString("fa-IR")} / {urls.length.toLocaleString("fa-IR")}</span><button type="button" className="lp-icon-button" aria-label="تصویر بعدی" onClick={() => move(1)}><ChevronLeft /></button></>}</div></div></ToolDialog>
  </div>;
}
