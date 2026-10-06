import { describe, expect, it } from "vitest";
import { resolveCart, type ProductForCart } from "./cart-resolve";
import type { DiscountRow } from "./discounts";
import type { ShippingConfig } from "./shipping";

const cfg: ShippingConfig = {
  courierFlatRateCents: 8000,
  freeShippingThresholdCents: 50000,
  pickupPoint: null,
  localCollection: null,
};
const product = (over: Partial<ProductForCart> = {}): ProductForCart => ({
  id: "p1",
  slug: "oil",
  name: "Oil",
  sizeLabel: "100 ml",
  priceCents: 10000,
  stock: 20,
  active: true,
  images: [{ src: "/a.svg", alt: "a" }],
  ...over,
});
const base = {
  discountCode: null,
  discount: null,
  shippingMethod: "COURIER" as const,
  shippingConfig: cfg,
  vatRegistered: false,
  now: new Date("2026-06-15T12:00:00Z"),
  perOrderMax: 10,
};

describe("resolveCart", () => {
  it("prices from the database, never the client", () => {
    const r = resolveCart({
      ...base,
      items: [{ productId: "p1", quantity: 2 }],
      products: [product({ priceCents: 12345 })],
    });
    expect(r.totals.subtotalCents).toBe(24690);
    expect(r.totals.shippingCents).toBe(8000);
    expect(r.totals.totalCents).toBe(32690);
    expect(r.issues).toEqual([]);
  });

  it("removes inactive, missing and sold-out products with an issue", () => {
    const r = resolveCart({
      ...base,
      items: [
        { productId: "p1", quantity: 1 },
        { productId: "gone", quantity: 1 },
        { productId: "p3", quantity: 1 },
      ],
      products: [product({ active: false }), product({ id: "p3", stock: 0 })],
    });
    expect(r.lines).toEqual([]);
    expect(r.issues).toHaveLength(3);
    expect(r.effectiveCart).toEqual([]);
  });

  it("clamps to available stock and tells the customer", () => {
    const r = resolveCart({
      ...base,
      items: [{ productId: "p1", quantity: 5 }],
      products: [product({ stock: 2 })],
    });
    expect(r.lines[0].quantity).toBe(2);
    expect(r.issues[0].message).toMatch(/Only 2/);
    expect(r.effectiveCart).toEqual([{ productId: "p1", quantity: 2 }]);
  });

  it("clamps to the per-order maximum", () => {
    const r = resolveCart({
      ...base,
      items: [{ productId: "p1", quantity: 15 }],
      products: [product({ stock: 100 })],
    });
    expect(r.lines[0].quantity).toBe(10);
    expect(r.issues[0].message).toMatch(/at most 10/);
  });

  it("merges duplicate lines", () => {
    const r = resolveCart({
      ...base,
      items: [
        { productId: "p1", quantity: 1 },
        { productId: "p1", quantity: 2 },
      ],
      products: [product()],
    });
    expect(r.lines).toHaveLength(1);
    expect(r.lines[0].quantity).toBe(3);
  });

  it("applies a discount before the free-shipping check", () => {
    const d: DiscountRow = {
      id: "d1",
      code: "TEN",
      type: "PERCENT",
      value: 10,
      minSubtotalCents: 0,
      maxUses: null,
      usedCount: 0,
      startsAt: null,
      endsAt: null,
      active: true,
    };
    // 5 x R100 = R500 (qualifies for free shipping); 10% off -> R450 (does not).
    const r = resolveCart({
      ...base,
      items: [{ productId: "p1", quantity: 5 }],
      products: [product()],
      discountCode: "TEN",
      discount: d,
    });
    expect(r.totals.discountCents).toBe(5000);
    expect(r.totals.shippingCents).toBe(8000);
    expect(r.totals.totalCents).toBe(45000 + 8000);
    expect(r.discount).toEqual({ code: "TEN", id: "d1" });
  });

  it("reports an invalid code without discounting", () => {
    const r = resolveCart({
      ...base,
      items: [{ productId: "p1", quantity: 1 }],
      products: [product()],
      discountCode: "NOPE",
      discount: null,
    });
    expect(r.discountError).toBeTruthy();
    expect(r.totals.discountCents).toBe(0);
    expect(r.discount).toBeNull();
  });

  it("flags an unavailable delivery method", () => {
    const r = resolveCart({
      ...base,
      shippingMethod: "COLLECTION",
      items: [{ productId: "p1", quantity: 1 }],
      products: [product()],
    });
    expect(r.shippingError).toBeTruthy();
  });

  it("includes VAT when registered", () => {
    const r = resolveCart({
      ...base,
      vatRegistered: true,
      items: [{ productId: "p1", quantity: 1 }],
      products: [product({ priceCents: 11500 })],
      shippingConfig: { ...cfg, courierFlatRateCents: 0 },
    });
    expect(r.totals.vatIncludedCents).toBe(1500);
  });
});
