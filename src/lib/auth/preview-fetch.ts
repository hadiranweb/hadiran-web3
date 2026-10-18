"use client";
import { PREVIEW_SESSION_KEY } from "./preview-client";
/** Real sessions are unchanged. Only the internal preview carries its signed grant in API URLs. */
export function previewFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  if (typeof window === "undefined" || typeof input !== "string" || !input.startsWith("/api/")) return globalThis.fetch(input, init);
  let ticket = new URL(window.location.href).searchParams.get("preview_access") || "";
  if (!ticket) { try { ticket = sessionStorage.getItem(PREVIEW_SESSION_KEY) || ""; } catch {} }
  if (!ticket) return globalThis.fetch(input, init);
  const url = new URL(input, window.location.origin);
  url.searchParams.set("preview_access", ticket);
  return globalThis.fetch(url.pathname + url.search, init);
}
