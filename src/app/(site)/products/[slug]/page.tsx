import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AddToCart } from "@/components/catalogue/AddToCart";
import { Price } from "@/components/catalogue/Price";
import { ProductCard } from "@/components/catalogue/ProductCard";
import { ProductGallery } from "@/components/catalogue/ProductGallery";
import { StockBadge } from "@/components/catalogue/StockBadge";
import { JsonLd } from "@/components/JsonLd";
import { getPairedProduct, getProductBySlug, maxOrderQuantity } from "@/lib/catalogue";
import { productJsonLd } from "@/lib/product-jsonld";
import { siteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  const image = product.images[0];
  return {
    title: product.seoTitle || product.name,
    description: product.seoDescription || product.tagline,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title: product.seoTitle || product.name,
      description: product.seoDescription || product.tagline,
      type: "website",
      images: image ? [{ url: image.src, alt: image.alt }] : undefined,
    },
    twitter: { card: "summary_large_image" },
  };
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details
      className="rounded-card border border-line p-4"
      open={title === "Description"}
    >
      <summary className="cursor-pointer font-medium">{title}</summary>
      <div className="mt-3 space-y-3">{children}</div>
    </details>
  );
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  const paired = await getPairedProduct(product.id);

  return (
    <div>
      <JsonLd data={productJsonLd(product, siteUrl())} />
      <div className="grid gap-8 md:grid-cols-2">
        <ProductGallery images={product.images} />

        <div className="space-y-4">
          <h1 className="text-3xl font-semibold">{product.name}</h1>
          <p className="text-ink-muted">{product.tagline}</p>
          <Price
            priceCents={product.priceCents}
            compareAtPriceCents={product.compareAtPriceCents}
          />
          <p className="text-sm text-ink-muted">Size: {product.sizeLabel}</p>
          <StockBadge stock={product.stock} />
          <AddToCart
            productId={product.id}
            productName={product.name}
            maxQuantity={maxOrderQuantity(product.stock)}
          />
        </div>
      </div>

      <div className="mt-10 max-w-3xl space-y-3">
        <Section title="Description">
          <p>{product.description}</p>
        </Section>
        <Section title="Key Benefits">
          <ul className="space-y-2">
            {product.benefits.map((b) => (
              <li key={b.title}>
                <strong>{b.title}.</strong> {b.body}
              </li>
            ))}
          </ul>
        </Section>
        <Section title="How to Use">
          <ol className="list-decimal space-y-2 pl-5">
            {product.howToUse.map((s) => (
              <li key={s.title}>
                <strong>{s.title}.</strong> {s.body}
              </li>
            ))}
          </ol>
        </Section>
        <Section title="Full Ingredients (INCI)">
          <p>{product.ingredientsInci}</p>
        </Section>
        <Section title="Warnings & Patch Test">
          <ul className="list-disc space-y-1 pl-5">
            {product.warnings
              .split("\n")
              .filter(Boolean)
              .map((w) => (
                <li key={w}>{w}</li>
              ))}
          </ul>
        </Section>
      </div>

      {paired && (
        <section aria-labelledby="pairs-heading" className="mt-12 max-w-sm">
          <h2 id="pairs-heading" className="text-2xl font-semibold">
            Pairs well with
          </h2>
          <div className="mt-4">
            <ProductCard product={paired} />
          </div>
        </section>
      )}
    </div>
  );
}
