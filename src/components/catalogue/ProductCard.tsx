import Image from "next/image";
import Link from "next/link";
import type { CatalogueProduct } from "@/lib/catalogue";
import { Price } from "./Price";
import { StockBadge } from "./StockBadge";

/**
 * Large product card (photo, name, price), in the style of the reference site's product tiles.
 * The whole card is one link, so it is a single, large tap target on a phone.
 */
export function ProductCard({ product }: { product: CatalogueProduct }) {
  const image = product.images[0];
  return (
    <article className="group overflow-hidden rounded-card border border-line bg-surface shadow-sm transition-shadow focus-within:shadow-md hover:shadow-md">
      <Link href={`/products/${product.slug}`} className="block">
        {image && (
          <div className="overflow-hidden bg-surface-muted">
            <Image
              src={image.src}
              alt={image.alt}
              width={1200}
              height={1500}
              sizes="(min-width: 1024px) 560px, (min-width: 640px) 50vw, 100vw"
              className="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          </div>
        )}
        <div className="space-y-1.5 p-5">
          <h3 className="font-heading text-2xl">{product.name}</h3>
          <p className="text-sm text-ink-muted">
            {product.tagline} · {product.sizeLabel}
          </p>
          <Price
            priceCents={product.priceCents}
            compareAtPriceCents={product.compareAtPriceCents}
          />
          <StockBadge stock={product.stock} />
          <span className="mt-3 inline-block rounded-control bg-brand px-5 py-2.5 text-sm font-medium text-brand-contrast">
            View product
          </span>
        </div>
      </Link>
    </article>
  );
}
