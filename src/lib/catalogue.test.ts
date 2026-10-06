import { describe, expect, it } from "vitest";
import { maxOrderQuantity, stockStatus } from "./catalogue-stock";

describe("stockStatus", () => {
  it("reports sold out at zero or below", () => {
    expect(stockStatus(0, 5)).toEqual({ state: "sold_out" });
    expect(stockStatus(-2, 5)).toEqual({ state: "sold_out" });
  });
  it("reports low stock at or below the threshold", () => {
    expect(stockStatus(5, 5)).toEqual({ state: "low", remaining: 5 });
    expect(stockStatus(1, 5)).toEqual({ state: "low", remaining: 1 });
  });
  it("reports in stock above the threshold", () => {
    expect(stockStatus(6, 5)).toEqual({ state: "in_stock" });
  });
});

describe("maxOrderQuantity", () => {
  it("is capped by stock and by the per-order maximum", () => {
    expect(maxOrderQuantity(3, 10)).toBe(3);
    expect(maxOrderQuantity(50, 10)).toBe(10);
    expect(maxOrderQuantity(0, 10)).toBe(0);
    expect(maxOrderQuantity(-1, 10)).toBe(0);
  });
});
