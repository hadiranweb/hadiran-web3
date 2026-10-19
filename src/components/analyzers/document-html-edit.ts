"use client";

const SKIP_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "LINK",
  "META",
  "BR",
  "HR",
  "HTML",
  "HEAD",
  "BODY",
]);

const SKIP_TABLE = new Set(["TABLE", "THEAD", "TBODY", "TFOOT", "TR", "COLGROUP", "COL"]);
const SKIP_SVG = new Set([
  "SVG",
  "PATH",
  "G",
  "DEFS",
  "USE",
  "TITLE",
  "CLIPPATH",
  "LINEARGRADIENT",
  "RADIALGRADIENT",
  "STOP",
  "RECT",
  "CIRCLE",
  "ELLIPSE",
  "LINE",
  "POLYLINE",
  "POLYGON",
  "TEXT",
  "TSPAN",
  "MASK",
  "FILTER",
  "DESC",
  "SYMBOL",
  "MARKER",
]);

function wrap(html: string) {
  const doc = new DOMParser().parseFromString(`<div id="__root">${html}</div>`, "text/html");
  return { doc, root: doc.getElementById("__root") };
}

function skipStamp(el: Element) {
  if (SKIP_TAGS.has(el.tagName)) return true;
  if (el.namespaceURI === "http://www.w3.org/2000/svg") return true;
  if (SKIP_SVG.has(el.tagName)) return true;
  return false;
}

export function stampHids(html: string): string {
  const { root } = wrap(html);
  if (!root) return html;
  let max = 0;
  root.querySelectorAll("[data-hid]").forEach((el) => {
    const raw = el.getAttribute("data-hid") ?? "";
    const n = Number(raw.replace(/^h/, ""));
    if (Number.isFinite(n) && n > max) max = n;
  });
  root.querySelectorAll("*").forEach((el) => {
    if (skipStamp(el)) return;
    if (el.getAttribute("data-hid")) return;
    max += 1;
    el.setAttribute("data-hid", `h${max}`);
  });
  return root.innerHTML;
}

export function sourceHasMustache(html: string, hid: string): boolean {
  const { doc } = wrap(html);
  const el = doc.querySelector(`[data-hid="${cssEscape(hid)}"]`);
  if (!el) return true;
  return /\{\{/.test(el.innerHTML);
}

export function setElementStyle(html: string, hid: string, style: string): string {
  const { root, doc } = wrap(html);
  if (!root) return html;
  const el = doc.querySelector(`[data-hid="${cssEscape(hid)}"]`) as HTMLElement | null;
  if (!el) return html;
  if (style.trim()) el.setAttribute("style", style);
  else el.removeAttribute("style");
  return root.innerHTML;
}

export function setElementText(html: string, hid: string, text: string): string {
  const { root, doc } = wrap(html);
  if (!root) return html;
  const el = doc.querySelector(`[data-hid="${cssEscape(hid)}"]`);
  if (!el) return html;
  if (/\{\{/.test(el.innerHTML)) return html;
  el.textContent = text;
  return root.innerHTML;
}

export function elementTag(html: string, hid: string): string {
  const { doc } = wrap(html);
  const el = doc.querySelector(`[data-hid="${cssEscape(hid)}"]`);
  return el?.tagName.toLowerCase() ?? "";
}

function cssEscape(value: string) {
  return value.replace(/"/g, '\\"');
}

export function canSelectTag(tag: string, className: string) {
  const name = tag.toUpperCase();
  if (SKIP_TAGS.has(name)) return false;
  if (SKIP_SVG.has(name)) return false;
  if (SKIP_TABLE.has(name)) return false;
  if (name === "SECTION" && className.split(/\s+/).includes("doc-page")) return false;
  return true;
}
