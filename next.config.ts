import type { NextConfig } from "next";
import { securityHeaders } from "./src/lib/security-headers";

const nextConfig: NextConfig = {
  // Don't advertise the framework.
  poweredByHeader: false,

  // Policy pages read Markdown from content/policies at runtime; make sure it is deployed.
  outputFileTracingIncludes: { "/*": ["./content/policies/**/*"] },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders({
          isProd: process.env.NODE_ENV === "production",
          https: (process.env.SITE_URL ?? "").startsWith("https://"),
          analyticsUrl: process.env.ANALYTICS_SCRIPT_URL,
        }),
      },
    ];
  },
};

export default nextConfig;
