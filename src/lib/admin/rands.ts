/**
 * Money input for the admin: the owner types rands ("149", "149.90", "R 1 249,50"),
 * the database stores integer cents. Never goes through floating point.
 */
export function parseRandsToCents(input: string): number | null {
  const cleaned = input.replace(/[R\s ]/gi, "").replace(",", ".");
  const m = /^(\d{1,7})(?:\.(\d{1,2}))?$/.exec(cleaned);
  if (!m) return null;
  return Number(m[1]) * 100 + Number((m[2] ?? "").padEnd(2, "0"));
}

/** Cents as a plain "149.90" string for form fields. */
export function centsToRandsInput(cents: number): string {
  return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, "0")}`;
}
