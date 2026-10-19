"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { DocumentPageSize } from "@/lib/analyzers/document-chrome";
function subscribeStyles(notify: () => void) { window.addEventListener("load", notify, true); return () => window.removeEventListener("load", notify, true); }
function browserStyles() { return JSON.stringify({ links: Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')).map(link => link.href), bodyClass: document.body.className, font: getComputedStyle(document.body).fontFamily }); }
export function ChromeDocument({ html, css, className, pageSize = "A4", pageMargin = "0", onDocument }: {
    html: string;
    css: string;
    className: string;
    pageSize?: DocumentPageSize;
    pageMargin?: string;
    onDocument?: (doc: Document, frame: HTMLIFrameElement) => void | (() => void);
}) {
    const frame = useRef<HTMLIFrameElement>(null);
    const [height, setHeight] = useState(900);
    const [ready, setReady] = useState(0);
    const styleSnapshot = useSyncExternalStore(subscribeStyles, browserStyles, () => "");
    const styles: {
        links: string[];
        bodyClass: string;
        font: string;
    } | null = styleSnapshot ? JSON.parse(styleSnapshot) : null;
    const escape = (value: string) => value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
    const csp = "default-src 'none'; script-src 'none'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src data:; connect-src 'none'; frame-src 'none'; object-src 'none'; form-action 'none'; base-uri 'none'";
    const source = styles ? `<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${csp}">${styles.links.map(href => `<link rel="stylesheet" href="${escape(href)}">`).join('')}<style>html,body{margin:0!important;min-height:0!important;height:auto!important;background:white!important;color:#17202b;font-family:${styles.font}}${css.replace(/</g, "\\3c ")}\n@media print{@page{size:${pageSize};margin:${pageMargin}}.doc-page{break-after:page}.doc-page:last-child{break-after:auto}}</style></head><body class="${escape(styles.bodyClass)}"><div class="${escape(className)}" style="width:${pageSize === "A4 landscape" ? "297mm" : "210mm"};max-width:100%;margin-inline:auto">${html}</div></body></html>` : "";
    useEffect(() => {
        const el = frame.current, doc = el?.contentDocument;
        if (!el || !doc || !ready)
            return;
        const update = () => { const next = Math.min(100000, Math.max(100, Math.ceil(doc.body?.getBoundingClientRect().height ?? 900))); setHeight(old => old === next ? old : next); };
        const observer = new ResizeObserver(update);
        if (doc.body)
            observer.observe(doc.body);
        const cleanup = onDocument?.(doc, el);
        update();
        return () => { observer.disconnect(); cleanup?.(); };
    }, [ready, onDocument]);
    return <iframe ref={frame} data-document-surface title="سند تفسیر" sandbox="allow-same-origin allow-modals" srcDoc={source} onLoad={() => setReady(value => value + 1)} style={{ height, width: "100%", border: 0, display: "block" }}/>;
}
