/**
 * Site imagery. Files live in public/images/site and public/images/products and are produced
 * from the client's photos by scripts/prepare-images.py.
 *
 * PROVENANCE (matters for what may be shown where):
 *  - "real"  = a genuine photo of the real products. Use these wherever a customer judges
 *              what they will receive: product cards, product pages, the banner.
 *  - "mood"  = an image that appears to be AI-generated (it carried a Gemini sparkle mark,
 *              now cropped off) and whose label text is inaccurate. Atmosphere ONLY: never as
 *              the product shot, and never with claims text over it.
 * TODO(CLIENT): confirm the mood images are the client's to use (and AI-tool terms allow it).
 */

export type SiteImage = {
  src: string;
  width: number;
  height: number;
  alt: string;
  kind: "real" | "mood";
};

export const images = {
  /** Wide banner: the gold line-art logo on burgundy satin (supplied by the client). */
  hero: {
    src: "/images/site/hero-banner.webp",
    width: 1380,
    height: 752,
    alt: "Kunta Nia logo: gold line-art profiles with curly hair on burgundy satin",
    kind: "real",
  },
  /** The range again, closer, for the brand story band. */
  rangeFeature: {
    src: "/images/site/range-feature.webp",
    width: 1600,
    height: 1069,
    alt: "Kunta Nia Pre-wash Conditioning Mask jars and Hair Growth Oil bottles together",
    kind: "real",
  },
  /** Oil bottles on burgundy satin (atmosphere only). */
  moodSatin: {
    src: "/images/site/mood-satin.webp",
    width: 896,
    height: 1090,
    alt: "Three bottles of oil resting on burgundy satin",
    kind: "mood",
  },
  /** Oil being applied to the scalp (atmosphere only; no claims beside it). */
  moodScalp: {
    src: "/images/site/mood-scalp.webp",
    width: 896,
    height: 1090,
    alt: "Oil being applied with a dropper bottle along a parting in natural hair",
    kind: "mood",
  },
  /** Gold line-art emblem (three profiles with curls), transparent, for dark backgrounds. */
  logoEmblem: {
    src: "/images/site/logo-emblem.png",
    width: 730,
    height: 520,
    alt: "",
    kind: "real",
  },
} satisfies Record<string, SiteImage>;
