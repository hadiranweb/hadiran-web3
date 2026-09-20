import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/config";

const WRITE_PREFIXES = ["/knowledge/new"];

function isWritePath(pathname: string) {
  if (WRITE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return true;
  return /^\/knowledge\/[^/]+\/edit\/?$/.test(pathname);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!isWritePath(pathname)) return NextResponse.next();
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (token) return NextResponse.next();
  const url = request.nextUrl.clone();
  url.pathname = "/signin";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/knowledge/new", "/knowledge/:slug/edit"],
};
