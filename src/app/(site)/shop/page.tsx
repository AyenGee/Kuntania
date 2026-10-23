import type { Metadata } from "next";
import Image from "next/image";
import { images } from "@content/images";
import { shopPage } from "@content/home";
import { ProductShowcase } from "@/components/home/ProductShowcase";
import { WhyShop } from "@/components/home/WhyShop";
import { getActiveProducts } from "@/lib/catalogue";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Shop Kunta Nia natural hair care: Hair Growth Oil and Pre-wash Conditioning Mask.",
  alternates: { canonical: "/shop" },
};

/** Shop: a brand band, the two products as large cards, and the "why shop" strip. No filters. */
export default async function ShopPage() {
  const products = await getActiveProducts();
  const emblem = images.logoEmblem;

  return (
    <>
      <section className="bg-brand text-brand-contrast">
        <div className="mx-auto flex max-w-site items-center gap-6 px-4 py-10 md:py-14">
          <Image
            src={emblem.src}
            alt=""
            width={emblem.width}
            height={emblem.height}
            className="hidden h-24 w-auto sm:block"
          />
          <div>
            <h1 className="text-4xl text-gold md:text-5xl">{shopPage.heading}</h1>
            <p className="mt-2 max-w-xl text-lg text-brand-contrast/90">
              {shopPage.intro}
            </p>
          </div>
        </div>
      </section>
      <ProductShowcase products={products} showViewAll={false} />
      <WhyShop />
    </>
  );
}
