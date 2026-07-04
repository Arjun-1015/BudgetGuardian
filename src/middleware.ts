import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/constants";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/expenses",
  "/income",
  "/dependents",
  "/onboarding",
  "/settings",
  "/goals",
  "/bills",
  "/calendar",
  "/reports",
  "/advisor",
  "/admin",
];
const AUTH_PAGES = ["/login", "/register"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSession = Boolean(req.cookies.get(SESSION_COOKIE)?.value);

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthPage = AUTH_PAGES.some((p) => pathname.startsWith(p));

  if (isProtected && !hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthPage && hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/expenses/:path*",
    "/income/:path*",
    "/dependents/:path*",
    "/onboarding/:path*",
    "/settings/:path*",
    "/goals/:path*",
    "/bills/:path*",
    "/calendar/:path*",
    "/reports/:path*",
    "/advisor/:path*",
    "/admin/:path*",
    "/login",
    "/register",
  ],
};
