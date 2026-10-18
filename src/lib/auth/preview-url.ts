/** Token retention is restricted to internal routes that can require identity. */
export function withPreviewAccess(href: string, ticket?: string) {
  if (!ticket || !/^\/(workspace|account|analyzers|shop)(\/|\?|#|$)/.test(href)) return href;
  const url = new URL(href, "https://workspace.invalid");
  url.searchParams.set("preview_access", ticket);
  return url.pathname + url.search + url.hash;
}
