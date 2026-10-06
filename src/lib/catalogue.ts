import { cache } from "react";
import { z } from "zod";
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

export { maxOrderQuantity, stockStatus, type StockStatus };
