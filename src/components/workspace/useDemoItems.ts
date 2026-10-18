"use client";
import { useMemo, useSyncExternalStore } from "react";
import type { WorkspaceItem } from "@/lib/workspace/types";
export const demoKeys = { knowledge: "hadiran-demo-knowledge-v1", projects: "hadiran-demo-projects-v1", collaborations: "hadiran-demo-collaborations-v1", products: "hadiran-demo-products-v1" };
const EVENT = "hadiran-demo-data";
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback); window.addEventListener(EVENT, callback);
  return () => { window.removeEventListener("storage", callback); window.removeEventListener(EVENT, callback); };
}
export function useDemoItems(key: string, initial: WorkspaceItem[], enabled: boolean) {
  const raw = useSyncExternalStore(subscribe, () => { if (!enabled) return ""; try { return localStorage.getItem(key) || ""; } catch { return ""; } }, () => "");
  const items = useMemo(() => {
    if (!raw) return initial;
    try { const value: unknown = JSON.parse(raw); if (Array.isArray(value) && value.every((v) => v && typeof v.id === "string" && typeof v.title === "string" && typeof v.category === "string" && typeof v.status === "string" && typeof v.detail === "string" && typeof v.updated === "string")) return value as WorkspaceItem[]; } catch {}
    return initial;
  }, [raw, initial]);
  function save(next: WorkspaceItem[]) {
    if (!enabled) throw new Error("Demo storage is disabled");
    localStorage.setItem(key, JSON.stringify(next)); window.dispatchEvent(new Event(EVENT));
  }
  return { items, save };
}
