import type { Metadata } from "next";
import { Highlights } from "@/components/home/Highlights";
import { Hero } from "@/components/home/Hero";
import { HowToUse } from "@/components/home/HowToUse";
import { NewsletterSection } from "@/components/home/NewsletterSection";
import { ProductShowcase } from "@/components/home/ProductShowcase";
import { StoryBand } from "@/components/home/StoryBand";
import { WhyShop } from "@/components/home/WhyShop";
import { getActiveProducts, type CatalogueProduct } from "@/lib/catalogue";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

/** Products for the showcase; if the database is unreachable the page still renders. */
async function loadProducts(): Promise<CatalogueProduct[]> {
  try {
    return await getActiveProducts();
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "home.featured_failed",
        error: error instanceof Error ? error.message : String(error),
      }),
    );
    return [];
  }
}

export default async function HomePage() {
  const products = await loadProducts();

  return (
    <>
      <Hero />
      <ProductShowcase products={products} />
      <StoryBand />
      <Highlights />
      <HowToUse />
      <WhyShop />
      <NewsletterSection />
    </>
  );
}
