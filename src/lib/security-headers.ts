/**
 * Security headers, built as a pure function so they can be unit-tested and reused by
 * next.config.ts. See the README ("Security headers") for the reasoning behind each choice.
 */

export type HeaderEntry = { key: string; value: string };

/** Origin ("https://host") of a URL, or null if it isn't a valid http(s) URL. */
export function originOf(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:" ? u.origin : null;
  } catch {
    return null;
  }
}

export type HeaderOptions = {
  isProd: boolean;
  /** Site is served over HTTPS (so upgrading insecure requests and HSTS make sense). */
  https?: boolean;
  analyticsUrl?: string;
};

export function buildCsp(opts: HeaderOptions): string {
  const analyticsOrigin = originOf(opts.analyticsUrl);

  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    // Next.js App Router emits inline bootstrap scripts, and a nonce-based policy would force
    // every page to render dynamically (no static pages). 'unsafe-inline' is the documented
    // trade-off; everything else below stays strict. React dev tooling needs 'unsafe-eval'.
    "script-src": [
      "'self'",
      "'unsafe-inline'",
      ...(opts.isProd ? [] : ["'unsafe-eval'"]),
      ...(analyticsOrigin ? [analyticsOrigin] : []),
    ],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:"],
    "font-src": ["'self'", "data:"],
    "connect-src": ["'self'", ...(analyticsOrigin ? [analyticsOrigin] : [])],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    // The checkout hands the browser to PayFast with a form POST (and PayFast sends it back).
    "form-action": [
      "'self'",
      "https://www.payfast.co.za",
      "https://sandbox.payfast.co.za",
    ],
    "frame-ancestors": ["'none'"],
  };

  const parts = Object.entries(directives).map(([k, v]) => `${k} ${v.join(" ")}`);
  if (opts.isProd && opts.https) parts.push("upgrade-insecure-requests");
  return parts.join("; ");
}

export function securityHeaders(opts: HeaderOptions): HeaderEntry[] {
  const headers: HeaderEntry[] = [
    { key: "Content-Security-Policy", value: buildCsp(opts) },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      value:
        "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
    },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ];
  if (opts.isProd && opts.https) {
    headers.push({
      key: "Strict-Transport-Security",
      value: "max-age=31536000; includeSubDomains",
    });
  }
  return headers;
}
