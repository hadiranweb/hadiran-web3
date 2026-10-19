"use client";

import { useMemo, useRef, useState } from "react";
import type { ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { insertAtCursor, TemplateCodeField } from "@/components/analyzers/TemplateCodeField";
import {
  BOT_QUESTION_TOKENS,
  botQuestionTemplateOf,
  interpolateBotQuestion,
  botQuestionVars,
  DEFAULT_BOT_QUESTION_TEMPLATE,
} from "@/lib/analyzers/bot-display";
import { itemsOf, type AnalyzerPack } from "@/lib/analyzers/pack";
import { TELEGRAM_RULE, telegramQuestionHtml } from "@/lib/bots/html";

function previewMarkup(html: string) {
  return html
    .replaceAll(TELEGRAM_RULE, "<hr />")
    .replaceAll("\n", "<br />");
}

export function BotDisplayEditor({
  pack,
  canEdit,
  onChange,
}: {
  pack: AnalyzerPack;
  canEdit: boolean;
  onChange: (questionTemplateFa: string) => void;
}) {
  const editorRef = useRef<ReactCodeMirrorRef>(null);
  const items = itemsOf(pack);
  const [previewIndex, setPreviewIndex] = useState(0);
  const template = botQuestionTemplateOf(pack);
  const item = items[Math.min(previewIndex, Math.max(0, items.length - 1))] ?? null;
  const previewHtml = useMemo(() => {
    if (!item) return "";
    const markdown = interpolateBotQuestion(template, botQuestionVars(pack, item, items.indexOf(item)));
    return telegramQuestionHtml(markdown);
  }, [item, items, pack, template]);

  function insert(token: string) {
    if (!canEdit) return;
    if (!insertAtCursor(editorRef, token)) onChange(`${template}${token}`);
  }

  return (
    <section className="min-w-0 space-y-4 rounded-2xl border border-line bg-elev p-5">
      <div>
        <h2 className="text-base font-bold text-ink">نحوه نمایش در ربات</h2>
        <p className="mt-1 text-xs leading-6 text-muted">
          قالب همهٔ سؤال‌های همین آزمون در تلگرام. وب همان متن تب سؤال‌هاست. نشانه‌ها:{" "}
          <span dir="ltr">**پررنگ**</span> <span dir="ltr">__کج__</span> <span dir="ltr">`کد`</span> و خط{" "}
          <span dir="ltr">---</span>. دکمهٔ ۰–۱۰ جدا می‌آید، زیر پیام.
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
            className="rounded-lg bg-paper px-2 py-1 text-right disabled:opacity-50 hover:bg-paper"
          >
            <span className="block font-mono text-[11px] text-mark" dir="ltr">
              {row.token}
            </span>
            <span className="block text-[11px] text-muted">{row.hintFa}</span>
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        <button
          type="button"
          disabled={!canEdit}
          className="rounded-lg border border-line px-2 py-1"
          onClick={() => insert("**")}
        >
          پررنگ
        </button>
        <button
          type="button"
          disabled={!canEdit}
          className="rounded-lg border border-line px-2 py-1"
          onClick={() => insert("__")}
        >
          کج
        </button>
        <button
          type="button"
          disabled={!canEdit}
          className="rounded-lg border border-line px-2 py-1"
          onClick={() => insert("\n---\n")}
        >
          خط جدا
        </button>
        <button
          type="button"
          disabled={!canEdit}
          className="rounded-lg border border-line px-2 py-1"
          onClick={() => onChange(DEFAULT_BOT_QUESTION_TEMPLATE)}
        >
          بازگشت به پیش‌فرض
        </button>
      </div>
      <TemplateCodeField
        editorRef={editorRef}
        value={template}
        language="text"
        dir="rtl"
        height="240px"
        editable={canEdit}
        onChange={(value) => {
          if (canEdit) onChange(value);
        }}
      />
      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-medium text-muted">پیش‌نمایش با سؤال نمونه</p>
          {items.length > 1 ? (
            <select
              className="max-w-full rounded-lg border border-line bg-elev px-2 py-1 text-xs"
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
          <div className="rounded-xl border border-line bg-paper p-3 text-sm leading-7 text-ink [overflow-wrap:anywhere]">
            <div
              className="[&_code]:rounded [&_code]:bg-elev [&_code]:px-1 [&_hr]:my-3 [&_hr]:border-line"
              dangerouslySetInnerHTML={{ __html: previewMarkup(previewHtml) }}
            />
            {item.kind === "range" ? (
              <p className="mt-3 font-mono text-xs tracking-wide text-muted" dir="ltr">
                ۱۰ ۹ ۸ ۷ ۶ ۵ ۴ ۳ ۲ ۱ ۰
              </p>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-muted">اول در تب سؤال‌ها یک سؤال بگذارید.</p>
        )}
      </div>
    </section>
  );
}
