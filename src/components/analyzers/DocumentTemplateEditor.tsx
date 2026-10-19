"use client";

import { useMemo, useRef, useState } from "react";
import type { ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { ChromeDocument } from "@/components/analyzers/ChromeDocument";
import { DocumentVisualEditor } from "@/components/analyzers/DocumentVisualEditor";
import { stampHids } from "@/components/analyzers/document-html-edit";
import { insertAtCursor, TemplateCodeField } from "@/components/analyzers/TemplateCodeField";
import {
  DOCUMENT_PAGE_SIZES,
  documentVariableCatalog,
  normalizePageSize,
  renderChromeDocument,
  sampleInterpretationDocument,
  type DocumentChrome,
} from "@/lib/analyzers/document-chrome";

const PAGE_BREAK = `\n<section class="doc-page">\n\n</section>\n`;

type TemplateRow = {
  id: string;
  titleFa: string;
  chrome: DocumentChrome;
};

type Pane = "html" | "css" | "logo-light" | "logo-dark" | "logo-seal";

const PANES: { id: Pane; label: string }[] = [
  { id: "html", label: "داستان HTML" },
  { id: "css", label: "CSS جای‌گذاری" },
  { id: "logo-light", label: "SVG جلد" },
  { id: "logo-dark", label: "SVG روشن" },
  { id: "logo-seal", label: "SVG مهر" },
];

export function DocumentTemplateEditor({ initial }: { initial: TemplateRow[] }) {
  const [templates, setTemplates] = useState(initial);
  const [id, setId] = useState(initial[0]?.id ?? "hadiran");
  const current = templates.find((row) => row.id === id) ?? templates[0];
  const [chrome, setChrome] = useState<DocumentChrome | null>(current?.chrome ?? null);
  const [pane, setPane] = useState<Pane>("html");
  const [surface, setSurface] = useState<"code" | "visual">("code");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const editorRef = useRef<ReactCodeMirrorRef>(null);
  const variables = useMemo(() => documentVariableCatalog(), []);

  function selectTemplate(nextId: string) {
    const row = templates.find((item) => item.id === nextId);
    setId(nextId);
    const nextChrome = row?.chrome ?? null;
    if (surface === "visual" && nextChrome && !nextChrome.html.includes("data-hid")) {
      setChrome({ ...nextChrome, html: stampHids(nextChrome.html) });
    } else {
      setChrome(nextChrome);
    }
    setSaved(false);
    setError(null);
  }

  function patch(next: Partial<DocumentChrome> | { logos: DocumentChrome["logos"] }) {
    setChrome((currentChrome) => (currentChrome ? { ...currentChrome, ...next } : currentChrome));
    setSaved(false);
  }

  const codeValue =
    chrome == null
      ? ""
      : pane === "html"
        ? chrome.html
        : pane === "css"
          ? chrome.css
          : pane === "logo-light"
            ? chrome.logos.light
            : pane === "logo-dark"
              ? chrome.logos.dark
              : chrome.logos.seal;

  function onCode(value: string) {
    if (!chrome) return;
    if (pane === "html") patch({ html: value });
    else if (pane === "css") patch({ css: value });
    else if (pane === "logo-light") patch({ logos: { ...chrome.logos, light: value } });
    else if (pane === "logo-dark") patch({ logos: { ...chrome.logos, dark: value } });
    else patch({ logos: { ...chrome.logos, seal: value } });
  }

  function insertToken(token: string) {
    if (!insertAtCursor(editorRef, token)) {
      onCode(`${codeValue}${token}`);
    }
  }

  async function save() {
    if (!chrome || !current) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/workspace/document-templates/${current.id}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ chrome }),
      });
      const data = (await res.json()) as { template?: TemplateRow; error?: string };
      if (!res.ok || !data.template) {
        setError("ذخیره نشد.");
        return;
      }
      setTemplates((list) => list.map((row) => (row.id === data.template!.id ? data.template! : row)));
      setChrome(data.template.chrome);
      setSaved(true);
    } catch {
      setError("ذخیره نشد.");
    } finally {
      setBusy(false);
    }
  }

  if (!current || !chrome) {
    return <p className="text-sm text-slate-500">قالبی نیست.</p>;
  }

  const preview = renderChromeDocument(chrome, sampleInterpretationDocument(current.id));

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
      <div>
        <h2 className="text-lg font-bold text-slate-900">ویرایشگر قالب</h2>
        <p className="mt-1 text-sm leading-7 text-slate-500">
          داستان سند را در تب HTML بنویسید یا روی خود پیش‌نمایش جابه‌جا و بزرگ و کوچک کنید. ادیتور کد سر جایش است.
          هر <span dir="ltr">section.doc-page</span> یک برگ است؛ پیش‌فرض اندازهٔ چاپ A4 است. هدر و پانوشت سایت در چاپ
          نمی‌آید. متغیرها را با <span dir="ltr">{"{{نام}}"}</span> صدا بزنید؛ مقدار نمونه جای آن‌ها پخته نمی‌شود.
        </p>
      </div>
      <label className="block text-sm">
        <span className="mb-1 block text-slate-600">قالب</span>
        <select
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
          value={current.id}
          onChange={(event) => selectTemplate(event.target.value)}
        >
          {templates.map((row) => (
            <option key={row.id} value={row.id}>
              {row.titleFa}
            </option>
          ))}
        </select>
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block text-slate-600">اندازهٔ برگ چاپ</span>
          <select
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            value={chrome.pageSize}
            onChange={(event) => patch({ pageSize: normalizePageSize(event.target.value) })}
          >
            {DOCUMENT_PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size === "A4" ? "A4 ایستاده (پیش‌فرض)" : "A4 خوابیده"}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-slate-600">حاشیهٔ چاپ</span>
          <input
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            dir="ltr"
            value={chrome.pageMargin}
            onChange={(event) => patch({ pageMargin: event.target.value })}
            placeholder="0"
          />
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setSurface("code")}
          className={`rounded-full px-3 py-1 text-xs ${
            surface === "code" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
          }`}
        >
          ویرایش کد
        </button>
        <button
          type="button"
          onClick={() => {
            setSurface("visual");
            if (!chrome.html.includes("data-hid")) patch({ html: stampHids(chrome.html) });
          }}
          className={`rounded-full px-3 py-1 text-xs ${
            surface === "visual" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
          }`}
        >
          ویرایش روی پیش‌نمایش
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void save()}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {busy ? "…" : "ذخیرهٔ قالب"}
        </button>
        {saved ? <p className="self-center text-sm text-emerald-700">ذخیره شد.</p> : null}
        {error ? <p className="self-center text-sm text-red-700">{error}</p> : null}
      </div>
      {surface === "visual" ? (
        <DocumentVisualEditor
          key={current.id}
          chrome={chrome}
          templateId={current.id}
          onHtml={(html) => patch({ html })}
        />
      ) : (
        <>
      <div className="flex flex-wrap gap-2">
        {PANES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setPane(item.id)}
            className={`rounded-full px-3 py-1 text-xs ${
              pane === item.id ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            if (!chrome) return;
            setPane("html");
            patch({ html: `${chrome.html}${PAGE_BREAK}` });
          }}
          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700"
        >
          درج قطع صفحه
        </button>
      </div>
      <TemplateCodeField
        key={pane}
        editorRef={editorRef}
        value={codeValue}
        language={pane === "css" ? "css" : "html"}
        onChange={onCode}
      />
      <div>
        <p className="mb-2 text-xs font-medium text-slate-500">متغیرها — کلیک = درج در مکان نما</p>
        <div className="max-h-40 overflow-auto rounded-xl border border-slate-100 p-2">
          {variables.map((item) => (
            <button
              key={`${item.groupFa}-${item.token}`}
              type="button"
              onClick={() => insertToken(item.token)}
              className="mb-1 ml-1 inline-flex flex-col rounded-lg bg-slate-50 px-2 py-1 text-right hover:bg-indigo-50"
            >
              <span className="font-mono text-[11px] text-indigo-800" dir="ltr">
                {item.token}
              </span>
              <span className="text-[11px] text-slate-500">
                {item.groupFa} · {item.hintFa}
              </span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 text-xs font-medium text-slate-500">پیش‌نمایش با دادهٔ نمونه</p>
        <div className="overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-3">
          <ChromeDocument
            html={preview.html}
            css={preview.css}
            className={preview.className}
            pageSize={preview.pageSize}
            pageMargin={preview.pageMargin}
          />
        </div>
      </div>
        </>
      )}
    </section>
  );
}
