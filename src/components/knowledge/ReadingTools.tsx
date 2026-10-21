"use client";

import { useEffect, useState } from "react";
import { Minus, Plus, Printer, Type } from "lucide-react";

const LEVELS = [0.95, 1, 1.1, 1.2] as const;
const SCALE_KEY = "hadiran:reading-scale";

/** Reading tools live on the article page, never on a public list. */
export function ReadingTools({ title }: { title: string }) {
  const [level, setLevel] = useState(1);

  useEffect(() => {
    const stored = Number(window.localStorage.getItem(SCALE_KEY));
    if (LEVELS.includes(stored as (typeof LEVELS)[number])) setLevel(stored);
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty("--reading-scale", String(level));
    return () => {
      document.documentElement.style.removeProperty("--reading-scale");
    };
  }, [level]);

  function change(delta: number) {
    const index = Math.max(0, Math.min(LEVELS.length - 1, LEVELS.indexOf(level as (typeof LEVELS)[number]) + delta));
    const next = LEVELS[index];
    setLevel(next);
    window.localStorage.setItem(SCALE_KEY, String(next));
  }

  return (
    <div className="print:hidden mb-4 flex flex-wrap items-center gap-2 text-xs text-muted" role="group" aria-label="ابزارهای خواندن">
      <span className="inline-flex items-center gap-1">
        <Type className="h-3.5 w-3.5" strokeWidth={1.5} />
        اندازهٔ متن
      </span>
      <button
        type="button"
        onClick={() => change(-1)}
        disabled={level === LEVELS[0]}
        aria-label="کوچک‌تر"
        className="ws-button min-h-9 px-2 py-1 disabled:opacity-50"
      >
        <Minus className="h-3.5 w-3.5" strokeWidth={1.5} />
      </button>
      <button
        type="button"
        onClick={() => change(1)}
        disabled={level === LEVELS[LEVELS.length - 1]}
        aria-label="بزرگ‌تر"
        className="ws-button min-h-9 px-2 py-1 disabled:opacity-50"
      >
        <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
      </button>
      <button type="button" onClick={() => window.print()} className="ws-button min-h-9 px-3 py-1">
        <Printer className="h-3.5 w-3.5" strokeWidth={1.5} />
        چاپ / PDF مرورگر
      </button>
      <span className="sr-only" aria-live="polite">
        {title} — اندازهٔ متن {Math.round(level * 100)} درصد
      </span>
    </div>
  );
}
