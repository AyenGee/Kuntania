import { describe, expect, it } from "vitest";
import { checkoutSchema } from "./checkout";

const valid = {
  email: "thandi@example.com",
  firstName: "Thandi",
  lastName: "Nkosi",
  phone: "082 123 4567",
  addressLine1: "12 Main Road",
  addressLine2: "",
  suburb: "Parktown",
  city: "Johannesburg",
  province: "GAUTENG",
  postalCode: "2193",
  deliveryMethod: "COURIER",
  deliveryNotes: "",
  discountCode: "",
  acceptTerms: "on",
  cart: JSON.stringify([{ productId: "p1", quantity: 2 }]),
};

describe("checkoutSchema", () => {
  it("accepts a valid order and normalises fields", () => {
    const r = checkoutSchema.safeParse(valid);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.phone).toBe("+27821234567");
      expect(r.data.addressLine2).toBeUndefined();
      expect(r.data.marketingOptIn).toBe(false);
      expect(r.data.cart).toEqual([{ productId: "p1", quantity: 2 }]);
    }
  });

  it("treats marketing opt-in as off unless ticked", () => {
    const r = checkoutSchema.safeParse({ ...valid, marketingOptIn: "on" });
    expect(r.success && r.data.marketingOptIn).toBe(true);
  });

  it("requires accepting the terms", () => {
    const { acceptTerms: _omit, ...rest } = valid;
    void _omit;
    expect(checkoutSchema.safeParse(rest).success).toBe(false);
  });

  it.each([
    ["postalCode", "123"],
    ["postalCode", "12345"],
    ["postalCode", "12a4"],
    ["province", "ATLANTIS"],
    ["phone", "123"],
    ["email", "nope"],
    ["website", "bot"],
  ])("rejects bad %s=%s", (field, value) => {
    expect(checkoutSchema.safeParse({ ...valid, [field]: value }).success).toBe(false);
  });

  it("rejects malformed or oversized cart JSON", () => {
    expect(checkoutSchema.safeParse({ ...valid, cart: "not json" }).success).toBe(false);
    expect(
      checkoutSchema.safeParse({
        ...valid,
        cart: JSON.stringify([{ productId: "p", quantity: 0 }]),
      }).success,
    ).toBe(false);
    expect(
      checkoutSchema.safeParse({
        ...valid,
        cart: JSON.stringify([{ productId: "p", quantity: 1.5 }]),
      }).success,
    ).toBe(false);
  });
});
