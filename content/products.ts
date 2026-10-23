/**
 * Seed data for the launch products. The database is the source of truth once
 * seeded (the owner edits products in /admin); re-running the seed never overwrites edits.
 *
 * Confirmed by the client (October 2026): product names, sizes (oil 100 ml, mask 250 ml),
 * prices (oil R110, mask R150, combo R230), starting stock (20 / 20 / 5), shelf life
 * (oil 1 year, mask 9 months), allergen notice, storage, directions, and the softened
 * claim wording. Removed at her request: the "cruelty-free" claim (not certified).
 *
 * Still open: the complete INCI ingredient lists (TODO(CLIENT)), and the combo's name and
 * photo. See docs/CLIENT_TODO.md.
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

const STORAGE = "Store in a cool, dry place away from direct sunlight.";
const MASK_ALLERGEN =
  "Allergen notice: contains hydrolysed wheat protein (gluten) and coconut. Do not use if you are allergic to wheat, gluten or coconut.";
const MASK_WATER = "Avoid getting water directly into the jar, to preserve freshness.";

const OIL_SCALP_STEP =
  "Apply a few drops directly to the scalp using the dropper. Gently massage with your fingertips for 3 to 5 minutes.";
const MASK_STEPS: TitledText[] = [
  { title: "Rinse", body: "Rinse hair." },
  { title: "Apply", body: "Apply the mask and distribute evenly from root to tips." },
  { title: "Leave in", body: "Leave in for 20 minutes, then rinse out thoroughly." },
  {
    title: "Complete your wash day",
    body: "Shampoo thoroughly and rinse well, then condition and finish your wash day as usual.",
  },
  { title: "How often", body: "Use every 2 to 3 weeks." },
];

export const seedProducts: SeedProduct[] = [
  {
    slug: "hair-growth-oil",
    // Name confirmed by the client. She holds that the ingredients stimulate hair growth;
    // the on-page wording stays at the approved softer claims (the name is her decision).
    name: "Hair Growth Oil",
    shortName: "Hair Growth Oil",
    tagline: "Rosemary & Vitamin E scalp oil.",
    description:
      "A botanical-rich oil with rosemary, castor oil and vitamin E. Rosemary and castor oil help nourish the scalp for a healthy-feeling foundation for your hair. Apply a few drops directly to the scalp with the dropper.",
    benefits: [
      {
        title: "Scalp care",
        body: "Rosemary and castor oil help nourish the scalp for a healthy-feeling foundation for your hair.",
      },
      { title: "Seal in moisture", body: "Apply on hair as a sealant." },
      {
        title: "Botanical-rich formula",
        body: "No sulfates, parabens, phthalates or silicones.", // TODO(CLIENT): recheck against the full ingredient list
      },
    ],
    howToUse: [
      { title: "Scalp care", body: OIL_SCALP_STEP },
      { title: "Seal in moisture", body: "Apply on hair as a sealant." },
    ],
    ingredientsInci:
      "TODO(CLIENT): full INCI ingredient list (known: rosemary, vitamin E, castor oil)",
    warnings: [...COMMON_WARNINGS, STORAGE, "Shelf life: 1 year."].join("\n"),
    sizeLabel: "100 ml",
    priceCents: 11000,
    compareAtPriceCents: null, // the old price (R100) was lower, so there is no "was" price to show
    stock: 20,
    active: true,
    sortOrder: 1,
    images: [
      {
        src: "/images/products/oil-1.webp",
        alt: "Three bottles of Kunta Nia Hair Growth Oil, Rosemary & Vitamin E, on cream cloth with dried flowers",
      },
      {
        src: "/images/products/oil-2.webp",
        alt: "Close view of three Kunta Nia Hair Growth Oil bottles showing the maroon label and golden oil",
      },
    ],
    seoTitle: "Hair Growth Oil",
    seoDescription:
      "A botanical-rich scalp oil with rosemary, castor oil and vitamin E, applied with a dropper and massaged into the scalp.",
  },
  {
    slug: "pre-wash-conditioning-mask",
    name: "Pre-wash Conditioning Mask",
    shortName: "Conditioning Mask",
    tagline: "Hibiscus & Fenugreek pre-wash mask.",
    description:
      "A botanical-rich pre-wash conditioning mask with hibiscus and fenugreek that deeply conditions and softens, and helps strengthen strands against breakage. Contains hydrolysed wheat protein and coconut.",
    benefits: [
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
        body: "No sulfates, parabens, phthalates or silicones.", // TODO(CLIENT): recheck against the full ingredient list
      },
    ],
    howToUse: MASK_STEPS,
    ingredientsInci:
      "TODO(CLIENT): full INCI ingredient list (known: hibiscus, fenugreek, hydrolysed wheat protein, coconut)",
    warnings: [
      ...COMMON_WARNINGS,
      MASK_ALLERGEN,
      STORAGE,
      MASK_WATER,
      "Shelf life: 9 months.",
    ].join("\n"),
    sizeLabel: "250 ml", // client correction: the jar is 250 ml (the photographed label says 100ml)
    priceCents: 15000,
    compareAtPriceCents: null, // the old price (R120) was lower, so there is no "was" price to show
    stock: 20,
    active: true,
    sortOrder: 2,
    images: [
      {
        src: "/images/products/mask-1.webp",
        alt: "Kunta Nia Pre-wash Conditioning Mask, Hibiscus & Fenugreek: two closed jars and one open jar showing the pink mask",
      },
      {
        src: "/images/products/mask-2.webp",
        alt: "Two jars of Kunta Nia Pre-wash Conditioning Mask and an open jar showing its deep pink texture",
      },
    ],
    seoTitle: "Pre-wash Conditioning Mask",
    seoDescription:
      "A botanical-rich pre-wash conditioning mask with hibiscus and fenugreek that softens and helps strengthen strands against breakage.",
  },
  {
    slug: "kunta-nia-combo",
    name: "Kunta Nia Combo", // TODO(CLIENT): confirm the name
    shortName: "Combo",
    tagline: "Hair Growth Oil and Pre-wash Conditioning Mask together.",
    description:
      "Both Kunta Nia products in one combo: the Hair Growth Oil (100 ml) and the Pre-wash Conditioning Mask (250 ml). Use the mask before you wash and the oil on your scalp. The mask contains hydrolysed wheat protein and coconut.",
    benefits: [
      {
        title: "Both products together",
        body: "Hair Growth Oil (100 ml) and Pre-wash Conditioning Mask (250 ml).",
      },
      {
        title: "Save R30",
        body: "R230 for the combo, against R260 if bought separately.",
      },
    ],
    howToUse: [
      ...MASK_STEPS.map((s) => ({ title: `Mask: ${s.title}`, body: s.body })),
      { title: "Oil: Scalp care", body: OIL_SCALP_STEP },
      { title: "Oil: Seal in moisture", body: "Apply on hair as a sealant." },
    ],
    ingredientsInci:
      "TODO(CLIENT): full INCI ingredient lists for both products (see the Hair Growth Oil and Pre-wash Conditioning Mask pages)",
    warnings: [
      ...COMMON_WARNINGS,
      MASK_ALLERGEN,
      STORAGE,
      MASK_WATER,
      "Shelf life: Hair Growth Oil 1 year; Pre-wash Conditioning Mask 9 months.",
    ].join("\n"),
    sizeLabel: "Oil 100 ml + mask 250 ml",
    priceCents: 23000,
    compareAtPriceCents: 26000, // R110 + R150 bought separately
    stock: 5,
    active: true,
    sortOrder: 3,
    images: [
      {
        // TODO(CLIENT): a photo of the combo box itself. This is the range photo for now.
        src: "/images/products/combo-1.webp",
        alt: "Kunta Nia Hair Growth Oil bottles and Pre-wash Conditioning Mask jars together",
      },
    ],
    seoTitle: "Kunta Nia Combo: Hair Growth Oil and Conditioning Mask",
    seoDescription:
      "The Kunta Nia Hair Growth Oil and Pre-wash Conditioning Mask together in one combo at a combined price.",
  },
];
