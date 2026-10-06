import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Private or transactional pages that should never appear in search results.
      disallow: [
        "/admin",
        "/api/",
        "/cart",
        "/checkout",
        "/order-status",
        "/unsubscribe",
      ],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
