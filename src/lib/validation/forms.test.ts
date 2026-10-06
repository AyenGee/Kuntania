import { describe, expect, it } from "vitest";
import { contactSchema, newsletterSchema, normaliseSaPhone } from "./forms";

describe("normaliseSaPhone", () => {
  it.each([
    ["082 123 4567", "+27821234567"],
    ["0821234567", "+27821234567"],
    ["27821234567", "+27821234567"],
    ["+27 (82) 123-4567", "+27821234567"],
  ])("normalises %s", (input, expected) => {
    expect(normaliseSaPhone(input)).toBe(expected);
  });

  it.each(["", "12345", "+44 7700 900123", "0021234567", "08212345678"])(
    "rejects %s",
    (input) => {
      expect(normaliseSaPhone(input)).toBeNull();
    },
  );
});

describe("contactSchema", () => {
  const valid = {
    name: " Thandi ",
    email: "thandi@example.com",
    phone: "",
    subject: "Question",
    message: "Hello, I have a question about delivery.",
  };

  it("accepts a valid message and trims", () => {
    const r = contactSchema.safeParse(valid);
    expect(r.success && r.data.name).toBe("Thandi");
    expect(r.success && r.data.phone).toBeUndefined();
  });

  it("normalises phone when provided", () => {
    const r = contactSchema.safeParse({ ...valid, phone: "082 123 4567" });
    expect(r.success && r.data.phone).toBe("+27821234567");
  });

  it("rejects a filled honeypot", () => {
    expect(contactSchema.safeParse({ ...valid, website: "spam" }).success).toBe(false);
  });

  it("rejects bad email and short message", () => {
    expect(contactSchema.safeParse({ ...valid, email: "nope" }).success).toBe(false);
    expect(contactSchema.safeParse({ ...valid, message: "hi" }).success).toBe(false);
  });
});

describe("newsletterSchema", () => {
  it("requires explicit consent", () => {
    expect(newsletterSchema.safeParse({ email: "a@b.co" }).success).toBe(false);
    expect(newsletterSchema.safeParse({ email: "a@b.co", consent: "on" }).success).toBe(
      true,
    );
  });
});
