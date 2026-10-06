import { z } from "zod";
import { PROVINCE_VALUES } from "@/lib/provinces";
import { normaliseSaPhone } from "./forms";

const text = (max: number) => z.string().trim().max(max);

const saPhone = z
  .string()
  .trim()
  .min(1, "Please enter your mobile number")
  .transform((v, ctx) => {
    const n = normaliseSaPhone(v);
    if (!n) {
      ctx.addIssue({
        code: "custom",
        message: "Enter a valid South African mobile number",
      });
      return z.NEVER;
    }
    return n;
  });

const optionalText = (max: number) =>
  text(max).transform((v) => (v === "" ? undefined : v));

/** Untrusted cart JSON from the form. Quantities are re-validated against stock server-side. */
const cartJson = z.string().transform((raw, ctx) => {
  try {
    return z
      .array(
        z.object({
          productId: z.string().min(1).max(64),
          quantity: z.number().int().min(1).max(1000),
        }),
      )
      .max(50)
      .parse(JSON.parse(raw));
  } catch {
    ctx.addIssue({
      code: "custom",
      message: "Your cart could not be read. Please try again.",
    });
    return z.NEVER;
  }
});

export const checkoutSchema = z.object({
  email: z.email("Please enter a valid email address").max(254),
  firstName: text(60).min(1, "Please enter your first name"),
  lastName: text(60).min(1, "Please enter your last name"),
  phone: saPhone,
  addressLine1: text(120).min(1, "Please enter your street address"),
  addressLine2: optionalText(120),
  suburb: text(80).min(1, "Please enter your suburb"),
  city: text(80).min(1, "Please enter your city or town"),
  province: z.enum(PROVINCE_VALUES, "Please choose your province"),
  postalCode: z
    .string()
    .trim()
    .regex(/^\d{4}$/, "Postal code must be 4 digits"),
  deliveryMethod: z.enum(["COURIER", "PICKUP_POINT", "COLLECTION"]).default("COURIER"),
  deliveryNotes: optionalText(500),
  discountCode: optionalText(40),
  /** Checkbox: absent when unticked, "on" when ticked. */
  marketingOptIn: z
    .string()
    .optional()
    .transform((v) => v === "on"),
  acceptTerms: z.literal("on", "Please accept the Terms & Conditions and Privacy Policy"),
  cart: cartJson,
  /** Honeypot. */
  website: z.string().max(0).optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
