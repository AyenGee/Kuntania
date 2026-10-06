import Link from "next/link";
import { home } from "@content/home";
import { ProductCard } from "@/components/catalogue/ProductCard";
import type { CatalogueProduct } from "@/lib/catalogue";

/**
 * The range as large side-by-side cards. With only two products there are no category
 * grids or carousels: the products themselves are the "categories".
 */
export function ProductShowcase({
  products,
  showViewAll = true,
}: {
  products: CatalogueProduct[];
  showViewAll?: boolean;
}) {
  return (
    <section aria-labelledby="products-heading" className="mx-auto max-w-site px-4 py-16">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="products-heading" className="text-3xl md:text-4xl">
          {home.products.heading}
        </h2>
        {showViewAll && (
          <Link
            href={home.products.link.href}
            className="text-sm font-semibold tracking-wide uppercase underline underline-offset-4"
          >
            {home.products.link.label}
          </Link>
        )}
      </div>

      {products.length === 0 ? (
        <p className="mt-6 text-ink-muted">
          Our products are on their way. Please check back soon.
        </p>
      ) : (
        <ul className="mt-8 grid gap-8 sm:grid-cols-2">
          {products.map((p) => (
            <li key={p.id}>
              <ProductCard product={p} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
