import Image from "next/image";
import { images } from "@content/images";
import { home } from "@content/home";

/** Large feature tile: the range photo beside a short brand story (the reference's big tile). */
export function StoryBand() {
  const img = images.rangeFeature;
  return (
    <section aria-labelledby="story-heading" className="mx-auto max-w-site px-4 py-16">
      <div className="grid items-center gap-8 overflow-hidden rounded-card bg-surface shadow-md md:grid-cols-2">
        <Image
          src={img.src}
          alt={img.alt}
          width={img.width}
          height={img.height}
          sizes="(min-width: 768px) 50vw, 100vw"
          className="h-full max-h-[520px] w-full object-cover"
        />
        <div className="p-6 md:p-10">
          <h2 id="story-heading" className="text-3xl md:text-4xl">
            {home.story.heading}
          </h2>
          {home.story.body.map((p) => (
            <p key={p} className="mt-4 text-lg text-ink-muted">
              {p}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
