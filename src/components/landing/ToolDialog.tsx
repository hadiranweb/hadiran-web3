"use client";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

export function ToolDialog({ open, onClose, title, children, wide = false }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || !open) return;
    dialog.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) dialog.animate([{ opacity: 0, transform: "translateY(12px)" }, { opacity: 1, transform: "translateY(0)" }], { duration: 180, easing: "ease-out" });
    return () => { dialog.close(); document.body.style.overflow = previous; };
  }, [open]);
  return <dialog ref={ref} className={`lp-dialog ${wide ? "lp-dialog-wide" : ""}`} aria-labelledby={titleId} onCancel={e => { e.preventDefault(); onClose(); }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="lp-dialog-inner"><header><h2 id={titleId}>{title}</h2><button type="button" className="lp-icon-button" onClick={onClose} aria-label="بستن پنجره"><X size={21} /></button></header>{open && children}</div>
  </dialog>;
}
