import { site } from "@content/site";
import type { CatalogueProduct } from "@/lib/catalogue";
import { centsToDecimalString } from "@/lib/money";

/** schema.org Product with an Offer (price, ZAR, availability). */
export function productJsonLd(product: CatalogueProduct, siteUrl: string) {
  const url = `${siteUrl}/products/${product.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    sku: product.slug,
    image: product.images.map((i) => new URL(i.src, siteUrl).toString()),
    brand: { "@type": "Brand", name: site.name },
    offers: {
      "@type": "Offer",
      url,
      price: centsToDecimalString(product.priceCents),
      priceCurrency: site.currency,
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };
}
