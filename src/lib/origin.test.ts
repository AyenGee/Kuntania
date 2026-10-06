import { describe, expect, it } from "vitest";
import { isMutation, isSameOrigin } from "./origin";

describe("isSameOrigin", () => {
  it("accepts an origin matching the host", () => {
    expect(isSameOrigin("https://shop.example.co.za", "shop.example.co.za", null)).toBe(
      true,
    );
    expect(isSameOrigin("http://localhost:3000", "localhost:3000", null)).toBe(true);
  });
  it("accepts an origin matching the forwarded host (behind a proxy)", () => {
    expect(
      isSameOrigin("https://shop.example.co.za", "internal:3000", "shop.example.co.za"),
    ).toBe(true);
    expect(
      isSameOrigin(
        "https://shop.example.co.za",
        "internal:3000",
        "shop.example.co.za, other",
      ),
    ).toBe(true);
  });
  it("rejects other sites, a missing Origin, and garbage", () => {
    expect(isSameOrigin("https://evil.example", "shop.example.co.za", null)).toBe(false);
    expect(
      isSameOrigin("https://shop.example.co.za.evil.example", "shop.example.co.za", null),
    ).toBe(false);
    expect(isSameOrigin(null, "shop.example.co.za", null)).toBe(false);
    expect(isSameOrigin("null", "shop.example.co.za", null)).toBe(false);
    expect(isSameOrigin("https://shop.example.co.za", null, null)).toBe(false);
  });
});

describe("isMutation", () => {
  it("treats only safe methods as non-mutating", () => {
    expect(isMutation("GET")).toBe(false);
    expect(isMutation("head")).toBe(false);
    expect(isMutation("POST")).toBe(true);
    expect(isMutation("DELETE")).toBe(true);
  });
});
