"use client";

import { useState } from "react";
import { MarkdownReadonly } from "@/components/MarkdownReadonly";
import { SlideReader, type KnowledgeSlide } from "@/components/knowledge/SlideReader";

export function KnowledgeView({
  title,
  bodyFa,
  slides,
}: {
  title: string;
  bodyFa?: string | null;
  slides: KnowledgeSlide[];
}) {
  const hasSlides = slides.length > 0;
  const hasBody = Boolean(bodyFa?.trim());
  const [mode, setMode] = useState<"slides" | "article">(hasSlides ? "slides" : "article");

  return (
    <div className="mt-6">
      {hasSlides && hasBody && (
        <div className="mb-4 inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1 text-xs">
          <button
            type="button"
            onClick={() => setMode("slides")}
            className={`rounded-lg px-3 py-1.5 ${mode === "slides" ? "bg-white font-medium shadow-sm" : "text-slate-500"}`}
          >
            مطالعه اسلایدی
          </button>
          <button
            type="button"
            onClick={() => setMode("article")}
            className={`rounded-lg px-3 py-1.5 ${mode === "article" ? "bg-white font-medium shadow-sm" : "text-slate-500"}`}
          >
            متن کامل
          </button>
        </div>
      )}

      {mode === "slides" && hasSlides ? (
        <SlideReader slides={slides} title={title} />
      ) : (
        <MarkdownReadonly source={bodyFa} className="mt-2" />
      )}
    </div>
  );
}
