"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { itemsOf, sectionOf, type AnalyzerPack, type Item } from "@/lib/analyzers/pack";
import {
  answeredCount,
  firstUnansweredIndex,
  isComplete,
  type AnswerMap,
  type AttemptView,
} from "@/lib/analyzers/runtime";
import { clearDraft, readDraft, writeDraft } from "@/lib/ui/draft";

const FA = "۰۱۲۳۴۵۶۷۸۹";
const fieldClass =
  "w-full rounded-[var(--radius-md)] border border-line bg-elev px-4 py-2.5 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]";

function faNum(n: number | string) {
  return String(n).replace(/\d/g, (d) => FA[Number(d)] ?? d);
}

function persianError(code: string) {
  const map: Record<string, string> = {
    unauthorized: "نشست منقضی شد. دوباره وارد شوید.",
    consent_required: "ابتدا رضایت را بپذیرید.",
    invalid_answer: "پاسخ این سؤال کامل نیست.",
    incomplete: "همهٔ سؤال‌ها باید پاسخ داده شوند.",
    already_submitted: "این ارزیابی قبلاً ثبت شده است.",
    save_failed: "ذخیره نشد. دوباره تلاش کنید.",
    score_failed: "نمره محاسبه نشد. تعریف آزمون را بررسی کنید.",
  };
  return map[code] || "خطایی رخ داد.";
}

type DraftState = { consent: boolean; answers: AnswerMap; index: number };

export function AnalyzerRun({ pack }: { pack: AnalyzerPack }) {
  const router = useRouter();
  const allItems = itemsOf(pack);
  const draftKey = pack.slug === "casio-ss" ? "casio-ss" : `analyzer:${pack.slug}`;
  const api = `/api/analyzers/${pack.slug}`;
  const reportHref = `/analyzers/${pack.slug}/report`;

  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [index, setIndex] = useState(0);
  const [textDraft, setTextDraft] = useState("");
  const advanceTimer = useRef<number | null>(null);

  function persist(next: DraftState) {
    writeDraft(draftKey, next);
  }

  async function post(body: Record<string, unknown>): Promise<AttemptView | null> {
    setError(null);
    const res = await fetch(api, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json()) as { attempt?: AttemptView; error?: string };
    if (res.status === 401) {
      setError("unauthorized");
      return null;
    }
    if (!res.ok) {
      setError(data.error ?? "save_failed");
      return null;
    }
    return data.attempt ?? null;
  }

  useEffect(() => {
    const draft = readDraft<DraftState>(draftKey) ?? { consent: false, answers: {}, index: 0 };
    setConsent(draft.consent);
    setAnswers(draft.answers);
    setIndex(Math.min(Math.max(draft.index, 0), Math.max(allItems.length - 1, 0)));
    setReady(true);

    void (async () => {
      const res = await fetch(api, { cache: "no-store" });
      if (res.status === 401) {
        setError("unauthorized");
        return;
      }
      if (!res.ok) return;
      const data = (await res.json()) as { attempt: AttemptView | null };
      const attempt = data.attempt;
      if (!attempt) return;
      if (attempt.status === "submitted") {
        clearDraft(draftKey);
        router.replace(reportHref);
        setSubmitted(true);
        setConsent(true);
        setAnswers(attempt.answers);
        return;
      }
      const merged: AnswerMap = { ...draft.answers, ...attempt.answers };
      const nextIndex = firstUnansweredIndex(pack, merged);
      const consented = Boolean(attempt.consentAt);
      setConsent(consented);
      setAnswers(merged);
      setIndex(nextIndex);
      persist({ consent: consented, answers: merged, index: nextIndex });
    })();

    return () => {
      if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
    };
    // load once per pack
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pack.slug]);

  const item = allItems[index];
  const section = item ? sectionOf(pack, item.id) : undefined;
  const sectionItems = section?.items ?? [];
  const sectionPos = item ? sectionItems.findIndex((entry) => entry.id === item.id) + 1 : 0;
  const progress = answeredCount(pack, answers);
  const done = isComplete(pack, answers);
  const scaleButtons = useMemo(() => Array.from({ length: 11 }, (_, value) => value), []);

  useEffect(() => {
    if (item?.kind === "text") {
      setTextDraft(typeof answers[item.id] === "string" ? String(answers[item.id]) : "");
    }
  }, [item, answers]);

  function goTo(nextIndex: number) {
    const clamped = Math.min(Math.max(nextIndex, 0), Math.max(allItems.length - 1, 0));
    setIndex(clamped);
    persist({ consent, answers, index: clamped });
  }

  async function saveValue(target: Item, value: number | string, thenAdvance: boolean) {
    setAnswers((prev) => {
      const next = { ...prev, [target.id]: value };
      persist({ consent, answers: next, index });
      return next;
    });
    const attempt = await post({ action: "answer", id: target.id, value });
    if (!attempt) return;
    if (attempt.status === "submitted") {
      clearDraft(draftKey);
      router.replace(reportHref);
      setSubmitted(true);
      return;
    }
    if (!thenAdvance) return;
    if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
    advanceTimer.current = window.setTimeout(() => {
      const nextIndex = allItems.findIndex((entry) => entry.id === target.id) + 1;
      if (nextIndex < allItems.length) goTo(nextIndex);
    }, 200);
  }

  async function acceptConsent() {
    setBusy(true);
    const attempt = await post({ action: "consent" });
    setBusy(false);
    if (!attempt) return;
    setConsent(true);
    persist({ consent: true, answers, index });
  }

  async function submit() {
    if (!done) return;
    setBusy(true);
    const attempt = await post({ action: "submit" });
    setBusy(false);
    if (!attempt || attempt.status !== "submitted") return;
    clearDraft(draftKey);
    router.replace(reportHref);
    setSubmitted(true);
  }

  if (!ready) {
    return <p className="text-sm text-muted">در حال بارگذاری ارزیابی…</p>;
  }

  if (!allItems.length) {
    return <p className="text-sm leading-7 text-muted">این آزمون هنوز سؤالی ندارد.</p>;
  }

  if (submitted) {
    return (
      <section className="surface p-6 sm:p-8">
        <h2 className="text-xl font-bold leading-[1.7] text-ink">پاسخ‌ها ثبت شد</h2>
        <Link href={reportHref} className="mt-6 inline-flex text-sm font-medium text-accent hover:text-ink">
          مشاهده گزارش
        </Link>
      </section>
    );
  }

  if (!consent) {
    return (
      <section className="surface p-6 sm:p-8">
        <h2 className="text-xl font-bold leading-[1.7] text-ink">{pack.consent.titleFa}</h2>
        <div className="mt-4 space-y-3 text-sm leading-7 text-muted">
          {pack.consent.bodyFa.map((para) => (
            <p key={para}>{para}</p>
          ))}
        </div>
        {error ? <p className="mt-4 text-sm text-mark">{persianError(error)}</p> : null}
        <button
          type="button"
          onClick={() => void acceptConsent()}
          disabled={busy}
          className="mt-6 inline-flex rounded-[var(--radius-md)] bg-accent px-5 py-2.5 text-sm font-medium text-accent-fg disabled:opacity-60"
        >
          {busy ? "در حال ثبت…" : pack.consent.acceptLabelFa}
        </button>
      </section>
    );
  }

  if (!item || !section) return null;

  const currentValue = answers[item.id];
  const canGoNext =
    item.kind === "text"
      ? textDraft.replace(/\s+/g, " ").trim().length > 0
      : currentValue != null && currentValue !== "";

  return (
    <section className="surface overflow-hidden">
      <div className="border-b border-line px-6 py-4 sm:px-8">
        <p className="text-xs font-medium text-mark">{section.titleFa}</p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-accent-soft">
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-200"
            style={{ width: `${Math.round((progress / allItems.length) * 100)}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-muted">
          سؤال {faNum(index + 1)} از {faNum(allItems.length)}
          {sectionItems.length > 1 ? ` · این بخش ${faNum(sectionPos)} از ${faNum(sectionItems.length)}` : null}
        </p>
      </div>

      <div key={item.id} className="px-6 py-6 sm:px-8 sm:py-8">
        {section.introFa && sectionPos === 1 ? (
          <p className="mb-4 text-sm leading-7 text-muted">{section.introFa}</p>
        ) : null}
        <h2 className="text-lg font-bold leading-[1.7] text-ink sm:text-xl">{item.text}</h2>

        {item.kind === "range" ? (
          <div className="mt-6" dir="rtl">
            <div className="grid grid-cols-11 gap-1 sm:gap-1.5">
              {scaleButtons.map((value) => {
                const selected = currentValue === value;
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => void saveValue(item, value, true)}
                    className={`min-h-11 rounded-[var(--radius-sm)] border text-sm font-medium transition duration-200 ${
                      selected
                        ? "border-accent bg-accent text-accent-fg"
                        : "border-line bg-elev text-ink hover:border-accent"
                    }`}
                  >
                    {faNum(value)}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex items-start justify-between gap-3 text-xs leading-6 text-muted">
              <p className="max-w-[38%] text-start">۰ — {item.anchors[0]}</p>
              <p className="max-w-[24%] text-center">۵ — {item.anchors[5]}</p>
              <p className="max-w-[38%] text-end">۱۰ — {item.anchors[10]}</p>
            </div>
          </div>
        ) : null}

        {item.kind === "choice" ? (
          <ul className="mt-6 space-y-2">
            {item.options.map((option) => {
              const selected = currentValue === option.value;
              return (
                <li key={option.value}>
                  <button
                    type="button"
                    aria-pressed={selected}
                    onClick={() => void saveValue(item, option.value, true)}
                    className={`w-full rounded-[var(--radius-md)] border px-4 py-3 text-start text-sm transition duration-200 ${
                      selected
                        ? "border-accent bg-accent-soft text-ink"
                        : "border-line bg-elev text-ink hover:border-accent"
                    }`}
                  >
                    {option.label}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}

        {item.kind === "text" ? (
          <div className="mt-6">
            <input
              value={textDraft}
              maxLength={item.maxLength}
              onChange={(event) => setTextDraft(event.target.value)}
              className={fieldClass}
            />
          </div>
        ) : null}

        {error ? <p className="mt-4 text-sm text-mark">{persianError(error)}</p> : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-6 py-4 sm:px-8">
        <button
          type="button"
          onClick={() => goTo(index - 1)}
          disabled={index === 0}
          className="text-sm font-medium text-muted disabled:opacity-40"
        >
          قبلی
        </button>
        {index < allItems.length - 1 ? (
          <button
            type="button"
            disabled={!canGoNext}
            onClick={() => {
              if (item.kind === "text") {
                void saveValue(item, textDraft, true);
                return;
              }
              goTo(index + 1);
            }}
            className="inline-flex rounded-[var(--radius-md)] bg-accent px-4 py-2 text-sm font-medium text-accent-fg disabled:opacity-60"
          >
            بعدی
          </button>
        ) : (
          <button
            type="button"
            disabled={busy || (item.kind === "text" ? !textDraft.trim() : !done)}
            onClick={() => {
              if (item.kind === "text" && textDraft.trim()) {
                void (async () => {
                  await saveValue(item, textDraft, false);
                  await submit();
                })();
                return;
              }
              void submit();
            }}
            className="inline-flex rounded-[var(--radius-md)] bg-accent px-4 py-2 text-sm font-medium text-accent-fg disabled:opacity-60"
          >
            {busy ? "در حال ثبت…" : "ثبت ارزیابی"}
          </button>
        )}
      </div>
    </section>
  );
}
