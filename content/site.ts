/**
 * Site-wide configuration and copy. Edit here, not in components.
 * Every TODO(CLIENT) is tracked in docs/CLIENT_TODO.md.
 * Money values are integer cents (ZAR).
 */

export const site = {
  name: "Kunta Nia",
  /** From the client brochure: "Growth with purpose". */
  tagline: "Growth with purpose",
  /** TODO(CLIENT): confirm description (used for SEO default) */
  description:
    "Kunta Nia is a South African natural hair care brand. Shop nourishing oils and conditioning treatments for your hair journey.",
  locale: "en-ZA",
  currency: "ZAR",
} as const;

/** Thin bar above the header (the reference site has one for shipping). Set to null to hide it. */
export const announcement: string | null =
  "Nationwide delivery: R87 to major cities and metros, R120 to rural and remote areas";

/** Legal disclosures shown in the footer (ECT Act s43). Supplied by the client, October 2026. */
export const business = {
  registeredName: "Kunta Nia",
  legalForm: "Sole proprietor",
  /** TODO(CLIENT): confirm there is no registration number (null hides it from the footer). */
  registrationNumber: null as string | null,
  /** TODO(CLIENT): VAT number, or null if not VAT registered (client has not answered yet). */
  vatNumber: null as string | null,
  physicalAddress: "46 Nielson Drive, Blairgowrie, 2194, Johannesburg",
  email: "kuntania.contact@gmail.com",
  phone: "062 176 2631",
  informationOfficer: {
    name: "Beene Milambo",
    /** TODO(CLIENT): the client gave no separate email; the business email is used. */
    email: "kuntania.contact@gmail.com",
  },
} as const;

/** @kunta.nia on both Instagram and TikTok (confirmed by the client). Empty string hides a link. */
export const social = {
  instagram: "https://www.instagram.com/kunta.nia",
  facebook: "",
  tiktok: "https://www.tiktok.com/@kunta.nia",
} as const;

export const nav = {
  main: [
    { label: "Shop", href: "/shop" },
    { label: "FAQ", href: "/faq" },
    { label: "Contact", href: "/contact" },
  ],
  footerPolicies: [
    { label: "Shipping & Returns", href: "/shipping-returns" },
    { label: "Terms & Conditions", href: "/terms" },
    { label: "Privacy Policy", href: "/privacy" },
  ],
} as const;

/**
 * Shipping (client, updated November 2026): R87 standard to major cities and metropolitan
 * areas, R120 to rural and remote areas, door-to-door courier delivery only (The Courier Guy
 * via BobGo; Fastway or RAM when cheaper). No pick-up points and no collection. Couriers are
 * booked through BobGo (integration still to be built). Free over R450 is unchanged.
 */
export const shipping = {
  /** Standard courier fee to major cities and metropolitan areas: R87.00 */
  courierFlatRateCents: 8700,
  /** Courier fee to rural and remote areas: R120.00 */
  remoteRateCents: 12000 as number | null,
  /**
   * Postal codes that count as "major city / metropolitan area" (inclusive 4-digit ranges).
   * Any other valid postal code is charged the rural / remote rate.
   * TODO(CLIENT): confirm this list (or replace it with BobGo's zones). It is a starting point
   * from the main metro postal code ranges, not the courier's own list.
   */
  metroPostalCodeRanges: [
    // Pretoria / Tshwane, Centurion
    [1, 199],
    // Johannesburg north, Sandton, Randburg, Rosebank
    [2000, 2199],
    // East Rand: Germiston, Boksburg, Alberton, Benoni, Springs, Kempton Park, Edenvale,
    // Midrand, Roodepoort, Soweto, Lenasia
    [1400, 1899],
    // Cape Town and surrounds (CBD, southern suburbs, Bellville, Durbanville, Mitchells Plain)
    [7405, 7550],
    [7700, 8099],
    // Durban, Pinetown, Westville, Umhlanga, Amanzimtoti
    [3600, 3629],
    [4000, 4199],
    [4300, 4399],
    // Pietermaritzburg
    [3200, 3299],
    // Gqeberha (Port Elizabeth)
    [6000, 6099],
    // East London
    [5200, 5299],
    // Bloemfontein
    [9300, 9399],
    // Mbombela (Nelspruit)
    [1200, 1219],
    // Kimberley
    [8300, 8349],
  ] as readonly (readonly [number, number])[],
  /** Orders at or above R450.00 (after any discount) ship free. */
  freeShippingThresholdCents: 45000 as number | null,
  pickupPoint: null as { label: string; flatRateCents: number } | null,
  localCollection: null as { label: string; instructions: string } | null,
} as const;

/**
 * Delivery area. The client delivers nationwide but only to major cities and metropolitan
 * areas, not deep rural or outlying postal codes. Set `restrictToPostalCodes: true` and fill
 * `postalCodeRanges` (inclusive [from, to] pairs of 4-digit codes) to enforce it at checkout.
 *
 * TODO(CLIENT): supply the list of serviceable areas (or agree to use BobGo's coverage).
 * It is OFF until then, because an empty allow-list would block every order.
 */
export const deliveryArea = {
  restrictToPostalCodes: false,
  postalCodeRanges: [] as [number, number][],
  message: "Sorry, we don't deliver to this area yet.",
} as const;

/** How long things take (shown in the FAQ, policy and emails). */
export const fulfilment = {
  packingTime: "1 business day",
  deliveryTime: "2 to 4 business days",
} as const;

/** Store behaviour. */
export const store = {
  /** Show "Only X left" when stock is at or below this number. */
  lowStockThreshold: 5,
  /** Maximum units of one product per order. */
  maxQuantityPerOrder: 10,
  /** Hours before an unpaid order is automatically cancelled. */
  pendingOrderExpiryHours: 48,
} as const;
