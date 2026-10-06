import { describe, expect, it } from "vitest";
import { evaluateDiscount, normaliseCode, type DiscountRow } from "./discounts";
import { computeTotals } from "./pricing";
import {
  availableShippingOptions,
  freeShippingRemainingCents,
  shippingCostCents,
  type ShippingConfig,
} from "./shipping";

const cfg: ShippingConfig = {
  courierFlatRateCents: 8000,
  freeShippingThresholdCents: 50000,
  pickupPoint: { label: "Pick-up point", flatRateCents: 5000 },
  localCollection: { label: "Collect", instructions: "x" },
};
const bare: ShippingConfig = {
  courierFlatRateCents: 8000,
  freeShippingThresholdCents: null,
  pickupPoint: null,
  localCollection: null,
};

const now = new Date("2026-06-15T12:00:00Z");
const code = (over: Partial<DiscountRow> = {}): DiscountRow => ({
  id: "d1",
  code: "SAVE",
  type: "PERCENT",
  value: 10,
  minSubtotalCents: 0,
  maxUses: null,
  usedCount: 0,
  startsAt: null,
  endsAt: null,
  active: true,
  ...over,
});

describe("shipping", () => {
  it("offers only configured options", () => {
    expect(availableShippingOptions(bare).map((o) => o.method)).toEqual(["COURIER"]);
    expect(availableShippingOptions(cfg).map((o) => o.method)).toEqual([
      "COURIER",
      "PICKUP_POINT",
      "COLLECTION",
    ]);
  });

  it("charges flat rates and rejects unconfigured methods", () => {
    expect(shippingCostCents("COURIER", 10000, cfg)).toBe(8000);
    expect(shippingCostCents("PICKUP_POINT", 10000, cfg)).toBe(5000);
    expect(shippingCostCents("COLLECTION", 10000, cfg)).toBe(0);
    expect(shippingCostCents("PICKUP_POINT", 10000, bare)).toBeNull();
    expect(shippingCostCents("COLLECTION", 10000, bare)).toBeNull();
  });

  it("is free at or above the threshold (and not below)", () => {
    expect(shippingCostCents("COURIER", 49999, cfg)).toBe(8000);
    expect(shippingCostCents("COURIER", 50000, cfg)).toBe(0);
    expect(shippingCostCents("PICKUP_POINT", 50000, cfg)).toBe(0);
    expect(shippingCostCents("COURIER", 999999, bare)).toBe(8000);
  });

  it("reports how much more to spend for free shipping", () => {
    expect(freeShippingRemainingCents(20000, cfg)).toBe(30000);
    expect(freeShippingRemainingCents(50000, cfg)).toBeNull();
    expect(freeShippingRemainingCents(20000, bare)).toBeNull();
  });
});

describe("evaluateDiscount", () => {
  it("rounds percentages down and caps fixed amounts at the subtotal", () => {
    expect(evaluateDiscount(code(), 9999, now)).toEqual({ ok: true, amountCents: 999 });
    expect(evaluateDiscount(code({ type: "FIXED", value: 5000 }), 3000, now)).toEqual({
      ok: true,
      amountCents: 3000,
    });
    expect(evaluateDiscount(code({ value: 100 }), 4000, now)).toEqual({
      ok: true,
      amountCents: 4000,
    });
  });

  it("rejects unknown, inactive, early, expired and used-up codes with one generic message", () => {
    const rejects = [
      null,
      code({ active: false }),
      code({ startsAt: new Date("2026-07-01") }),
      code({ endsAt: new Date("2026-06-01") }),
      code({ maxUses: 5, usedCount: 5 }),
    ].map((d) => evaluateDiscount(d, 10000, now));
    for (const r of rejects)
      expect(r).toEqual({ ok: false, message: expect.any(String) });
    expect(new Set(rejects.map((r) => (r.ok ? "" : r.message))).size).toBe(1);
  });

  it("enforces the minimum subtotal", () => {
    const d = code({ minSubtotalCents: 20000 });
    expect(evaluateDiscount(d, 19999, now).ok).toBe(false);
    expect(evaluateDiscount(d, 20000, now).ok).toBe(true);
  });

  it("allows codes up to their use limit minus one", () => {
    expect(evaluateDiscount(code({ maxUses: 5, usedCount: 4 }), 10000, now).ok).toBe(
      true,
    );
  });

  it("normalises codes to uppercase", () => {
    expect(normaliseCode("  save10 ")).toBe("SAVE10");
  });
});

describe("computeTotals", () => {
  it("computes total and VAT-inclusive portion", () => {
    expect(
      computeTotals({
        subtotalCents: 30000,
        discountCents: 3000,
        shippingCents: 8000,
        vatRegistered: true,
      }),
    ).toEqual({
      subtotalCents: 30000,
      discountCents: 3000,
      shippingCents: 8000,
      totalCents: 35000,
      vatIncludedCents: 4565,
    });
  });

  it("reports no VAT when not registered", () => {
    expect(
      computeTotals({
        subtotalCents: 10000,
        discountCents: 0,
        shippingCents: 0,
        vatRegistered: false,
      }).vatIncludedCents,
    ).toBe(0);
  });
});
