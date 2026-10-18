import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/config";

function isProtectedPath(pathname: string) {
  if (pathname === "/workspace" || pathname.startsWith("/workspace/")) return true;
  if (pathname === "/knowledge/new" || pathname.startsWith("/knowledge/new/")) return true;
  return /^\/knowledge\/[^/]+\/edit\/?$/.test(pathname);
}

// Keep production clickjacking protection. Only explicit, DB-free internal previews may embed.
function framePolicy(response: NextResponse) {
  if (process.env.HADIRAN_TEST_MODE !== "1" || process.env.DATABASE_URL) response.headers.set("X-Frame-Options", "DENY");
  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ticket = request.nextUrl.searchParams.get("preview_access");
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete("x-hadiran-preview-ticket");
  if (ticket) requestHeaders.set("x-hadiran-preview-ticket", ticket);
  const forwarded = () => {
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    if (ticket) { response.headers.set("Referrer-Policy", "no-referrer"); response.headers.set("Cache-Control", "private, no-store"); }
    return framePolicy(response);
  };
  if (ticket || !isProtectedPath(pathname)) return forwarded();
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (token || request.cookies.has("hadiran_preview_owner")) return forwarded();
  const url = request.nextUrl.clone();
  url.pathname = "/signin";
  url.searchParams.set("next", pathname);
  return framePolicy(NextResponse.redirect(url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
