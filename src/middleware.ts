import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/config";

function isProtectedPath(pathname: string) {
  if (pathname === "/workspace" || pathname.startsWith("/workspace/")) return true;
  if (pathname === "/knowledge/new" || pathname.startsWith("/knowledge/new/")) return true;
  return /^\/knowledge\/[^/]+\/edit\/?$/.test(pathname);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!isProtectedPath(pathname)) return NextResponse.next();
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (token) return NextResponse.next();
  const url = request.nextUrl.clone();
  url.pathname = "/signin";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/knowledge/new", "/knowledge/:slug/edit", "/workspace", "/workspace/:path*"],
};
