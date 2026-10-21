"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Minus, Plus, Printer, Type } from "lucide-react";

const LEVELS = [0.95, 1, 1.1, 1.2] as const;
type Level = (typeof LEVELS)[number];
const DEFAULT_LEVEL: Level = 1;
const SCALE_KEY = "hadiran:reading-scale";

/**
 * مقیاس خواندن در localStorage می‌ماند. خواندنش با useSyncExternalStore انجام می‌شود
 * تا نه setState داخل effect لازم باشد و نه هیدریشن سرور/کلاینت به‌هم بخورد.
 */
const listeners = new Set<() => void>();
let cached: Level | null = null;

function isLevel(value: number): value is Level {
  return (LEVELS as readonly number[]).includes(value);
}

function readStored(): Level {
  try {
    const stored = Number(window.localStorage.getItem(SCALE_KEY));
    return isLevel(stored) ? stored : DEFAULT_LEVEL;
  } catch {
    return DEFAULT_LEVEL;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): Level {
  if (cached === null) cached = readStored();
  return cached;
}

function getServerSnapshot(): Level {
  return DEFAULT_LEVEL;
}

function writeLevel(level: Level) {
  cached = level;
  try {
    window.localStorage.setItem(SCALE_KEY, String(level));
  } catch {
    /* ذخیرهٔ محلی ممکن نیست؛ فقط همین نشست */
  }
  for (const listener of listeners) listener();
}

function applyScale(level: Level) {
  document.documentElement.style.setProperty("--reading-scale", String(level));
}

/** Reading tools live on the article page, never on a public list. */
export function ReadingTools({ title }: { title: string }) {
  const level = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    applyScale(level);
    return () => {
      document.documentElement.style.removeProperty("--reading-scale");
    };
  }, [level]);

  function change(delta: number) {
    const index = LEVELS.indexOf(level) + delta;
    const next = LEVELS[Math.max(0, Math.min(LEVELS.length - 1, index))];
    if (!next || next === level) return;
    applyScale(next);
    writeLevel(next);
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
