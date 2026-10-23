import Image from "next/image";
import Link from "next/link";
import { images } from "@content/images";
import { home } from "@content/home";

/**
 * Banner (the logo on satin) shown whole, at its own proportions, with the headline in a card beneath it. It is
 * not cropped or overlapped, because the wordmark sits along its lower edge.
 */
export function Hero() {
  const img = images.hero;
  return (
    <section aria-labelledby="hero-heading">
      <div className="mx-auto max-w-site px-4 pt-4">
        <Image
          src={img.src}
          alt={img.alt}
          width={img.width}
          height={img.height}
          priority
          sizes="(min-width: 1200px) 1152px, 100vw"
          className="h-auto w-full rounded-card"
        />
      </div>
      <div className="mx-auto max-w-site px-4">
        <div className="relative z-10 mt-6 max-w-xl rounded-card bg-surface p-6 shadow-lg md:p-8">
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
