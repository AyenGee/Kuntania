import { describe, expect, it } from "vitest";
import { centsToDecimalString, formatZar, vatIncludedCents } from "./money";

describe("money", () => {
  it("formats cents as decimal strings for PayFast", () => {
    expect(centsToDecimalString(12345)).toBe("123.45");
    expect(centsToDecimalString(5)).toBe("0.05");
    expect(centsToDecimalString(10000)).toBe("100.00");
  });

  it("rejects non-integer money", () => {
    expect(() => centsToDecimalString(10.5)).toThrow();
    expect(() => formatZar(0.1 + 0.2)).toThrow();
  });

  it("formats ZAR for display", () => {
    expect(formatZar(12345)).toMatch(/^R\s?123[.,]45$/);
  });

  it("extracts 15% VAT from a VAT-inclusive amount", () => {
    expect(vatIncludedCents(11500)).toBe(1500);
    expect(vatIncludedCents(10000)).toBe(1304);
  });
});
