"use client";

import { useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { ChromeDocument } from "@/components/analyzers/ChromeDocument";
import {
  canSelectTag,
  elementTag,
  setElementStyle,
  setElementText,
  sourceHasMustache,
} from "@/components/analyzers/document-html-edit";
import type { DocumentChrome } from "@/lib/analyzers/document-chrome";
import { renderChromeDocument, sampleInterpretationDocument } from "@/lib/analyzers/document-chrome";

type Box = { x: number; y: number; w: number; h: number };

function frameBox(el: HTMLElement, frame: HTMLElement): Box {
  const a = el.getBoundingClientRect();
  const b = frame.getBoundingClientRect();
  return {
    x: a.left - b.left,
    y: a.top - b.top,
    w: a.width,
    h: a.height,
  };
}

export function DocumentVisualEditor({
  chrome,
  templateId,
  onHtml,
}: {
  chrome: DocumentChrome;
  templateId: string;
  onHtml: (html: string) => void;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [hid, setHid] = useState<string | null>(null);
  const [box, setBox] = useState<Box | null>(null);
  const [editing, setEditing] = useState(false);
  const drag = useRef<{
    kind: "move" | "resize";
    hid: string;
    startX: number;
    startY: number;
    startLeft: number;
    startTop: number;
    startWidth: number;
    startHeight: number;
    absolute: boolean;
    startRight: number;
  } | null>(null);

  const preview = renderChromeDocument(chrome, sampleInterpretationDocument(templateId));

  function liveEl(id: string) {
    return frameRef.current?.querySelector(`[data-hid="${id}"]`) as HTMLElement | null;
  }

  function refreshBox(id: string) {
    const frame = contentRef.current;
    const el = liveEl(id);
    if (!frame || !el) return;
    setBox(frameBox(el, frame));
  }

  useLayoutEffect(() => {
    if (!hid) return;
    if (!liveEl(hid)) {
      setHid(null);
      setBox(null);
      return;
    }
    refreshBox(hid);
  }, [hid, preview.html]);

  function selectFromEvent(event: ReactPointerEvent<HTMLDivElement>) {
    if (editing) return;
    const frame = frameRef.current;
    const content = contentRef.current;
    if (!frame || !content) return;
    let node = (event.target as HTMLElement | null)?.closest("[data-hid]") as HTMLElement | null;
    while (node && frame.contains(node)) {
      const className = node.getAttribute("class") ?? "";
      if (canSelectTag(node.tagName, className)) break;
      node = node.parentElement?.closest("[data-hid]") as HTMLElement | null;
    }
    if (!node || !frame.contains(node)) {
      setHid(null);
      setBox(null);
      return;
    }
    const id = node.getAttribute("data-hid");
    if (!id) return;
    setHid(id);
    setBox(frameBox(node, content));
  }

  function onPointerDownMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!hid || editing) return;
    const el = liveEl(hid);
    if (!el) return;
    event.preventDefault();
    event.stopPropagation();
    const cs = getComputedStyle(el);
    const absolute = cs.position === "absolute" || cs.position === "fixed";
    drag.current = {
      kind: "move",
      hid,
      startX: event.clientX,
      startY: event.clientY,
      startLeft: Number.parseFloat(el.style.left || cs.left) || 0,
      startTop: Number.parseFloat(el.style.top || cs.top) || 0,
      startRight: Number.parseFloat(el.style.right || cs.right) || 0,
      startWidth: el.offsetWidth,
      startHeight: el.offsetHeight,
      absolute,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerDownResize(event: ReactPointerEvent<HTMLDivElement>) {
    if (!hid || editing) return;
    const el = liveEl(hid);
    if (!el) return;
    event.preventDefault();
    event.stopPropagation();
    drag.current = {
      kind: "resize",
      hid,
      startX: event.clientX,
      startY: event.clientY,
      startLeft: 0,
      startTop: 0,
      startRight: 0,
      startWidth: el.offsetWidth,
      startHeight: el.offsetHeight,
      absolute: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const session = drag.current;
    const el = session ? liveEl(session.hid) : null;
    if (!session || !el) return;
    const dx = event.clientX - session.startX;
    const dy = event.clientY - session.startY;
    if (session.kind === "move") {
      if (session.absolute) {
        el.style.position = "absolute";
        el.style.top = `${session.startTop + dy}px`;
        el.style.right = `${session.startRight - dx}px`;
        el.style.left = "auto";
      } else {
        el.style.position = el.style.position || "relative";
        el.style.left = `${session.startLeft + dx}px`;
        el.style.top = `${session.startTop + dy}px`;
      }
    } else {
      el.style.width = `${Math.max(24, session.startWidth + dx)}px`;
      el.style.height = `${Math.max(16, session.startHeight + dy)}px`;
    }
    refreshBox(session.hid);
  }

  function onPointerUp() {
    const session = drag.current;
    drag.current = null;
    if (!session) return;
    const el = liveEl(session.hid);
    if (!el) return;
    onHtml(setElementStyle(chrome.html, session.hid, el.getAttribute("style") || ""));
  }

  function startTextEdit() {
    if (!hid) return;
    if (sourceHasMustache(chrome.html, hid)) return;
    const el = liveEl(hid);
    if (!el) return;
    setEditing(true);
    el.contentEditable = "true";
    el.focus();
  }

  function finishTextEdit() {
    if (!hid) return;
    const el = liveEl(hid);
    setEditing(false);
    if (!el) return;
    el.contentEditable = "false";
    onHtml(setElementText(chrome.html, hid, el.innerText));
  }

  function bumpFont(delta: number) {
    if (!hid) return;
    const el = liveEl(hid);
    if (!el) return;
    const cs = getComputedStyle(el);
    const current = Number.parseFloat(cs.fontSize) || 16;
    el.style.fontSize = `${Math.max(8, current + delta)}px`;
    onHtml(setElementStyle(chrome.html, hid, el.getAttribute("style") || ""));
  }

  const locked = hid ? sourceHasMustache(chrome.html, hid) : false;
  const tag = hid ? elementTag(chrome.html, hid) : "";

  return (
    <div className="space-y-3">
      <p className="text-xs leading-6 text-slate-500">
        روی عنصر بزنید، بکشید تا جابه‌جا شود، از گوشه اندازه عوض کنید. دوبار کلیک متن ثابت را عوض می‌کند. اگر جعبه
        متغیر داشته باشد، متن را در داستان HTML ویرایش کنید نه اینجا.
      </p>
      {hid ? (
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
          <span className="rounded-lg bg-slate-100 px-2 py-1 font-mono" dir="ltr">
            {tag} #{hid}
          </span>
          {locked ? <span>متغیر دارد — فقط جابه‌جایی و اندازه</span> : <span>متن آزاد است</span>}
          <button type="button" className="rounded-lg border border-slate-200 px-2 py-1" onClick={() => bumpFont(1)}>
            متن بزرگ‌تر
          </button>
          <button type="button" className="rounded-lg border border-slate-200 px-2 py-1" onClick={() => bumpFont(-1)}>
            متن کوچک‌تر
          </button>
        </div>
      ) : (
        <p className="text-xs text-slate-400">هنوز عنصری انتخاب نشده.</p>
      )}
      <div
        ref={frameRef}
        className="relative overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-3"
        onPointerDown={selectFromEvent}
        onDoubleClick={(event) => {
          event.preventDefault();
          startTextEdit();
        }}
      >
        <div ref={contentRef} className={`relative ${editing ? "" : "select-none"}`}>
          <ChromeDocument
            html={preview.html}
            css={preview.css}
            className={preview.className}
            pageSize={preview.pageSize}
            pageMargin={preview.pageMargin}
          />
          {hid && box && !editing ? (
            <div
              className="absolute z-10 cursor-move border-2 border-indigo-500 bg-indigo-500/5"
              style={{
                left: box.x,
                top: box.y,
                width: box.w,
                height: box.h,
                touchAction: "none",
              }}
              onPointerDown={onPointerDownMove}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              <div
                className="absolute bottom-0 right-0 h-3.5 w-3.5 cursor-nwse-resize bg-indigo-600"
                style={{ touchAction: "none" }}
                onPointerDown={onPointerDownResize}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
              />
            </div>
          ) : null}
        </div>
      </div>
      {editing ? (
        <button type="button" className="rounded-xl bg-slate-900 px-3 py-1.5 text-xs text-white" onClick={finishTextEdit}>
          پایان ویرایش متن
        </button>
      ) : null}
    </div>
  );
}
