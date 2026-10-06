/**
 * Seed data for the two launch products. The database is the source of truth once
 * seeded (the owner edits products in /admin); re-running the seed never overwrites edits.
 *
 * Names, sizes, key ingredients and the mask/oil scalp directions come from the client's
 * brochure. Everything is still flagged for client confirmation (docs/CLIENT_TODO.md).
 * Claim wording follows the cosmetic-claims rules in the build brief: TODO(CLIENT): approve
 * claim wording. Prices, stock and full INCI lists are placeholders: TODO(CLIENT).
 */

export type TitledText = { title: string; body: string };
export type ProductImage = { src: string; alt: string };

export type SeedProduct = {
  slug: string;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  benefits: TitledText[];
  howToUse: TitledText[];
  ingredientsInci: string;
  warnings: string;
  sizeLabel: string;
  priceCents: number;
  compareAtPriceCents: number | null;
  stock: number;
  active: boolean;
  sortOrder: number;
  images: ProductImage[];
  seoTitle: string;
  seoDescription: string;
};

const COMMON_WARNINGS = [
  "For external use only.",
  "Patch test 48 hours before first use: apply a small amount to the inside of your elbow and wait. Do not use if you react.",
  "Discontinue use if irritation occurs and consult your doctor.",
  "Avoid contact with eyes. If contact occurs, rinse thoroughly with water.",
  "Keep out of reach of children.",
];

// Care and storage (from the client's brochure). TODO(CLIENT): confirm
const STORAGE = "Store in a cool, dry place away from direct sunlight.";

export const seedProducts: SeedProduct[] = [
  {
    slug: "hair-growth-oil", // TODO(CLIENT): confirm name; "Hair Growth" wording needs claims approval
    name: "Hair Growth Oil", // label reads "Hair Growth Oil, Rosemary & Vitamin E, 100ml"
    shortName: "Hair Growth Oil",
    tagline: "Rosemary & Vitamin E scalp oil.",
    description:
      // TODO(CLIENT): approve claim wording
      "A botanical-rich oil with rosemary and vitamin E. Rosemary and castor oil help nourish the scalp for a healthy-feeling foundation for your hair. Apply a few drops directly to the scalp with the dropper.", // TODO(CLIENT): confirm castor oil is in the formula
    benefits: [
      // TODO(CLIENT): approve claim wording
      {
        title: "Scalp care",
        body: "Rosemary and castor oil help nourish the scalp for a healthy-feeling foundation for your hair.",
      },
      {
        title: "Pre-poo", // TODO(CLIENT): confirm this use (not on the brochure)
        body: "Apply before washing to help protect strands and soften hair ahead of cleansing.",
      },
      {
        title: "Hot oil treatment", // TODO(CLIENT): confirm this use (not on the brochure)
        body: "Warm and apply for a deeply conditioning, softening treatment.",
      },
      {
        title: "Sealing and protective styles", // TODO(CLIENT): confirm this use (not on the brochure)
        body: "Seal in moisture and add shine to your LOC/LCO routine or under protective styles.",
      },
      {
        title: "Botanical-rich formula",
        body: "No sulfates, parabens, phthalates or silicones.", // TODO(CLIENT): verify against real ingredient list
      },
    ],
    howToUse: [
      // TODO(CLIENT): confirm all steps. Scalp care is from the brochure; the rest are drafts.
      {
        title: "Scalp care",
        body: "Apply a few drops directly to the scalp using the dropper. Gently massage with your fingertips for 3 to 5 minutes.",
      },
      {
        title: "Pre-poo",
        body: "Apply generously from root to tip on dry or slightly damp hair. Leave on for 20–30 minutes (or longer, as you prefer), then shampoo and condition as usual.",
      },
      {
        title: "Hot oil treatment",
        body: "Warm the sealed bottle in a bowl of warm (not hot) water. Test the temperature on your wrist, then apply to hair and scalp. Cover with a cap for 20–30 minutes, then wash out.",
      },
      {
        title: "Sealing (LOC/LCO) and protective styles",
        body: "After your leave-in and cream, smooth a small amount over the length of your hair to seal in moisture before styling. A little goes a long way.",
      },
    ],
    ingredientsInci:
      "TODO(CLIENT): full INCI ingredient list (known: rosemary, vitamin E)",
    warnings: [...COMMON_WARNINGS, STORAGE].join("\n"),
    sizeLabel: "100 ml", // from the label; TODO(CLIENT): confirm
    priceCents: 10000, // PLACEHOLDER R100.00 — TODO(CLIENT): real price
    compareAtPriceCents: null,
    stock: 20, // PLACEHOLDER — TODO(CLIENT): real stock
    active: true,
    sortOrder: 1,
    images: [
      {
        src: "/images/products/oil-1.webp",
        alt: "Three bottles of Kunta Nia Hair Growth Oil, Rosemary & Vitamin E, 100 ml, on cream cloth with dried flowers",
      },
      {
        src: "/images/products/oil-2.webp",
        alt: "Close view of three Kunta Nia Hair Growth Oil bottles showing the maroon label and golden oil",
      },
    ],
    seoTitle: "Hair Growth Oil", // TODO(CLIENT): review
    seoDescription:
      "A botanical-rich scalp oil with rosemary and vitamin E, applied with a dropper and massaged into the scalp.", // TODO(CLIENT): review
  },
  {
    slug: "pre-wash-conditioning-mask", // TODO(CLIENT): confirm name
    name: "Pre-wash Conditioning Mask", // label reads "Pre-wash Conditioning Mask, Hibiscus & Fenugreek, 100ml"
    shortName: "Conditioning Mask",
    tagline: "Hibiscus & Fenugreek pre-wash mask.",
    description:
      // TODO(CLIENT): approve claim wording
      "A botanical-rich pre-wash conditioning mask with hibiscus and fenugreek that deeply conditions and softens, and helps strengthen strands against breakage. Contains hydrolysed wheat protein and coconut.", // TODO(CLIENT): confirm allergens
    benefits: [
      // TODO(CLIENT): approve claim wording
      {
        title: "Deeply conditions and softens",
        body: "Leaves hair feeling soft, smooth and easier to manage.",
      },
      {
        title: "Helps strengthen strands",
        body: "Helps strengthen strands against breakage.",
      },
      {
        title: "Hibiscus and fenugreek",
        body: "A botanical-rich formula with hibiscus and fenugreek.",
      },
      {
        title: "Botanical-rich formula",
        body: "No sulfates, parabens, phthalates or silicones.", // TODO(CLIENT): verify against real ingredient list
      },
      { title: "Cruelty-free", body: "Not tested on animals." }, // TODO(CLIENT): confirm; no certification logo unless certified
    ],
    howToUse: [
      // From the brochure. TODO(CLIENT): confirm
      { title: "Rinse", body: "Rinse hair." },
      {
        title: "Apply",
        body: "Apply the mask and distribute evenly from root to tips.",
      },
      {
        title: "Leave in",
        body: "Leave in for 20 minutes, then rinse out thoroughly.",
      },
      {
        title: "Complete your wash day",
        body: "Shampoo thoroughly and rinse well, then condition and finish your wash day as usual.",
      },
      { title: "How often", body: "Use every 2 to 3 weeks." },
    ],
    ingredientsInci:
      "TODO(CLIENT): full INCI ingredient list (known: hibiscus, fenugreek, hydrolysed wheat protein, coconut)",
    warnings: [
      ...COMMON_WARNINGS,
      "Allergen notice: contains hydrolysed wheat protein (gluten) and coconut. Do not use if you are allergic to wheat, gluten or coconut.", // TODO(CLIENT): confirm allergen notice
      STORAGE,
      "Avoid getting water directly into the jar, to preserve freshness.",
    ].join("\n"),
    sizeLabel: "100 ml", // from the label; TODO(CLIENT): confirm
    priceCents: 15000, // PLACEHOLDER R150.00 — TODO(CLIENT): real price
    compareAtPriceCents: null,
    stock: 20, // PLACEHOLDER — TODO(CLIENT): real stock
    active: true,
    sortOrder: 2,
    images: [
      {
        src: "/images/products/mask-1.webp",
        alt: "Kunta Nia Pre-wash Conditioning Mask, Hibiscus & Fenugreek, 100 ml: two closed jars and one open jar showing the pink mask",
      },
      {
        src: "/images/products/mask-2.webp",
        alt: "Two jars of Kunta Nia Pre-wash Conditioning Mask and an open jar showing its deep pink texture",
      },
    ],
    seoTitle: "Pre-wash Conditioning Mask", // TODO(CLIENT): review
    seoDescription:
      "A botanical-rich pre-wash conditioning mask with hibiscus and fenugreek that softens and helps strengthen strands against breakage.", // TODO(CLIENT): review
  },
];
