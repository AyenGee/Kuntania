import { NextResponse, type NextRequest } from "next/server";

/**
 * Optimistic gate for /admin: if there is no session cookie at all, send the visitor to the
 * login page without touching the database. This is NOT the security boundary. Every admin
 * page, server action and route handler re-checks the session server-side (requireAdmin).
 * Also keeps the admin area out of search results.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLogin = pathname === "/admin/login";

  if (!isLogin && !request.cookies.has("kn_admin")) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  const response = NextResponse.next();
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export const config = { matcher: ["/admin", "/admin/:path*"] };
