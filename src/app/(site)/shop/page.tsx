import type { Metadata } from "next";
import { ProductCard } from "@/components/catalogue/ProductCard";
import { getActiveProducts } from "@/lib/catalogue";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Shop Kunta Nia natural hair care: Hair Growth Oil and Pre-wash Conditioning Mask.",
  alternates: { canonical: "/shop" },
};

export default async function ShopPage() {
  const products = await getActiveProducts();

  return (
    <div>
      <h1 className="text-3xl font-semibold">Shop</h1>
      {products.length === 0 ? (
        <p className="mt-4 text-ink-muted">
          New products are coming soon. Please check back.
        </p>
      ) : (
        <ul className="mt-6 grid gap-6 sm:grid-cols-2">
          {products.map((p) => (
            <li key={p.id}>
              <ProductCard product={p} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
