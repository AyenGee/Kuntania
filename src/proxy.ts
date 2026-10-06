import { NextResponse, type NextRequest } from "next/server";
import { isMutation, isSameOrigin } from "@/lib/origin";

/**
 * Gate for /admin:
 *  1. Mutations (POST etc.) must come from our own origin (CSRF defence in depth).
 *  2. If there is no session cookie at all, send the visitor to the login page without
 *     touching the database. This is NOT the security boundary: every admin page, server
 *     action and route handler re-checks the session server-side (requireAdmin).
 * Also keeps the admin area out of search results and out of caches.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    isMutation(request.method) &&
    !isSameOrigin(
      request.headers.get("origin"),
      request.headers.get("host"),
      request.headers.get("x-forwarded-host"),
    )
  ) {
    return new NextResponse("Forbidden", { status: 403 });
  }

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
