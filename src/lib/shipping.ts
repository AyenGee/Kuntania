import { shipping as defaultShipping } from "@content/site";

export type ShippingMethod = "COURIER" | "PICKUP_POINT" | "COLLECTION";

export type ShippingConfig = {
  courierFlatRateCents: number;
  freeShippingThresholdCents: number | null;
  pickupPoint: { label: string; flatRateCents: number } | null;
  localCollection: { label: string; instructions: string } | null;
};

export type ShippingOption = { method: ShippingMethod; label: string };

/** Options the shop currently offers (courier always; the others only if configured). */
export function availableShippingOptions(
  cfg: ShippingConfig = defaultShipping,
): ShippingOption[] {
  const options: ShippingOption[] = [{ method: "COURIER", label: "Courier delivery" }];
  if (cfg.pickupPoint)
    options.push({ method: "PICKUP_POINT", label: cfg.pickupPoint.label });
  if (cfg.localCollection)
    options.push({ method: "COLLECTION", label: cfg.localCollection.label });
  return options;
}

export function qualifiesForFreeShipping(
  subtotalAfterDiscountCents: number,
  cfg: ShippingConfig = defaultShipping,
): boolean {
  return (
    cfg.freeShippingThresholdCents !== null &&
    subtotalAfterDiscountCents >= cfg.freeShippingThresholdCents
  );
}

/**
 * Shipping cost in cents for a method, or null if that method is not offered.
 * The free-shipping threshold is compared against the subtotal AFTER any discount.
 * Local collection is always free.
 */
export function shippingCostCents(
  method: ShippingMethod,
  subtotalAfterDiscountCents: number,
  cfg: ShippingConfig = defaultShipping,
): number | null {
  if (method === "COLLECTION") return cfg.localCollection ? 0 : null;
  if (method === "PICKUP_POINT" && !cfg.pickupPoint) return null;
  if (qualifiesForFreeShipping(subtotalAfterDiscountCents, cfg)) return 0;
  return method === "PICKUP_POINT"
    ? (cfg.pickupPoint?.flatRateCents ?? null)
    : cfg.courierFlatRateCents;
}

/** Cents still to spend for free shipping, or null if there is no threshold / already met. */
export function freeShippingRemainingCents(
  subtotalAfterDiscountCents: number,
  cfg: ShippingConfig = defaultShipping,
): number | null {
  if (cfg.freeShippingThresholdCents === null) return null;
  const remaining = cfg.freeShippingThresholdCents - subtotalAfterDiscountCents;
  return remaining > 0 ? remaining : null;
}
