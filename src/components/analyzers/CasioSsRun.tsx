"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  answeredCount,
  firstUnansweredIndex,
  isComplete,
  type AnswerMap,
  type AttemptView,
} from "@/lib/analyzers/casio-ss/answers";
import {
  CONSENT_BODY,
  CONSENT_TITLE,
  allItems,
  sectionOf,
  type Item,
} from "@/lib/analyzers/casio-ss/instrument";
import { clearDraft, readDraft, writeDraft } from "@/lib/ui/draft";

const DRAFT_KEY = "casio-ss";
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
  };
  return map[code] || "خطایی رخ داد.";
}

type DraftState = {
  consent: boolean;
  answers: AnswerMap;
  index: number;
};

function emptyDraft(): DraftState {
  return { consent: false, answers: {}, index: 0 };
}

export function CasioSsRun() {
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
    writeDraft(DRAFT_KEY, next);
  }

  useEffect(() => {
    const draft = readDraft<DraftState>(DRAFT_KEY) ?? emptyDraft();
    setConsent(draft.consent);
    setAnswers(draft.answers);
    setIndex(Math.min(Math.max(draft.index, 0), allItems.length - 1));
    setReady(true);

    void (async () => {
      const res = await fetch("/api/analyzers/casio-ss", { cache: "no-store" });
      if (res.status === 401) {
        setError("unauthorized");
        return;
      }
      if (!res.ok) return;
      const data = (await res.json()) as { attempt: AttemptView | null };
      const attempt = data.attempt;
      if (!attempt) return;
      if (attempt.status === "submitted") {
        clearDraft(DRAFT_KEY);
        setSubmitted(true);
        setConsent(true);
        setAnswers(attempt.answers);
        return;
      }
      const merged: AnswerMap = { ...draft.answers, ...attempt.answers };
      const nextIndex = firstUnansweredIndex(merged);
      const consented = Boolean(attempt.consentAt);
      setConsent(consented);
      setAnswers(merged);
      setIndex(nextIndex);
      persist({
        consent: consented,
        answers: merged,
        index: nextIndex,
      });
    })();

    return () => {
      if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
    };
    // load once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const item = allItems[index];
  const section = item ? sectionOf(item.id) : undefined;
  const sectionItems = section?.items ?? [];
  const sectionPos = item ? sectionItems.findIndex((entry) => entry.id === item.id) + 1 : 0;
  const progress = answeredCount(answers);
  const done = isComplete(answers);

  useEffect(() => {
    if (item?.kind === "text") {
      setTextDraft(typeof answers[item.id] === "string" ? String(answers[item.id]) : "");
    }
  }, [item, answers]);

  async function post(body: Record<string, unknown>) {
    const res = await fetch("/api/analyzers/casio-ss", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as { attempt?: AttemptView; error?: string };
    if (!res.ok) {
      setError(data.error || "save_failed");
      return null;
    }
    setError(null);
    return data.attempt ?? null;
  }

  async function acceptConsent() {
    setBusy(true);
    const attempt = await post({ action: "consent" });
    setBusy(false);
    if (!attempt) return;
    if (attempt.status === "submitted") {
      clearDraft(DRAFT_KEY);
      setSubmitted(true);
      return;
    }
    setConsent(true);
    persist({ consent: true, answers, index });
  }

  function goTo(nextIndex: number) {
    const clamped = Math.min(Math.max(nextIndex, 0), allItems.length - 1);
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
      clearDraft(DRAFT_KEY);
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

  async function submit() {
    if (!done) return;
    setBusy(true);
    const attempt = await post({ action: "submit" });
    setBusy(false);
    if (!attempt || attempt.status !== "submitted") return;
    clearDraft(DRAFT_KEY);
    setSubmitted(true);
  }

  const scaleButtons = useMemo(() => Array.from({ length: 11 }, (_, value) => value), []);

  if (!ready) {
    return <p className="text-sm text-muted">در حال بارگذاری ارزیابی…</p>;
  }

  if (submitted) {
    return (
      <section className="surface p-6 sm:p-8">
        <h2 className="text-xl font-bold leading-[1.7] text-ink">پاسخ‌ها ثبت شد</h2>
        <p className="mt-3 text-sm leading-7 text-muted">
          جمع‌بندی و تفسیر در برش بعد می‌آید. نمره یا گزارش PDF در این مرحله ساخته نمی‌شود.
        </p>
        <Link href="/analyzers" className="mt-6 inline-flex text-sm font-medium text-accent hover:text-ink">
          بازگشت به تحلیلگر‌ها
        </Link>
      </section>
    );
  }

  if (!consent) {
    return (
      <section className="surface p-6 sm:p-8">
        <h2 className="text-xl font-bold leading-[1.7] text-ink">{CONSENT_TITLE}</h2>
        <div className="mt-4 space-y-3 text-sm leading-7 text-muted">
          {CONSENT_BODY.map((para) => (
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
          {busy ? "در حال ثبت…" : "خواندم و موافقم"}
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

      <div
        key={item.id}
        className="px-6 py-6 sm:px-8 sm:py-8"
        style={{ transition: "opacity var(--dur) var(--ease-studio)" }}
      >
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
