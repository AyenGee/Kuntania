import type { MetadataRoute } from "next";
import { getDb } from "@/lib/db";
import { siteUrl } from "@/lib/site-url";

// Products come from the database, so build this on request rather than at build time.
export const dynamic = "force-dynamic";

const STATIC_PATHS = [
  "/",
  "/shop",
  "/faq",
  "/contact",
  "/shipping-returns",
  "/terms",
  "/privacy",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const entries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: `${base}${path === "/" ? "" : path}`,
  }));

  try {
    const products = await getDb().product.findMany({
      where: { active: true },
      select: { slug: true, updatedAt: true },
    });
    for (const p of products) {
      entries.push({ url: `${base}/products/${p.slug}`, lastModified: p.updatedAt });
    }
  } catch (error) {
    // If the database is unreachable, still serve the static pages.
    console.error(
      JSON.stringify({
        event: "sitemap.products_failed",
        error: error instanceof Error ? error.message : String(error),
      }),
    );
  }
  return entries;
}
