import { cache } from "react";
import { z } from "zod";
import { store } from "@content/site";
import { getDb } from "@/lib/db";
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

export type StockStatus =
  { state: "in_stock" } | { state: "low"; remaining: number } | { state: "sold_out" };

/** Customer-facing stock state. `threshold` defaults to the configured low-stock level. */
export function stockStatus(
  stock: number,
  threshold = store.lowStockThreshold,
): StockStatus {
  if (stock <= 0) return { state: "sold_out" };
  if (stock <= threshold) return { state: "low", remaining: stock };
  return { state: "in_stock" };
}

/** Largest quantity a customer may order: capped by stock and the per-order maximum. */
export function maxOrderQuantity(
  stock: number,
  perOrderMax = store.maxQuantityPerOrder,
): number {
  return Math.max(0, Math.min(stock, perOrderMax));
}

export async function getActiveProducts(): Promise<CatalogueProduct[]> {
  const rows = await getDb().product.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return rows.map(parse);
}

/** Cached per request so generateMetadata and the page share one query. */
export const getProductBySlug = cache(
  async (slug: string): Promise<CatalogueProduct | null> => {
    const row = await getDb().product.findFirst({ where: { slug, active: true } });
    return row ? parse(row) : null;
  },
);

/** Another active product to suggest alongside this one ("Pairs well with"). */
export async function getPairedProduct(
  excludeId: string,
): Promise<CatalogueProduct | null> {
  const row = await getDb().product.findFirst({
    where: { active: true, id: { not: excludeId } },
    orderBy: [{ sortOrder: "asc" }],
  });
  return row ? parse(row) : null;
}
