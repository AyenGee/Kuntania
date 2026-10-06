import { describe, expect, it } from "vitest";
import { discountFormSchema, productFormSchema } from "./forms";

const product = {
  name: "Hair Growth Oil",
  shortName: "Oil",
  tagline: "A scalp oil",
  description: "Description",
  benefits: JSON.stringify([{ title: "Scalp care", body: "Nourishes" }]),
  howToUse: JSON.stringify([{ title: "Step", body: "Apply" }]),
  ingredientsInci: "Rosemary",
  warnings: "External use",
  sizeLabel: "100 ml",
  price: "149.90",
  compareAtPrice: "",
  stock: "20",
  sortOrder: "1",
  active: "on",
  seoTitle: "Oil",
  seoDescription: "An oil",
};

describe("productFormSchema", () => {
  it("converts rands to cents and parses the lists", () => {
    const r = productFormSchema.safeParse(product);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.price).toBe(14990);
      expect(r.data.compareAtPrice).toBeNull();
      expect(r.data.stock).toBe(20);
      expect(r.data.active).toBe(true);
      expect(r.data.benefits).toEqual([{ title: "Scalp care", body: "Nourishes" }]);
    }
  });

  it("treats an unticked active box as inactive", () => {
    const { active: _a, ...rest } = product;
    void _a;
    const r = productFormSchema.safeParse(rest);
    expect(r.success && r.data.active).toBe(false);
  });

  it.each([
    ["price", "abc"],
    ["price", "0.50"],
    ["stock", "-1"],
    ["stock", "1.5"],
    ["compareAtPrice", "100"], // not higher than the 149.90 price
    ["benefits", "not json"],
    ["benefits", JSON.stringify([{ title: "", body: "x" }])],
    ["name", ""],
  ])("rejects %s=%s", (field, value) => {
    expect(productFormSchema.safeParse({ ...product, [field]: value }).success).toBe(
      false,
    );
  });

  it("accepts a higher compare-at price", () => {
    const r = productFormSchema.safeParse({ ...product, compareAtPrice: "199" });
    expect(r.success && r.data.compareAtPrice).toBe(19900);
  });
});

const discount = {
  code: " welcome10 ",
  type: "PERCENT",
  value: "10",
  minSubtotal: "",
  maxUses: "",
  startsAt: "",
  endsAt: "",
  active: "on",
};

describe("discountFormSchema", () => {
  it("uppercases the code and defaults optional fields", () => {
    const r = discountFormSchema.safeParse(discount);
    expect(r.success && r.data).toMatchObject({
      code: "WELCOME10",
      type: "PERCENT",
      value: 10,
      minSubtotal: 0,
      maxUses: null,
      startsAt: null,
      endsAt: null,
      active: true,
    });
  });

  it("stores fixed amounts as cents", () => {
    const r = discountFormSchema.safeParse({
      ...discount,
      type: "FIXED",
      value: "49.90",
    });
    expect(r.success && r.data.value).toBe(4990);
  });

  it("makes the end date inclusive (end of that SA day) and the start date the start of day", () => {
    const r = discountFormSchema.safeParse({
      ...discount,
      startsAt: "2026-06-01",
      endsAt: "2026-06-30",
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.startsAt!.toISOString()).toBe("2026-05-31T22:00:00.000Z");
      expect(r.data.endsAt!.toISOString()).toBe("2026-06-30T21:59:59.999Z");
    }
  });

  it.each([
    ["type", "PERCENT", "value", "0"],
    ["type", "PERCENT", "value", "101"],
    ["type", "PERCENT", "value", "10.5"],
    ["type", "FIXED", "value", "0.50"],
    ["code", "ab", "value", "10"],
    ["code", "has space", "value", "10"],
  ])("rejects bad input (%s=%s, %s=%s)", (f1, v1, f2, v2) => {
    expect(
      discountFormSchema.safeParse({ ...discount, [f1]: v1, [f2]: v2 }).success,
    ).toBe(false);
  });

  it("rejects an end date before the start date and bad max uses", () => {
    expect(
      discountFormSchema.safeParse({
        ...discount,
        startsAt: "2026-06-10",
        endsAt: "2026-06-01",
      }).success,
    ).toBe(false);
    expect(discountFormSchema.safeParse({ ...discount, maxUses: "0" }).success).toBe(
      false,
    );
    expect(discountFormSchema.safeParse({ ...discount, maxUses: "50" }).success).toBe(
      true,
    );
  });
});
