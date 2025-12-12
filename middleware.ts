import { type NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { isDevelopmentEnvironment } from "./lib/constants";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle OPTIONS requests for CORS preflight (critical for iOS Safari)
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  /*
   * Playwright starts the dev server and requires a 200 status to
   * begin the tests, so this ensures that the tests can start
   */
  if (pathname.startsWith("/ping")) {
    return new Response("pong", { status: 200 });
  }

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const isProduction = process.env.NODE_ENV === "production";
  const cookieName = isProduction ? "__Secure-authjs.session-token" : "authjs.session-token";

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: isProduction,
    cookieName: cookieName,
  });

  if (!process.env.AUTH_SECRET) {
    console.warn("Middleware: AUTH_SECRET is MISSING");
  }

  if (!token) {
    if (["/login", "/register", "/forgot-password", "/reset-password"].includes(pathname)) {
      return NextResponse.next();
    }
    const redirectUrl = encodeURIComponent(request.url);
    return NextResponse.redirect(
      new URL(`/login?redirectUrl=${redirectUrl}`, request.url)
    );
  }

  if (token && ["/login", "/register", "/forgot-password", "/reset-password"].includes(pathname)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (pathname.startsWith("/admin")) {
    if (token?.role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/chat/:id",
    "/api/:path*",
    "/login",
    "/register",

    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
