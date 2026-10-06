import { describe, expect, it } from "vitest";
import { buildCsp, originOf, securityHeaders } from "./security-headers";

describe("buildCsp", () => {
  const prod = buildCsp({ isProd: true, https: true });

  it("locks down the dangerous directives", () => {
    expect(prod).toContain("default-src 'self'");
    expect(prod).toContain("object-src 'none'");
    expect(prod).toContain("frame-ancestors 'none'");
    expect(prod).toContain("base-uri 'self'");
    expect(prod).toContain("upgrade-insecure-requests");
  });

  it("allows PayFast form posts (and only PayFast) outside our own origin", () => {
    expect(prod).toContain(
      "form-action 'self' https://www.payfast.co.za https://sandbox.payfast.co.za",
    );
  });

  it("allows eval only in development", () => {
    expect(prod).not.toContain("unsafe-eval");
    expect(buildCsp({ isProd: false })).toContain("'unsafe-eval'");
    expect(buildCsp({ isProd: false })).not.toContain("upgrade-insecure-requests");
    expect(buildCsp({ isProd: true, https: false })).not.toContain(
      "upgrade-insecure-requests",
    );
  });

  it("allows nothing extra when no analytics is configured", () => {
    const script = prod.split("; ").find((d) => d.startsWith("script-src"))!;
    expect(script).toBe("script-src 'self' 'unsafe-inline'");
    expect(prod.split("; ").find((d) => d.startsWith("connect-src"))).toBe(
      "connect-src 'self'",
    );
  });

  it("allows only the analytics origin when configured", () => {
    const csp = buildCsp({
      isProd: true,
      analyticsUrl: "https://plausible.io/js/script.js",
    });
    expect(csp).toContain("script-src 'self' 'unsafe-inline' https://plausible.io");
    expect(csp).toContain("connect-src 'self' https://plausible.io");
    expect(csp).not.toContain("plausible.io/js");
  });

  it("ignores a malformed analytics URL", () => {
    expect(buildCsp({ isProd: true, analyticsUrl: "javascript:alert(1)" })).not.toContain(
      "javascript",
    );
  });
});

describe("securityHeaders", () => {
  it("sets the expected protective headers", () => {
    const h = Object.fromEntries(
      securityHeaders({ isProd: true, https: true }).map((x) => [x.key, x.value]),
    );
    expect(h["X-Frame-Options"]).toBe("DENY");
    expect(h["X-Content-Type-Options"]).toBe("nosniff");
    expect(h["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(h["Strict-Transport-Security"]).toMatch(/^max-age=\d+; includeSubDomains/);
    expect(h["Permissions-Policy"]).toContain("camera=()");
    expect(h["Content-Security-Policy"]).toBeTruthy();
  });

  it("does not send HSTS in development", () => {
    const keys = securityHeaders({ isProd: false }).map((x) => x.key);
    expect(keys).not.toContain("Strict-Transport-Security");
  });
});

describe("originOf", () => {
  it("returns the origin of http(s) URLs only", () => {
    expect(originOf("https://example.com/a/b?c=d")).toBe("https://example.com");
    expect(originOf("ftp://example.com")).toBeNull();
    expect(originOf("nope")).toBeNull();
    expect(originOf(undefined)).toBeNull();
  });
});
