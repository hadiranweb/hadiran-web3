"use client";

import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import CodeMirror, { type ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { useMemo, useRef, type MutableRefObject } from "react";

export function TemplateCodeField({
  value,
  language,
  onChange,
  editorRef,
  dir = "ltr",
  height = "320px",
  editable = true,
}: {
  value: string;
  language: "html" | "css" | "xml" | "text";
  onChange: (value: string) => void;
  editorRef?: MutableRefObject<ReactCodeMirrorRef | null>;
  dir?: "ltr" | "rtl";
  height?: string;
  editable?: boolean;
}) {
  const localRef = useRef<ReactCodeMirrorRef>(null);
  const ref = editorRef ?? localRef;
  const extensions = useMemo(() => {
    if (language === "css") return [css()];
    if (language === "text") return [];
    return [html()];
  }, [language]);

  return (
    <div
      dir={dir}
      className={`overflow-hidden rounded-xl border border-slate-200 ${dir === "rtl" ? "text-right" : "text-left"}`}
    >
      <CodeMirror
        ref={ref}
        value={value}
        height={height}
        theme="light"
        extensions={extensions}
        editable={editable}
        basicSetup={{ lineNumbers: true, foldGutter: true, highlightActiveLine: true }}
        onChange={onChange}
      />
    </div>
  );
}

export function insertAtCursor(ref: MutableRefObject<ReactCodeMirrorRef | null>, token: string) {
  const view = ref.current?.view;
  if (!view) return false;
  const from = view.state.selection.main.from;
  view.dispatch({ changes: { from, insert: token }, selection: { anchor: from + token.length } });
  view.focus();
  return true;
}
