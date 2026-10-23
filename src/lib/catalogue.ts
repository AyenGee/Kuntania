import { cache } from "react";
import { z } from "zod";
import { seedProducts } from "@content/products";
import { getDb } from "@/lib/db";
import { maxOrderQuantity, stockStatus, type StockStatus } from "@/lib/catalogue-stock";
import type { Product } from "@/generated/prisma/client";

const titledText = z.array(z.object({ title: z.string(), body: z.string() }));
const images = z.array(z.object({ src: z.string(), alt: z.string() }));

/** A product row with its JSON columns parsed into typed arrays. */
export type CatalogueProduct = Omit<Product, "benefits" | "howToUse" | "images"> & {
  benefits: z.infer<typeof titledText>;
  howToUse: z.infer<typeof titledText>;
  images: z.infer<typeof images>;
};

function parse(row: Product): CatalogueProduct {
  return {
    ...row,
    benefits: titledText.parse(row.benefits),
    howToUse: titledText.parse(row.howToUse),
    images: images.parse(row.images),
  };
}

/**
 * DEVELOPMENT ONLY. When the database can't be reached while running `next dev`, show the seed
 * products so pages can be previewed without Postgres. Never active in production builds, where
 * a database failure must surface as an error. Cart and checkout still need a real database.
 */
export function devFallback(error: unknown): CatalogueProduct[] {
  if (process.env.NODE_ENV === "production") throw error;
  console.warn(
    JSON.stringify({
      event: "catalogue.dev_fallback",
      note: "database unreachable; showing seed data",
    }),
  );
  const now = new Date();
  return seedProducts.map((p) => ({
    ...p,
    id: `demo-${p.slug}`,
    createdAt: now,
    updatedAt: now,
  }));
}

export async function getActiveProducts(): Promise<CatalogueProduct[]> {
  try {
    const rows = await getDb().product.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    return rows.map(parse);
  } catch (error) {
    return devFallback(error).filter((p) => p.active);
  }
}

/** Cached per request so generateMetadata and the page share one query. */
export const getProductBySlug = cache(
  async (slug: string): Promise<CatalogueProduct | null> => {
    try {
      const row = await getDb().product.findFirst({ where: { slug, active: true } });
      return row ? parse(row) : null;
    } catch (error) {
      return devFallback(error).find((p) => p.slug === slug) ?? null;
    }
  },
);

/** Another active product to suggest alongside this one ("Pairs well with"). */
export async function getPairedProduct(
  excludeId: string,
): Promise<CatalogueProduct | null> {
  try {
    const row = await getDb().product.findFirst({
      where: { active: true, id: { not: excludeId } },
      orderBy: [{ sortOrder: "asc" }],
    });
    return row ? parse(row) : null;
  } catch (error) {
    return devFallback(error).find((p) => p.id !== excludeId) ?? null;
  }
}

export { maxOrderQuantity, stockStatus, type StockStatus };
