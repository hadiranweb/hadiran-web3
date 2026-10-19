"use client";

import { useMemo, useRef, useState } from "react";
import type { ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { insertAtCursor, TemplateCodeField } from "@/components/analyzers/TemplateCodeField";
import {
  BOT_QUESTION_TOKENS,
  botGuideTemplateOf,
  botQuestionTemplateOf,
  interpolateBotQuestion,
  botQuestionVars,
  DEFAULT_BOT_GUIDE_TEMPLATE,
  DEFAULT_BOT_QUESTION_TEMPLATE,
} from "@/lib/analyzers/bot-display";
import { itemsOf, type AnalyzerPack, type PackBotDisplay } from "@/lib/analyzers/pack";
import { TELEGRAM_RULE, telegramQuestionHtml } from "@/lib/bots/html";

function previewMarkup(html: string) {
  return html.replaceAll(TELEGRAM_RULE, "<hr />").replaceAll("\n", "<br />");
}

export function BotDisplayEditor({
  pack,
  canEdit,
  onChange,
}: {
  pack: AnalyzerPack;
  canEdit: boolean;
  onChange: (next: Partial<PackBotDisplay>) => void;
}) {
  const questionRef = useRef<ReactCodeMirrorRef>(null);
  const guideRef = useRef<ReactCodeMirrorRef>(null);
  const items = itemsOf(pack);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [focus, setFocus] = useState<"question" | "guide">("question");
  const questionTemplate = botQuestionTemplateOf(pack);
  const guideTemplate = botGuideTemplateOf(pack);
  const item = items[Math.min(previewIndex, Math.max(0, items.length - 1))] ?? null;
  const vars = item ? botQuestionVars(pack, item, items.indexOf(item)) : null;
  const preview = useMemo(() => {
    if (!item || !vars) return { question: "", guide: "" };
    return {
      question: telegramQuestionHtml(interpolateBotQuestion(questionTemplate, vars)),
      guide: telegramQuestionHtml(interpolateBotQuestion(guideTemplate, vars)),
    };
  }, [guideTemplate, item, questionTemplate, vars]);

  function insert(token: string) {
    if (!canEdit) return;
    const ref = focus === "guide" ? guideRef : questionRef;
    const current = focus === "guide" ? guideTemplate : questionTemplate;
    if (!insertAtCursor(ref, token)) {
      onChange(focus === "guide" ? { guideTemplateFa: `${current}${token}` } : { questionTemplateFa: `${current}${token}` });
    }
  }

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
      <div>
        <h2 className="text-base font-bold text-slate-900">نحوه نمایش در ربات</h2>
        <p className="mt-1 text-xs leading-6 text-slate-500">
          قالب سؤال و راهنما جداست. نشانه‌ها: <span dir="ltr">**پررنگ**</span> <span dir="ltr">__کج__</span>{" "}
          <span dir="ltr">`کد`</span> و خط <span dir="ltr">---</span>. دکمه‌های ۰–۱۰ دو ردیف زیر پیام سؤال می‌آیند، نه داخل
          نقل‌قول. خالی گذاشتن راهنما یعنی پیام دوم فرستاده نمی‌شود.
        </p>
      </div>
      <div className="flex flex-wrap gap-1">
        {BOT_QUESTION_TOKENS.map((row) => (
          <button
            key={row.token}
            type="button"
            disabled={!canEdit}
            title={row.hintFa}
            onClick={() => insert(row.token)}
            className="rounded-lg bg-slate-50 px-2 py-1 text-right disabled:opacity-50 hover:bg-indigo-50"
          >
            <span className="block font-mono text-[11px] text-indigo-800" dir="ltr">
              {row.token}
            </span>
            <span className="block text-[11px] text-slate-500">{row.hintFa}</span>
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        <button type="button" disabled={!canEdit} className="rounded-lg border border-slate-200 px-2 py-1" onClick={() => insert("**")}>
          پررنگ
        </button>
        <button type="button" disabled={!canEdit} className="rounded-lg border border-slate-200 px-2 py-1" onClick={() => insert("__")}>
          کج
        </button>
        <button type="button" disabled={!canEdit} className="rounded-lg border border-slate-200 px-2 py-1" onClick={() => insert("\n---\n")}>
          خط جدا
        </button>
      </div>

      <div className="space-y-2" onFocusCapture={() => setFocus("question")}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-medium text-slate-600">قالب پیام سؤال</p>
          <button
            type="button"
            disabled={!canEdit}
            className="text-xs text-indigo-700 disabled:opacity-50"
            onClick={() => onChange({ questionTemplateFa: DEFAULT_BOT_QUESTION_TEMPLATE })}
          >
            پیش‌فرض سؤال
          </button>
        </div>
        <TemplateCodeField
          editorRef={questionRef}
          value={questionTemplate}
          language="text"
          dir="rtl"
          height="180px"
          editable={canEdit}
          onChange={(value) => {
            if (canEdit) onChange({ questionTemplateFa: value });
          }}
        />
      </div>

      <div className="space-y-2" onFocusCapture={() => setFocus("guide")}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-medium text-slate-600">قالب پیام راهنما</p>
          <div className="flex gap-3">
            <button
              type="button"
              disabled={!canEdit}
              className="text-xs text-indigo-700 disabled:opacity-50"
              onClick={() => onChange({ guideTemplateFa: DEFAULT_BOT_GUIDE_TEMPLATE })}
            >
              پیش‌فرض لنگر
            </button>
            <button
              type="button"
              disabled={!canEdit}
              className="text-xs text-slate-500 disabled:opacity-50"
              onClick={() => onChange({ guideTemplateFa: "" })}
            >
              بدون پیام راهنما
            </button>
          </div>
        </div>
        <TemplateCodeField
          editorRef={guideRef}
          value={guideTemplate}
          language="text"
          dir="rtl"
          height="160px"
          editable={canEdit}
          onChange={(value) => {
            if (canEdit) onChange({ guideTemplateFa: value });
          }}
        />
      </div>

      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-medium text-slate-500">پیش‌نمایش دو پیام</p>
          {items.length > 1 ? (
            <select
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs"
              value={String(Math.min(previewIndex, items.length - 1))}
              onChange={(event) => setPreviewIndex(Number(event.target.value))}
            >
              {items.map((row, index) => (
                <option key={row.id} value={index}>
                  {index + 1}. {row.text.slice(0, 48)}
                </option>
              ))}
            </select>
          ) : null}
        </div>
        {item ? (
          <div className="space-y-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-7 text-slate-800">
              <p className="mb-2 text-[11px] text-slate-400">پیام سؤال</p>
              <div
                className="[&_code]:rounded [&_code]:bg-white [&_code]:px-1 [&_hr]:my-3 [&_hr]:border-slate-300"
                dangerouslySetInnerHTML={{ __html: previewMarkup(preview.question) }}
              />
              {item.kind === "range" ? (
                <div className="mt-3 space-y-1 font-mono text-xs tracking-wide text-slate-500" dir="ltr">
                  <p>۱۰ ۹ ۸ ۷ ۶</p>
                  <p>۵ ۴ ۳ ۲ ۱ ۰</p>
                </div>
              ) : null}
            </div>
            {preview.guide ? (
              <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm leading-7 text-slate-800">
                <p className="mb-2 text-[11px] text-slate-400">پیام راهنما — بدون نقل‌قول</p>
                <div
                  className="[&_code]:rounded [&_code]:bg-slate-50 [&_code]:px-1 [&_hr]:my-3 [&_hr]:border-slate-300"
                  dangerouslySetInnerHTML={{ __html: previewMarkup(preview.guide) }}
                />
              </div>
            ) : (
              <p className="text-xs text-slate-400">پیام راهنما فرستاده نمی‌شود.</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-500">اول در تب سؤال‌ها یک سؤال بگذارید.</p>
        )}
      </div>
    </section>
  );
}
