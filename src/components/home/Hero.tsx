import Image from "next/image";
import Link from "next/link";
import { images } from "@content/images";
import { home } from "@content/home";

/**
 * Full-width banner of the real range, with the headline in a card that overlaps its lower
 * edge. The photo is busy (products fill the frame), so no text is set over it.
 */
export function Hero() {
  const img = images.hero;
  return (
    <section aria-labelledby="hero-heading">
      <Image
        src={img.src}
        alt={img.alt}
        width={img.width}
        height={img.height}
        priority
        sizes="100vw"
        className="h-[56vw] max-h-[620px] min-h-[240px] w-full object-cover"
      />
      <div className="mx-auto max-w-site px-4">
        <div className="relative z-10 -mt-10 max-w-xl rounded-card bg-surface p-6 shadow-lg md:-mt-20 md:p-8">
          <h1 id="hero-heading" className="text-4xl leading-tight md:text-5xl">
            {home.hero.heading}
          </h1>
          <p className="mt-3 text-lg text-ink-muted">{home.hero.body}</p>
          <Link
            href={home.hero.cta.href}
            className="mt-5 inline-block rounded-control bg-brand px-6 py-3 font-medium text-brand-contrast"
          >
            {home.hero.cta.label}
          </Link>
        </div>
      </div>
    </section>
  );
}
