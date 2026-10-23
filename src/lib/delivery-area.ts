export type DeliveryAreaConfig = {
  restrictToPostalCodes: boolean;
  postalCodeRanges: readonly (readonly [number, number])[];
};

/**
 * Whether we deliver to a 4-digit South African postal code.
 * With restriction off, everywhere is served. With it on, only codes inside one of the
 * configured inclusive ranges are (an empty list serves nobody, so switch the restriction on
 * only once the list exists).
 */
export function isServiceablePostalCode(
  postalCode: string,
  cfg: DeliveryAreaConfig,
): boolean {
  if (!cfg.restrictToPostalCodes) return true;
  if (!/^\d{4}$/.test(postalCode)) return false;
  const n = Number(postalCode);
  return cfg.postalCodeRanges.some(([from, to]) => n >= from && n <= to);
}
