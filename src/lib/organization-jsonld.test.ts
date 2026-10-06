import { describe, expect, it } from "vitest";
import { organizationJsonLd } from "./organization-jsonld";

describe("organizationJsonLd", () => {
  const ld = organizationJsonLd("https://shop.example.co.za");

  it("identifies the organisation", () => {
    expect(ld["@type"]).toBe("Organization");
    expect(ld.name).toBe("Kunta Nia");
    expect(ld.url).toBe("https://shop.example.co.za");
  });

  it("never leaks TODO(CLIENT) placeholders", () => {
    expect(JSON.stringify(ld)).not.toContain("TODO(CLIENT)");
  });

  it("includes social profiles that have real URLs", () => {
    expect(ld.sameAs).toContain("https://www.instagram.com/kunta.nia");
  });
});
