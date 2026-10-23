/** All money in this codebase is an integer number of cents (ZAR). Never use floats. */

const zarFormatter = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  currencyDisplay: "narrowSymbol",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function assertCents(value: number): void {
  if (!Number.isInteger(value))
    throw new Error(`Money must be integer cents, got ${value}`);
}

/** Format cents as e.g. "R 1 234,50" (en-ZA locale). */
export function formatZar(cents: number): string {
  assertCents(cents);
  return zarFormatter.format(cents / 100).replace(/ /g, " ");
}

/** Decimal string with two places, e.g. 12345 -> "123.45". */
export function centsToDecimalString(cents: number): string {
  assertCents(cents);
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

/** VAT portion of a VAT-inclusive amount at the given percentage (default 15%). */
export function vatIncludedCents(inclusiveCents: number, ratePercent = 15): number {
  assertCents(inclusiveCents);
  return Math.round((inclusiveCents * ratePercent) / (100 + ratePercent));
}
