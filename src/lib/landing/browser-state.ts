"use client";

import { useMemo, useSyncExternalStore } from "react";

const volatile = new Map<string, string>();
const failedWrites = new Set<string>();
const eventName = "hadiran:local-tools";
function read(key: string) {
  if (failedWrites.has(key)) return volatile.get(key) || "";
  try { return window.localStorage.getItem(key) || ""; }
  catch { return volatile.get(key) || ""; }
}
function subscribe(notify: () => void) {
  window.addEventListener("storage", notify);
  window.addEventListener(eventName, notify);
  return () => { window.removeEventListener("storage", notify); window.removeEventListener(eventName, notify); };
}
/** Browser-only convenience, never an authorization or entitlement source. */
export function useBrowserState<T>(key: string, fallback: T, validate: (value: unknown) => value is T) {
  const raw = useSyncExternalStore(subscribe, () => read(key), () => "");
  const value = useMemo(() => {
    try { const parsed: unknown = JSON.parse(raw); return validate(parsed) ? parsed : fallback; }
    catch { return fallback; }
  }, [raw, fallback, validate]);
  function update(next: T) {
    const serialized = JSON.stringify(next);
    volatile.set(key, serialized);
    let persisted = true;
    try { window.localStorage.setItem(key, serialized); failedWrites.delete(key); } catch { persisted = false; failedWrites.add(key); }
    window.dispatchEvent(new Event(eventName));
    return persisted;
  }
  return [value, update] as const;
}
export function localKey(scope: string, name: string) { return `hadiran:tools:v1:${scope}:${name}`; }
export function downloadText(name: string, text: string) {
  const url = URL.createObjectURL(new Blob(["\uFEFF", text], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a"); link.href = url; link.download = name;
  document.body.appendChild(link); link.click(); link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function normalizeSearch(value: string) {
  return value.replace(/ي/g, "ی").replace(/ك/g, "ک").replace(/[\u064B-\u065F\u200C]/g, "").trim().toLocaleLowerCase("fa-IR");
}
