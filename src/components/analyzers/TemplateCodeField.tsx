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
}: {
  value: string;
  language: "html" | "css" | "xml";
  onChange: (value: string) => void;
  editorRef?: MutableRefObject<ReactCodeMirrorRef | null>;
}) {
  const localRef = useRef<ReactCodeMirrorRef>(null);
  const ref = editorRef ?? localRef;
  const extensions = useMemo(() => (language === "css" ? [css()] : [html()]), [language]);

  return (
    <div dir="ltr" className="overflow-hidden rounded-xl border border-slate-200 text-left">
      <CodeMirror
        ref={ref}
        value={value}
        height="320px"
        theme="light"
        extensions={extensions}
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
