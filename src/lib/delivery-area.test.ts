import { describe, expect, it } from "vitest";
import { isServiceablePostalCode } from "./delivery-area";

describe("isServiceablePostalCode", () => {
  it("serves everywhere while the restriction is off", () => {
    expect(
      isServiceablePostalCode("9999", {
        restrictToPostalCodes: false,
        postalCodeRanges: [],
      }),
    ).toBe(true);
  });

  it("serves only listed ranges (inclusive) when the restriction is on", () => {
    const cfg = {
      restrictToPostalCodes: true,
      postalCodeRanges: [
        [2000, 2199],
        [8000, 8099],
      ] as const,
    };
    expect(isServiceablePostalCode("2194", cfg)).toBe(true);
    expect(isServiceablePostalCode("2000", cfg)).toBe(true);
    expect(isServiceablePostalCode("2199", cfg)).toBe(true);
    expect(isServiceablePostalCode("2200", cfg)).toBe(false);
    expect(isServiceablePostalCode("8050", cfg)).toBe(true);
    expect(isServiceablePostalCode("0900", cfg)).toBe(false);
  });

  it("rejects malformed codes, and an empty list when restricted", () => {
    const cfg = {
      restrictToPostalCodes: true,
      postalCodeRanges: [[2000, 2199]] as const,
    };
    expect(isServiceablePostalCode("20x4", cfg)).toBe(false);
    expect(isServiceablePostalCode("", cfg)).toBe(false);
    expect(
      isServiceablePostalCode("2194", {
        restrictToPostalCodes: true,
        postalCodeRanges: [],
      }),
    ).toBe(false);
  });
});
