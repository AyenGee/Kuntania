import { z } from "zod";

const trimmed = (max: number) => z.string().trim().max(max);

/**
 * Normalise a South African mobile/phone number to +27XXXXXXXXX.
 * Accepts 0XXXXXXXXX, 27XXXXXXXXX, +27XXXXXXXXX (spaces, dashes, brackets ignored).
 * Returns null if it does not look like a valid SA number.
 */
export function normaliseSaPhone(input: string): string | null {
  const digits = input.replace(/[\s\-()]/g, "");
  const match = /^(?:\+27|27|0)([1-9]\d{8})$/.exec(digits);
  return match ? `+27${match[1]}` : null;
}

const optionalPhone = z
  .string()
  .trim()
  .max(30)
  .transform((v, ctx) => {
    if (v === "") return undefined;
    const normalised = normaliseSaPhone(v);
    if (!normalised) {
      ctx.addIssue({
        code: "custom",
        message: "Enter a valid South African phone number",
      });
      return z.NEVER;
    }
    return normalised;
  });

export const contactSchema = z.object({
  name: trimmed(100).min(1, "Please enter your name"),
  email: z.email("Please enter a valid email address").max(254),
  phone: optionalPhone,
  subject: trimmed(150).min(1, "Please enter a subject"),
  message: trimmed(5000).min(10, "Please write a little more (at least 10 characters)"),
  /** Honeypot: real users never see or fill this. */
  website: z.string().max(0).optional(),
});

export const newsletterSchema = z.object({
  email: z.email("Please enter a valid email address").max(254),
  consent: z.literal("on", "Please tick the box to confirm you'd like to subscribe"),
  source: z.string().max(40).optional(),
  website: z.string().max(0).optional(),
});

export type FormState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
};

/** Convert Zod issues into a { field: message } map (first message per field). */
export function fieldErrorsFrom(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}
