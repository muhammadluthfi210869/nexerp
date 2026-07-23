import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPaths = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/_next/static",
  "/_next/image",
  "/favicon.ico",
  "/manifest.json",
  "/nexerp-logo.jpeg",
  "/api",
];

const staticFilePattern = /\.(jpe?g|png|gif|webp|svg|ico|css|js|woff2?|ttf|eot)$/i;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (publicPaths.some((path) => pathname === path || pathname.startsWith(path + "/"))) {
    return NextResponse.next();
  }

  if (staticFilePattern.test(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get("token")?.value ||
                request.headers.get("authorization")?.replace("Bearer ", "");

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json|nexerp-logo\.jpeg).*)"],
};
