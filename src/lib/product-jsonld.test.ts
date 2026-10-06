import { describe, expect, it } from "vitest";
import type { CatalogueProduct } from "./catalogue";
import { productJsonLd } from "./product-jsonld";

const base = {
  slug: "oil",
  name: "Oil",
  description: "d",
  priceCents: 12345,
  stock: 3,
  images: [{ src: "/images/products/oil-1.svg", alt: "x" }],
} as unknown as CatalogueProduct;

describe("productJsonLd", () => {
  it("emits price in ZAR with absolute image URLs", () => {
    const ld = productJsonLd(base, "https://example.co.za");
    expect(ld.offers.price).toBe("123.45");
    expect(ld.offers.priceCurrency).toBe("ZAR");
    expect(ld.image[0]).toBe("https://example.co.za/images/products/oil-1.svg");
    expect(ld.offers.availability).toBe("https://schema.org/InStock");
  });

  it("marks sold-out products out of stock", () => {
    const ld = productJsonLd({ ...base, stock: 0 }, "https://example.co.za");
    expect(ld.offers.availability).toBe("https://schema.org/OutOfStock");
  });
});
