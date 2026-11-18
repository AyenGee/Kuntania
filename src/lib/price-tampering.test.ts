import { beforeEach, describe, expect, it, vi } from "vitest";

// A customer controls everything the browser sends. These tests send tampered carts through
// the real cart-pricing action and check that the price always comes from the database.

const findMany = vi.fn();
vi.mock("@/lib/db", () => ({
  getDb: () => ({
    product: { findMany },
    discountCode: { findUnique: vi.fn(async () => null) },
  }),
}));
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit: vi.fn(async () => true) }));
vi.mock("@/lib/env", () => ({ getEnv: () => ({ VAT_REGISTERED: false }) }));

import { priceCartAction } from "@/app/(site)/(narrow)/cart/actions";

const DB_PRODUCT = {
  id: "p1",
  slug: "oil",
  name: "Oil",
  sizeLabel: "100 ml",
  priceCents: 14900,
  stock: 50,
  active: true,
  images: [],
};

async function price(items: unknown[], extra: Record<string, unknown> = {}) {
  const result = await priceCartAction({
    items,
    shippingMethod: "COURIER",
    discountCode: null,
    ...extra,
  });
  return result;
}

describe("price tampering", () => {
  beforeEach(() => {
    findMany.mockReset();
    findMany.mockResolvedValue([DB_PRODUCT]);
  });

  it("ignores a price sent by the browser", async () => {
    const result = await price([
      { productId: "p1", quantity: 2, priceCents: 1, unitPriceCents: 1, price: 0.01 },
    ]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.resolution.lines[0].unitPriceCents).toBe(14900);
    expect(result.resolution.totals.subtotalCents).toBe(29800);
  });

  it("ignores a client-supplied total, subtotal or shipping cost", async () => {
    const result = await price([{ productId: "p1", quantity: 1 }], {
      totalCents: 1,
      subtotalCents: 1,
      shippingCents: 0,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.resolution.totals.subtotalCents).toBe(14900);
    expect(result.resolution.totals.totalCents).toBeGreaterThanOrEqual(14900);
  });

  it("rejects negative, zero, fractional and huge quantities", async () => {
    for (const quantity of [-5, 0, 1.5, 1_000_000, "2", null]) {
      const result = await price([{ productId: "p1", quantity }]);
      expect(result.ok).toBe(false);
    }
  });

  it("never prices an unknown product, and drops it with an issue", async () => {
    findMany.mockResolvedValue([]);
    const result = await price([{ productId: "made-up", quantity: 1 }]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.resolution.lines).toHaveLength(0);
    expect(result.resolution.totals.totalCents).toBe(
      result.resolution.totals.shippingCents ?? 0,
    );
    expect(result.resolution.issues.length).toBeGreaterThan(0);
  });

  it("does not price an inactive product", async () => {
    findMany.mockResolvedValue([{ ...DB_PRODUCT, active: false }]);
    const result = await price([{ productId: "p1", quantity: 1 }]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.resolution.lines).toHaveLength(0);
    expect(result.resolution.issues.length).toBeGreaterThan(0);
  });

  it("uses the database price when the admin changes it", async () => {
    findMany.mockResolvedValue([{ ...DB_PRODUCT, priceCents: 19900 }]);
    const result = await price([{ productId: "p1", quantity: 1 }]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.resolution.lines[0].unitPriceCents).toBe(19900);
  });

  it("ignores a forged discount amount and only accepts real codes", async () => {
    const result = await price([{ productId: "p1", quantity: 1 }], {
      discountCode: "FREE100",
      discountCents: 14900,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.resolution.totals.discountCents).toBe(0);
    expect(result.resolution.discountError).toBeTruthy();
  });
});
