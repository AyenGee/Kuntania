import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Policy pages read Markdown from content/policies at runtime; make sure it is deployed.
  outputFileTracingIncludes: { "/*": ["./content/policies/**/*"] },
};

export default nextConfig;
