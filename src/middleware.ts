import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Safer defaults: prevent clickjacking unless explicitly allowed.
  const allowIframe = process.env.ALLOW_IFRAME_EMBED === "true";
  response.headers.set("X-Frame-Options", allowIframe ? "SAMEORIGIN" : "DENY");
  response.headers.set(
    "Content-Security-Policy",
    allowIframe ? "frame-ancestors 'self'" : "frame-ancestors 'none'"
  );

  return response;
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
} 