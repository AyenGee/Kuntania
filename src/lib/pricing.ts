import { vatIncludedCents } from "@/lib/money";

export type Totals = {
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
  /** VAT already inside totalCents (prices are VAT-inclusive); 0 if not VAT registered. */
  vatIncludedCents: number;
};

/** total = subtotal - discount + shipping. Everything is integer cents. */
export function computeTotals(input: {
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  vatRegistered: boolean;
}): Totals {
  const { subtotalCents, discountCents, shippingCents, vatRegistered } = input;
  const totalCents = subtotalCents - discountCents + shippingCents;
  return {
    subtotalCents,
    discountCents,
    shippingCents,
    totalCents,
    vatIncludedCents: vatRegistered ? vatIncludedCents(totalCents) : 0,
  };
}
