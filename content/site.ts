/**
 * Site-wide configuration and copy. Edit here, not in components.
 * Every TODO(CLIENT) is tracked in docs/CLIENT_TODO.md.
 * Money values are integer cents (ZAR).
 */

export const site = {
  name: "Kunta Nia",
  /** TODO(CLIENT): confirm tagline */
  tagline: "Natural hair care, made with intention.",
  /** TODO(CLIENT): confirm description (used for SEO default) */
  description:
    "Kunta Nia is a South African natural hair care brand. Shop nourishing oils and conditioning treatments for your hair journey.",
  locale: "en-ZA",
  currency: "ZAR",
} as const;

/** Legal disclosures shown in the footer (ECT Act s43). All TODO(CLIENT). */
export const business = {
  /** TODO(CLIENT): registered business name */
  registeredName: "TODO(CLIENT): registered business name",
  /** TODO(CLIENT): legal form, e.g. (Pty) Ltd, sole proprietor, CC */
  legalForm: "TODO(CLIENT): legal form",
  /** TODO(CLIENT): company / CIPC registration number */
  registrationNumber: "TODO(CLIENT): registration number",
  /** TODO(CLIENT): VAT number, or null if not VAT registered */
  vatNumber: null as string | null,
  /** TODO(CLIENT): physical (street) address */
  physicalAddress: "TODO(CLIENT): physical address",
  /** TODO(CLIENT): customer-facing email */
  email: "TODO(CLIENT): hello@example.co.za",
  /** TODO(CLIENT): phone number */
  phone: "TODO(CLIENT): phone number",
  /** TODO(CLIENT): Information Officer (POPIA) */
  informationOfficer: {
    name: "TODO(CLIENT): Information Officer name",
    email: "TODO(CLIENT): Information Officer email",
  },
} as const;

/** TODO(CLIENT): social profile URLs. Leave empty string to hide the link. */
export const social = {
  instagram: "",
  facebook: "",
  tiktok: "",
} as const;

export const nav = {
  main: [
    { label: "Shop", href: "/shop" },
    { label: "Our Story", href: "/about" },
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

/** Shipping options. All amounts TODO(CLIENT). The owner books couriers manually in v1. */
export const shipping = {
  /** TODO(CLIENT): flat-rate courier fee (cents) */
  courierFlatRateCents: 0,
  /** TODO(CLIENT): subtotal (cents) at or above which shipping is free. null = never free. */
  freeShippingThresholdCents: null as number | null,
  /** TODO(CLIENT): optional pick-up point option (PUDO / Pargo). null to disable. */
  pickupPoint: null as { label: string; flatRateCents: number } | null,
  /** TODO(CLIENT): optional local collection. null to disable. */
  localCollection: null as { label: string; instructions: string } | null,
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
