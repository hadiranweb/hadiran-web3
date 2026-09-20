"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MarkdownReadonly } from "@/components/MarkdownReadonly";

export type KnowledgeSlide = {
  id: number;
  sortOrder: number;
  titleFa?: string | null;
  titleEn?: string | null;
  bodyFa?: string | null;
  bodyEn?: string | null;
};

export function SlideReader({ slides, title }: { slides: KnowledgeSlide[]; title: string }) {
  const ordered = [...slides].sort((a, b) => a.sortOrder - b.sortOrder);
  const [index, setIndex] = useState(0);
  const current = ordered[index];

  const goNext = useCallback(() => {
    setIndex((i) => Math.min(i + 1, ordered.length - 1));
  }, [ordered.length]);

  const goPrev = useCallback(() => {
    setIndex((i) => Math.max(i - 1, 0));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goNext();
      if (e.key === "ArrowRight") goPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev]);

  if (!current) {
    return <p className="text-sm text-slate-400">هنوز اسلایدی اضافه نشده.</p>;
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3 text-xs text-slate-500 dark:border-slate-800">
        <span className="truncate">{title}</span>
        <span className="tabular-nums">
          {index + 1} / {ordered.length}
        </span>
      </div>

      <div className="min-h-[18rem] px-6 py-8 sm:px-10">
        {(current.titleFa || current.titleEn) && (
          <h2 className="mb-5 text-2xl font-bold leading-relaxed text-slate-900 dark:text-slate-100">
            {current.titleFa || current.titleEn}
          </h2>
        )}
        <MarkdownReadonly source={current.bodyFa || current.bodyEn} />
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-5 py-3 dark:border-slate-800">
        <button
          type="button"
          onClick={goPrev}
          disabled={index === 0}
          className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm text-slate-600 disabled:opacity-40 dark:text-slate-300"
        >
          <ChevronRight className="h-4 w-4" />
          قبلی
        </button>
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className="h-full bg-indigo-600 transition-all"
            style={{ width: `${((index + 1) / ordered.length) * 100}%` }}
          />
        </div>
        <button
          type="button"
          onClick={goNext}
          disabled={index === ordered.length - 1}
          className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm text-slate-600 disabled:opacity-40 dark:text-slate-300"
        >
          بعدی
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
