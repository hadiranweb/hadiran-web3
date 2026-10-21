"use client";

import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
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

const COLORS = ["#0f172a", "#1e3a5f", "#354B60", "#b45309", "#7f0000", "#ffffff"];

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

function toHex(color: string) {
  const match = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/.exec(color);
  if (!match) return "#000000";
  return `#${[match[1], match[2], match[3]].map((part) => Number(part).toString(16).padStart(2, "0")).join("")}`;
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
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [hid, setHid] = useState<string | null>(null);
  const [box, setBox] = useState<Box | null>(null);
  const [editing, setEditing] = useState(false);
  const editingRef = useRef(false);
  const hidRef = useRef<string | null>(null);
  const htmlRef = useRef(chrome.html);
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

  // رفرنس‌ها همگام با آخرین رندر نگه داشته می‌شوند؛ خواندنشان خارج از رندر است.
  useLayoutEffect(() => {
    editingRef.current = editing;
    hidRef.current = hid;
    htmlRef.current = chrome.html;
  });

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

  function commitStyle(id: string, el: HTMLElement) {
    onHtml(setElementStyle(htmlRef.current, id, el.getAttribute("style") || ""));
  }

  function finishTextEdit() {
    const id = hidRef.current;
    if (!id) {
      setEditing(false);
      editingRef.current = false;
      return;
    }
    const el = liveEl(id);
    setEditing(false);
    editingRef.current = false;
    if (!el) return;
    el.contentEditable = "false";
    const locked = sourceHasMustache(htmlRef.current, id);
    let next = htmlRef.current;
    if (!locked) next = setElementText(next, id, el.innerText);
    next = setElementStyle(next, id, el.getAttribute("style") || "");
    onHtml(next);
  }

  useLayoutEffect(() => {
    if (!hid) return;
    if (!liveEl(hid)) {
      // عنصر انتخاب‌شده بعد از رندر واقعی وجود ندارد؛ پاک‌سازی وضعیت همین‌جا درست است.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHid(null);
      setBox(null);
      return;
    }
    refreshBox(hid);
    // refreshBox هر رندر بازسازی می‌شود؛ افزودنش به وابستگی‌ها حلقه می‌سازد.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hid, preview.html]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        if (editingRef.current) finishTextEdit();
        else {
          setHid(null);
          setBox(null);
        }
        return;
      }
      if (event.key === "Enter" && !event.shiftKey && editingRef.current) {
        event.preventDefault();
        finishTextEdit();
      }
    }
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
    // finishTextEdit عمداً یک‌بار در mount بسته می‌شود؛ وگرنه با هر تایپ دوباره سیم‌کشی می‌شد.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function selectFromEvent(event: ReactPointerEvent<HTMLDivElement>) {
    if (editingRef.current) {
      const current = hidRef.current ? liveEl(hidRef.current) : null;
      const target = event.target as Node;
      if (current && current.contains(target)) return;
      if (toolbarRef.current?.contains(target)) return;
      finishTextEdit();
      return;
    }
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
    commitStyle(session.hid, el);
  }

  function startTextEdit() {
    if (!hid) return;
    if (sourceHasMustache(chrome.html, hid)) return;
    const el = liveEl(hid);
    if (!el) return;
    setEditing(true);
    editingRef.current = true;
    el.contentEditable = "true";
    el.focus();
  }

  function applyCss(patch: Record<string, string>) {
    if (!hid) return;
    const el = liveEl(hid);
    if (!el) return;
    Object.assign(el.style, patch);
    if (!editing) commitStyle(hid, el);
    refreshBox(hid);
  }

  function bumpFont(delta: number) {
    if (!hid) return;
    const el = liveEl(hid);
    if (!el) return;
    const current = Number.parseFloat(getComputedStyle(el).fontSize) || 16;
    applyCss({ fontSize: `${Math.max(8, current + delta)}px` });
  }

  function toggleBold() {
    if (!hid) return;
    const el = liveEl(hid);
    if (!el) return;
    const weight = Number.parseInt(getComputedStyle(el).fontWeight, 10) || 400;
    applyCss({ fontWeight: weight >= 600 ? "400" : "700" });
  }

  const locked = hid ? sourceHasMustache(chrome.html, hid) : false;
  const tag = hid ? elementTag(chrome.html, hid) : "";
  /* عنصر زندهٔ پیش‌نمایش فقط برای خواندن استایل محاسبه‌شده خوانده می‌شود؛
     این کامپوننت ویرایشگر WYSIWYG است و همان DOM مرجعش است. */
  /* eslint-disable react-hooks/refs */
  const live = hid ? liveEl(hid) : null;
  const cs = live ? getComputedStyle(live) : null;
  /* eslint-enable react-hooks/refs */

  return (
    <div className="space-y-3">
      <p className="text-xs leading-6 text-slate-500">
        انتخاب، کشیدن، گوشه = اندازه. دوبار کلیک = متن آزاد. خروج از ویرایش متن یا پارامتر: Escape، کلیک بیرون، یا Enter
        (Shift+Enter خط تازه). متغیر <span dir="ltr">{"{{ }}"}</span> قفل است؛ مقدار نمونه پخته نمی‌شود.
      </p>
      {hid ? (
        <div ref={toolbarRef} className="space-y-2 rounded-xl border border-slate-200 bg-white p-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
            <span className="rounded-lg bg-slate-100 px-2 py-1 font-mono" dir="ltr">
              {tag} #{hid}
            </span>
            {editing ? (
              <span className="rounded-lg bg-indigo-50 px-2 py-1 text-indigo-800">ویرایش متن — Escape خروج</span>
            ) : locked ? (
              <span>متغیر دارد — فقط ظاهر</span>
            ) : (
              <span>متن آزاد است</span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button type="button" className="rounded-lg border border-slate-200 px-2 py-1 text-xs" onMouseDown={(event) => event.preventDefault()} onClick={toggleBold}>
              پررنگ
            </button>
            <button type="button" className="rounded-lg border border-slate-200 px-2 py-1 text-xs" onMouseDown={(event) => event.preventDefault()} onClick={() => bumpFont(1)}>
              بزرگ‌تر
            </button>
            <button type="button" className="rounded-lg border border-slate-200 px-2 py-1 text-xs" onMouseDown={(event) => event.preventDefault()} onClick={() => bumpFont(-1)}>
              کوچک‌تر
            </button>
            <button type="button" className="rounded-lg border border-slate-200 px-2 py-1 text-xs" onMouseDown={(event) => event.preventDefault()} onClick={() => applyCss({ textAlign: "right" })}>
              راست
            </button>
            <button type="button" className="rounded-lg border border-slate-200 px-2 py-1 text-xs" onMouseDown={(event) => event.preventDefault()} onClick={() => applyCss({ textAlign: "center" })}>
              وسط
            </button>
            <button type="button" className="rounded-lg border border-slate-200 px-2 py-1 text-xs" onMouseDown={(event) => event.preventDefault()} onClick={() => applyCss({ textAlign: "left" })}>
              چپ
            </button>
            <span className="mx-1 text-[11px] text-slate-400">متن</span>
            {COLORS.map((color) => (
              <button
                key={`fg-${color}`}
                type="button"
                title={color}
                className="h-5 w-5 rounded-full border border-slate-300"
                style={{ background: color }}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => applyCss({ color })}
              />
            ))}
            <input
              type="color"
              aria-label="رنگ متن"
              className="h-6 w-8 cursor-pointer rounded border border-slate-200"
              value={cs ? toHex(cs.color) : "#0f172a"}
              onMouseDown={(event) => event.preventDefault()}
              onChange={(event) => applyCss({ color: event.target.value })}
            />
            <span className="mx-1 text-[11px] text-slate-400">زمینه</span>
            {COLORS.map((color) => (
              <button
                key={`bg-${color}`}
                type="button"
                title={color}
                className="h-5 w-5 rounded-full border border-slate-300"
                style={{ background: color }}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => applyCss({ backgroundColor: color })}
              />
            ))}
            <input
              type="color"
              aria-label="رنگ زمینه"
              className="h-6 w-8 cursor-pointer rounded border border-slate-200"
              value={cs ? toHex(cs.backgroundColor === "rgba(0, 0, 0, 0)" ? "#ffffff" : cs.backgroundColor) : "#ffffff"}
              onMouseDown={(event) => event.preventDefault()}
              onChange={(event) => applyCss({ backgroundColor: event.target.value })}
            />
            <span className="mx-1 text-[11px] text-slate-400">فاصله</span>
            {["0", "4px", "8px", "16px"].map((pad) => (
              <button
                key={pad}
                type="button"
                className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => applyCss({ padding: pad })}
              >
                {pad === "0" ? "۰" : pad}
              </button>
            ))}
            {editing ? (
              <button type="button" className="mr-auto rounded-xl bg-slate-900 px-3 py-1.5 text-xs text-white" onClick={finishTextEdit}>
                پایان ویرایش
              </button>
            ) : null}
          </div>
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
    </div>
  );
}
