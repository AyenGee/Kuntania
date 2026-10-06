"use client";

import Image from "next/image";
import { useState } from "react";

export function ProductGallery({ images }: { images: { src: string; alt: string }[] }) {
  const [active, setActive] = useState(0);
  const current = images[active] ?? images[0];
  if (!current) return null;

  return (
    <div>
      <Image
        src={current.src}
        alt={current.alt}
        width={800}
        height={800}
        priority
        sizes="(min-width: 768px) 50vw, 100vw"
        className="aspect-square w-full rounded-card bg-surface-muted object-cover"
      />
      {images.length > 1 && (
        <ul className="mt-3 flex gap-3" aria-label="Product images">
          {images.map((img, i) => (
            <li key={img.src}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Show image ${i + 1} of ${images.length}`}
                aria-pressed={i === active}
                className="overflow-hidden rounded-control border-2 border-line aria-pressed:border-brand"
              >
                <Image
                  src={img.src}
                  alt=""
                  width={80}
                  height={80}
                  className="h-16 w-16 object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
