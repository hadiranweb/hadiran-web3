"use client";

/** یک منبع واحد برای زبان رابط میز (کوکی). خواندنش setState داخل effect لازم ندارد. */

export type WorkspaceLocale = "fa" | "en";

const COOKIE = "hadiran-workspace-locale";
const listeners = new Set<() => void>();
let cache: WorkspaceLocale | null = null;

export function readWorkspaceLocale(): WorkspaceLocale {
  if (cache !== null) return cache;
  try {
    const match = document.cookie.match(/(?:^|; )hadiran-workspace-locale=([^;]*)/);
    cache = match?.[1] === "en" ? "en" : "fa";
  } catch {
    cache = "fa";
  }
  return cache;
}

export function subscribeWorkspaceLocale(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setWorkspaceLocale(next: WorkspaceLocale) {
  cache = next;
  document.cookie = `${COOKIE}=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;
  for (const listener of listeners) listener();
}
