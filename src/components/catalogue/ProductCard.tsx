import Image from "next/image";
import Link from "next/link";
import type { CatalogueProduct } from "@/lib/catalogue";
import { Price } from "./Price";
import { StockBadge } from "./StockBadge";

export function ProductCard({ product }: { product: CatalogueProduct }) {
  const image = product.images[0];
  return (
    <article className="overflow-hidden rounded-card border border-line">
      <Link href={`/products/${product.slug}`} className="block">
        {image && (
          <Image
            src={image.src}
            alt={image.alt}
            width={800}
            height={800}
            sizes="(min-width: 640px) 50vw, 100vw"
            className="aspect-square w-full bg-surface-muted object-cover"
          />
        )}
        <div className="space-y-1 p-4">
          <h3 className="text-lg font-semibold">{product.name}</h3>
          <p className="text-sm text-ink-muted">{product.tagline}</p>
          <Price
            priceCents={product.priceCents}
            compareAtPriceCents={product.compareAtPriceCents}
          />
          <StockBadge stock={product.stock} />
        </div>
      </Link>
    </article>
  );
}
