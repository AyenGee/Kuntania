import Image from "next/image";
import Link from "next/link";
import { images } from "@content/images";
import { home } from "@content/home";

/**
 * Two cards with directions. The mask card uses a real product photo; the oil card uses the
 * atmosphere image of oil on the scalp (mood only: no claims are placed beside it).
 */
const PHOTOS = {
  maskPhoto: {
    src: "/images/products/mask-2.webp",
    width: 1200,
    height: 1600,
    alt: "Two jars of Kunta Nia Pre-wash Conditioning Mask and an open jar showing the mask",
  },
  scalpMood: images.moodScalp,
} as const;

export function HowToUse() {
  return (
    <section aria-labelledby="how-heading" className="mx-auto max-w-site px-4 pb-16">
      <h2 id="how-heading" className="text-center text-3xl">
        {home.howToUse.heading}
      </h2>
      <ul className="mt-8 grid gap-6 md:grid-cols-2">
        {home.howToUse.cards.map((card) => {
          const photo = PHOTOS[card.image];
          return (
            <li
              key={card.title}
              className="overflow-hidden rounded-card border border-line bg-surface shadow-sm"
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                width={photo.width}
                height={photo.height}
                sizes="(min-width: 768px) 50vw, 100vw"
                className="aspect-[16/10] w-full object-cover"
              />
              <div className="p-6">
                <h3 className="font-heading text-2xl">{card.title}</h3>
                <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-ink-muted">
                  {card.steps.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ol>
                <Link
                  href={card.href}
                  className="mt-4 inline-block font-medium underline"
                >
                  See full directions
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
