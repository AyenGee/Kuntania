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
  "Nationwide delivery to major cities and metropolitan areas";

/** Legal disclosures shown in the footer (ECT Act s43). Supplied by the client, October 2026. */
export const business = {
  registeredName: "Kunta Nia",
  legalForm: "Sole proprietor",
  /** TODO(CLIENT): confirm there is no registration number (null hides it from the footer). */
  registrationNumber: null as string | null,
  /** TODO(CLIENT): VAT number, or null if not VAT registered (client has not answered yet). */
  vatNumber: null as string | null,
  physicalAddress: "46 Nielson Drive, Blairgowrie, 2194, Johannesburg",
  email: "contact@kuntania.com",
  phone: "062 176 2631",
  informationOfficer: {
    name: "Beene Milambo",
    /** TODO(CLIENT): the client gave no separate email; the business email is used. */
    email: "contact@kuntania.com",
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
    { label: "Track an order", href: "/order-status" },
  ],
} as const;

/**
 * Shipping (confirmed by the client, October 2026): flat R86, free over R450, door-to-door
 * courier delivery only (The Courier Guy via BobGo; Fastway or RAM when cheaper). No pick-up
 * points and no collection. Couriers are booked through BobGo (integration still to be built).
 */
export const shipping = {
  /** Flat courier fee: R86.00 */
  courierFlatRateCents: 8600,
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
  message:
    "Sorry, we don't deliver to this area yet. We deliver to major cities and metropolitan areas.",
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
