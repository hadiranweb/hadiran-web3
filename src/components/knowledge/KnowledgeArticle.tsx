"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MarkdownReadonly } from "@/components/MarkdownReadonly";
import { ClaritySpeedSim } from "@/components/knowledge/ClaritySpeedSim";
import { KnowledgeView } from "@/components/knowledge/KnowledgeView";
import type { KnowledgeSlide } from "@/components/knowledge/SlideReader";
import {
  defaultArticleDepth,
  gardenDateFa,
  growthLabel,
  minutesFa,
  parseClosingOptions,
  parseSimulator,
  type ArticleDepth,
  type KnowledgeGrowth,
} from "@/lib/knowledge/article";

export type RelatedLeaf = {
  slug: string;
  titleFa: string;
  summaryFa?: string | null;
  growth?: string | null;
  lineFa?: string | null;
};

export function KnowledgeArticle({
  titleFa,
  lineFa,
  summaryFa,
  bodyFa,
  growth,
  readingMinutes,
  questionFa,
  rootFa,
  firstStepFa,
  marginNoteFa,
  prunedAt,
  audioUrl,
  simulator,
  closingQuestionFa,
  closingOptions,
  closingPromptFa,
  slides,
  related,
}: {
  titleFa: string;
  lineFa?: string | null;
  summaryFa?: string | null;
  bodyFa?: string | null;
  growth?: string | null;
  readingMinutes?: number | null;
  questionFa?: string | null;
  rootFa?: string | null;
  firstStepFa?: string | null;
  marginNoteFa?: string | null;
  prunedAt?: Date | string | null;
  audioUrl?: string | null;
  simulator?: unknown;
  closingQuestionFa?: string | null;
  closingOptions?: unknown;
  closingPromptFa?: string | null;
  slides: KnowledgeSlide[];
  related: RelatedLeaf[];
}) {
  const growthText = growthLabel(growth as KnowledgeGrowth);
  const minutes = minutesFa(readingMinutes);
  const sim = parseSimulator(simulator);
  const options = parseClosingOptions(closingOptions);
  const pruned = gardenDateFa(prunedAt);
  const depths: { id: ArticleDepth; label: string; hint: string; available: boolean }[] = [
    { id: "line", label: "یک خط", hint: "عجول", available: Boolean(lineFa?.trim()) },
    { id: "paragraph", label: "یک بند", hint: "کنجکاو", available: Boolean(summaryFa?.trim()) },
    { id: "full", label: "کل ماجرا", hint: "غرق‌شدن", available: Boolean(bodyFa?.trim() || slides.length) },
  ];
  const initial = defaultArticleDepth({ lineFa, summaryFa, bodyFa });
  const [depth, setDepth] = useState<ArticleDepth>(depths.find((item) => item.id === initial && item.available)?.id ?? depths.find((item) => item.available)?.id ?? "full");
  const [note, setNote] = useState("");
  const active = depths.find((item) => item.id === depth && item.available) ?? depths.find((item) => item.available);

  const body = useMemo(() => {
    if (active?.id === "line") return lineFa?.trim() || "";
    if (active?.id === "paragraph") return summaryFa?.trim() || "";
    return bodyFa?.trim() || "";
  }, [active?.id, bodyFa, lineFa, summaryFa]);

  return (
    <div className="article-leaf">
      {questionFa?.trim() ? <p className="article-question">{questionFa}</p> : null}

      {audioUrl?.trim() ? (
        <figure className="article-audio">
          <figcaption>صدای برگ</figcaption>
          <audio controls preload="metadata" src={audioUrl.trim()}>
            مرورگر این صدا را پخش نمی‌کند.
          </audio>
        </figure>
      ) : null}

      {depths.some((item) => item.available) ? (
        <div className="article-depth">
          <p className="text-sm font-bold text-ink">عمق به انتخاب تو: امروز چقدر حوصله و وقت داری؟</p>
          <div className="article-depth-tabs" role="tablist" aria-label="عمق خواندن">
            {depths.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active?.id === item.id}
                disabled={!item.available}
                onClick={() => item.available && setDepth(item.id)}
              >
                {item.label} <span>({item.hint})</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {active?.id === "line" ? (
        <blockquote className="article-line">
          <p className="muted text-xs font-bold">در یک خط (عصارهٔ فکر):</p>
          <p className="mt-2 text-lg leading-8 text-ink">{body}</p>
        </blockquote>
      ) : null}

      {active?.id === "paragraph" ? (
        <section className="article-paragraph">
          <p className="muted text-xs font-bold">در یک بند (چرایی و زمینه):</p>
          <p className="mt-3 whitespace-pre-wrap text-base leading-[1.9] text-ink">{body}</p>
        </section>
      ) : null}

      {active?.id === "full" ? (
        <KnowledgeView title={titleFa} bodyFa={bodyFa} slides={slides} />
      ) : null}

      {rootFa?.trim() || firstStepFa?.trim() ? (
        <aside className="article-issue">
          {rootFa?.trim() ? (
            <p>
              <strong>ریشهٔ پنهانِ معماری: </strong>
              {rootFa}
            </p>
          ) : null}
          {firstStepFa?.trim() ? (
            <p className="mt-3">
              <strong>اولین قدمِ آرام و آزموده: </strong>
              {firstStepFa}
            </p>
          ) : null}
        </aside>
      ) : null}

      {marginNoteFa?.trim() ? (
        <aside className="article-margin">
          <p className="text-xs font-bold">✍️ حاشیه‌نویسی در دفتر</p>
          <p className="mt-2 whitespace-pre-wrap leading-7">{marginNoteFa}</p>
        </aside>
      ) : null}

      {pruned ? (
        <p className="muted mt-4 text-sm">
          این یادداشت در تاریخ <strong className="text-ink">{pruned}</strong> در باغ هادیران هرس و بازبینی شده است.
        </p>
      ) : null}

      {sim ? <ClaritySpeedSim simulator={sim} /> : null}

      {related.length > 0 ? (
        <section className="article-threads">
          <h2 className="title-lg text-ink">رشته‌ها: این فکر به این فکرها وصل است</h2>
          <p className="muted mt-2 text-sm">نشانگر را روی هر پیوند نگه دار تا بوی پشتش را ببینی</p>
          <ul>
            {related.map((item) => (
              <li key={item.slug}>
                <Link href={`/knowledge/${item.slug}`} title={item.lineFa || item.summaryFa || item.titleFa}>
                  <span>{growthLabel(item.growth as KnowledgeGrowth) ?? "برگ"}</span>
                  {item.titleFa}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {closingQuestionFa?.trim() || options.length > 0 ? (
        <section className="article-close">
          <p className="muted text-sm">پایانِ باز — این صفحه اینجا تمام نمی‌شود، با یک سؤال ادامه پیدا می‌کند:</p>
          {closingQuestionFa?.trim() ? <h2 className="title-lg mt-3 text-ink">{closingQuestionFa}</h2> : null}
          {options.length > 0 ? (
            <ul className="article-close-options">
              {options.map((option) => (
                <li key={option.labelFa}>
                  {option.href ? (
                    <Link href={option.href}>{option.labelFa}</Link>
                  ) : (
                    <p>{option.labelFa}</p>
                  )}
                </li>
              ))}
            </ul>
          ) : null}
          <label className="article-close-note">
            <span>{closingPromptFa?.trim() || "یا اگر جواب و تجربهٔ خودت را داری، در حاشیهٔ این برگ بنویس:"}</span>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={4}
              placeholder="این حاشیه روی دستگاه تو می‌ماند، نه در باغ."
            />
          </label>
        </section>
      ) : null}

      {growthText || minutes ? (
        <p className="sr-only">
          {growthText}
          {minutes ? `، ${minutes}` : ""}
        </p>
      ) : null}
    </div>
  );
}
