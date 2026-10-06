import { describe, expect, it } from "vitest";
import { addItem, cartCount, removeItem, sanitiseCart, setQuantity } from "./cart";

describe("cart", () => {
  it("adds new items and merges existing ones, capped at max", () => {
    let cart = addItem([], "a", 2, 5);
    cart = addItem(cart, "a", 2, 5);
    expect(cart).toEqual([{ productId: "a", quantity: 4 }]);
    cart = addItem(cart, "a", 9, 5);
    expect(cart).toEqual([{ productId: "a", quantity: 5 }]);
  });

  it("ignores invalid quantities", () => {
    expect(addItem([], "a", 0, 5)).toEqual([]);
    expect(addItem([], "a", 1.5, 5)).toEqual([]);
    expect(addItem([], "a", 1, 0)).toEqual([]);
  });

  it("sets, removes and counts", () => {
    const cart = [
      { productId: "a", quantity: 2 },
      { productId: "b", quantity: 1 },
    ];
    expect(setQuantity(cart, "a", 4, 10)[0].quantity).toBe(4);
    expect(setQuantity(cart, "a", 99, 10)[0].quantity).toBe(10);
    expect(setQuantity(cart, "a", 0, 10)).toEqual([{ productId: "b", quantity: 1 }]);
    expect(removeItem(cart, "b")).toEqual([{ productId: "a", quantity: 2 }]);
    expect(cartCount(cart)).toBe(3);
  });

  it("sanitises untrusted stored data", () => {
    const dirty = [
      { productId: "a", quantity: 2 },
      { productId: "a", quantity: 20 },
      { productId: "", quantity: 1 },
      { productId: "b", quantity: -1 },
      { productId: "c", quantity: "3" },
      { productId: "d", quantity: 1, price: 1 },
      null,
      "x",
    ];
    expect(sanitiseCart(dirty, 10)).toEqual([
      { productId: "a", quantity: 10 },
      { productId: "d", quantity: 1 },
    ]);
    expect(sanitiseCart("nope", 10)).toEqual([]);
  });
});
