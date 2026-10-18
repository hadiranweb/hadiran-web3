"use client";

import { useEffect, useRef, useState } from "react";
import { Minus, Plus, RotateCcw, Search } from "lucide-react";
import { useWorkspace } from "../WorkspaceContext";
import { members, type SampleMember } from "./fixtures";

export function GraphPreview({ onSelect }: { onSelect: (member: SampleMember) => void }) {
  const { t, locale } = useWorkspace();
  const [width, setWidth] = useState(760);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [query, setQuery] = useState("");
  const [direct, setDirect] = useState(false);
  const canvas = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; origin: typeof pan } | null>(null);
  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(240, entry.contentRect.width)));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const positions = [[.5,70],[.27,205],[.73,205],[.12,345],[.36,345],[.64,345],[.88,345]];
  const point = (index: number) => ({ x: positions[index][0] * width, y: positions[index][1] });
  const reset = () => { setZoom(1); setPan({ x: 0, y: 0 }); };
  const changeZoom = (delta: number) => setZoom((value) => Math.min(2.5, Math.max(.75, value + delta)));
  const visible = (member: SampleMember) => (!direct || member.level < 2) && `${member.code} ${member.name.fa} ${member.name.en}`.toLowerCase().includes(query.trim().toLowerCase());
  const matches = members.filter(visible);
  return <section className="dp-panel">
    <div className="dp-filters"><label className="dp-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("نام یا کد عمومی", "Name or public code")} aria-label={t("جست‌وجوی رابطه", "Find a relationship")} /></label><label className="dp-check"><input type="checkbox" checked={direct} onChange={(event) => setDirect(event.target.checked)} />{t("فقط معرف‌های مستقیم", "Direct referrals only")}</label></div>
    <div className="dp-graph" ref={canvas}>
      <svg viewBox={`0 0 ${width} 430`} width="100%" height="430" tabIndex={0} aria-label={t("گراف معرف‌های نمونه؛ کلیدهای جهت برای جابه‌جایی، مثبت و منفی برای زوم", "Sample referral graph; arrow keys to pan, plus and minus to zoom")} onKeyDown={(event) => {
        if ((event.target as Element).closest('[role="button"]')) return;
        if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "+", "-", "Home"].includes(event.key)) event.preventDefault();
        if (event.key === "+") changeZoom(.25);
        else if (event.key === "-") changeZoom(-.25);
        else if (event.key === "Home") reset();
        else if (event.key.startsWith("Arrow")) setPan((value) => ({ x: value.x + (event.key === "ArrowLeft" ? -24 : event.key === "ArrowRight" ? 24 : 0), y: value.y + (event.key === "ArrowUp" ? -24 : event.key === "ArrowDown" ? 24 : 0) }));
      }} onPointerDown={(event) => {
        if ((event.target as Element).closest('[role="button"]')) return;
        drag.current = { x: event.clientX, y: event.clientY, origin: pan };
        event.currentTarget.setPointerCapture(event.pointerId);
      }} onPointerMove={(event) => {
        const start = drag.current;
        if (start) setPan({ x: start.origin.x + event.clientX - start.x, y: start.origin.y + event.clientY - start.y });
      }} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}>
        <g transform={`translate(${pan.x} ${pan.y}) translate(${width / 2} 215) scale(${zoom}) translate(${-width / 2} -215)`}>
          {members.map((member, index) => {
            if (!member.parent) return null;
            const parent = point(members.findIndex((item) => item.code === member.parent)), child = point(index);
            return <path key={member.code} d={`M ${parent.x} ${parent.y + 25} C ${parent.x} ${parent.y + 90}, ${child.x} ${child.y - 90}, ${child.x} ${child.y - 25}`} className="dp-edge" opacity={visible(member) ? 1 : .16} />;
          })}
          {members.map((member, index) => {
            const position = point(index);
            return <g key={member.code} transform={`translate(${position.x} ${position.y})`} role="button" tabIndex={visible(member) ? 0 : -1} aria-label={`${t(member.name.fa, member.name.en)} ${member.code}`} opacity={visible(member) ? 1 : .22} className={`dp-node ${index === 0 ? "dp-node-root" : ""}`} onClick={() => onSelect(member)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect(member); } }}>
              <circle r="26" /><text y="5" textAnchor="middle" className="dp-node-initial" aria-hidden="true">{member.name[locale].slice(0, 1)}</text><text y="51" textAnchor="middle" className="dp-node-name">{t(member.name.fa, member.name.en)}</text>
            </g>;
          })}
        </g>
      </svg>
      <div className="dp-graph-tools"><button onClick={() => changeZoom(.25)} aria-label={t("بزرگ‌نمایی", "Zoom in")}><Plus size={17} /></button><span dir="ltr">{Math.round(zoom * 100)}%</span><button onClick={() => changeZoom(-.25)} aria-label={t("کوچک‌نمایی", "Zoom out")}><Minus size={17} /></button><button onClick={reset} aria-label={t("بازنشانی گراف", "Reset graph")}><RotateCcw size={16} /></button></div>
    </div>
    <details className="dp-directory"><summary>{t("فهرست متنی روابط", "Text directory")}</summary>{matches.length ? <ul>{matches.map((member) => <li key={member.code}><button onClick={() => onSelect(member)}><span>{t(member.name.fa, member.name.en)}</span><span dir="ltr">{member.code}</span></button></li>)}</ul> : <p role="status">{t("رابطه‌ای پیدا نشد", "No matching relationships")}</p>}</details>
  </section>;
}
