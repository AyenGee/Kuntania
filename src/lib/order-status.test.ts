import { describe, expect, it } from "vitest";
import { safeTrackingUrl } from "./order-status";

describe("safeTrackingUrl", () => {
  it("allows http(s) links only", () => {
    expect(safeTrackingUrl("https://track.example.com/abc")).toBe(
      "https://track.example.com/abc",
    );
    expect(safeTrackingUrl("javascript:alert(1)")).toBeNull();
    expect(safeTrackingUrl("data:text/html,x")).toBeNull();
    expect(safeTrackingUrl("not a url")).toBeNull();
    expect(safeTrackingUrl(null)).toBeNull();
  });
});
