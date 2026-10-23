import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { ProductForm } from "@/components/admin/ProductForm";
import { ButtonLink, Card, PageHeader } from "@/components/admin/ui";
import { centsToRandsInput } from "@/lib/admin/rands";
import { requireAdmin } from "@/lib/admin/session";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Edit product" };

const titled = z.array(z.object({ title: z.string(), body: z.string() })).catch([]);
const images = z.array(z.object({ src: z.string(), alt: z.string() })).catch([]);

export default async function AdminProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const p = await getDb().product.findUnique({ where: { id } });
  if (!p) notFound();

  const hasPlaceholder = [
    p.name,
    p.tagline,
    p.description,
    p.ingredientsInci,
    p.warnings,
    p.sizeLabel,
    p.seoTitle,
    p.seoDescription,
    JSON.stringify(p.benefits),
    JSON.stringify(p.howToUse),
  ].some((t) => t.includes("TODO(CLIENT)"));

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader title={p.name}>
        <ButtonLink href="/admin/products" secondary>
          All products
        </ButtonLink>
        <ButtonLink href={`/products/${p.slug}`} secondary>
          View on website
        </ButtonLink>
      </PageHeader>

      {hasPlaceholder && (
        <p role="note" className="rounded-control border-2 border-accent p-3">
          This product still contains placeholder text (&ldquo;TODO(CLIENT)&rdquo;).
          Replace it before launch: customers can see it.
        </p>
      )}

      <Card>
        <ProductForm
          product={{
            id: p.id,
            name: p.name,
            shortName: p.shortName,
            tagline: p.tagline,
            description: p.description,
            benefits: titled.parse(p.benefits),
            howToUse: titled.parse(p.howToUse),
            images: images.parse(p.images),
            ingredientsInci: p.ingredientsInci,
            warnings: p.warnings,
            sizeLabel: p.sizeLabel,
            price: centsToRandsInput(p.priceCents),
            compareAtPrice: p.compareAtPriceCents
              ? centsToRandsInput(p.compareAtPriceCents)
              : "",
            stock: String(p.stock),
            sortOrder: String(p.sortOrder),
            active: p.active,
            seoTitle: p.seoTitle,
            seoDescription: p.seoDescription,
          }}
        />
      </Card>
    </div>
  );
}
