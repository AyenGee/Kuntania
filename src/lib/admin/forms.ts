import { z } from "zod";
import { parseRandsToCents } from "./rands";

/**
 * Validation for the admin product and discount forms. Money is typed in rands and converted
 * to integer cents; dates are SA calendar dates. Pure functions so they can be unit-tested.
 */

const SAST_OFFSET_MS = 2 * 60 * 60 * 1000;

const rands = (label: string) =>
  z
    .string()
    .trim()
    .transform((v, ctx) => {
      const cents = parseRandsToCents(v);
      if (cents === null) {
        ctx.addIssue({
          code: "custom",
          message: `${label} must be an amount like 149.90`,
        });
        return z.NEVER;
      }
      return cents;
    });

const optionalRands = (label: string) =>
  z
    .string()
    .trim()
    .transform((v, ctx) => {
      if (v === "") return null;
      const cents = parseRandsToCents(v);
      if (cents === null) {
        ctx.addIssue({
          code: "custom",
          message: `${label} must be an amount like 149.90`,
        });
        return z.NEVER;
      }
      return cents;
    });

const wholeNumber = (label: string, min: number, max: number) =>
  z
    .string()
    .trim()
    .regex(/^\d+$/, `${label} must be a whole number`)
    .transform(Number)
    .refine((n) => n >= min && n <= max, `${label} must be between ${min} and ${max}`);

const titledList = z.string().transform((raw, ctx) => {
  try {
    const parsed = z
      .array(
        z.object({
          title: z.string().trim().min(1).max(120),
          body: z.string().trim().min(1).max(1000),
        }),
      )
      .max(20)
      .parse(JSON.parse(raw));
    return parsed;
  } catch {
    ctx.addIssue({
      code: "custom",
      message: "Each item needs a heading and some text",
    });
    return z.NEVER;
  }
});

export const productFormSchema = z
  .object({
    name: z.string().trim().min(1, "Please enter a name").max(120),
    shortName: z.string().trim().min(1, "Please enter a short name").max(60),
    tagline: z.string().trim().min(1, "Please enter a tagline").max(200),
    description: z.string().trim().min(1, "Please enter a description").max(3000),
    benefits: titledList,
    howToUse: titledList,
    ingredientsInci: z.string().trim().min(1, "Please enter the ingredients").max(4000),
    warnings: z.string().trim().min(1, "Please enter warnings").max(3000),
    sizeLabel: z.string().trim().min(1, "Please enter the size").max(40),
    price: rands("Price"),
    compareAtPrice: optionalRands("Compare-at price"),
    stock: wholeNumber("Stock", 0, 100000),
    sortOrder: wholeNumber("Sort order", 0, 1000),
    active: z
      .string()
      .optional()
      .transform((v) => v === "on"),
    seoTitle: z.string().trim().min(1, "Please enter an SEO title").max(70),
    seoDescription: z.string().trim().min(1, "Please enter an SEO description").max(200),
  })
  .superRefine((v, ctx) => {
    if (v.price < 100) {
      ctx.addIssue({
        code: "custom",
        path: ["price"],
        message: "Price must be at least R1.00",
      });
    }
    if (v.compareAtPrice !== null && v.compareAtPrice <= v.price) {
      ctx.addIssue({
        code: "custom",
        path: ["compareAtPrice"],
        message: "The compare-at (old) price must be higher than the price",
      });
    }
  });

export type ProductFormData = z.infer<typeof productFormSchema>;

/** SA calendar date input ("YYYY-MM-DD" or "") -> UTC instant at 00:00 SAST, or null. */
const sastDate = (label: string, endOfDay: boolean) =>
  z
    .string()
    .trim()
    .transform((v, ctx) => {
      if (v === "") return null;
      const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
      const d = m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])) : null;
      if (!m || !d || d.getUTCMonth() !== +m[2] - 1 || d.getUTCDate() !== +m[3]) {
        ctx.addIssue({ code: "custom", message: `${label} must be a valid date` });
        return z.NEVER;
      }
      const dayStart = d.getTime() - SAST_OFFSET_MS;
      // An end date is inclusive: the code works until the end of that day.
      return new Date(endOfDay ? dayStart + 24 * 60 * 60 * 1000 - 1 : dayStart);
    });

export const discountFormSchema = z
  .object({
    code: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9_-]{3,30}$/, "Use 3 to 30 letters, numbers, - or _"),
    type: z.enum(["PERCENT", "FIXED"]),
    value: z.string().trim(),
    minSubtotal: optionalRands("Minimum spend"),
    maxUses: z
      .string()
      .trim()
      .transform((v, ctx) => {
        if (v === "") return null;
        if (!/^\d+$/.test(v) || Number(v) < 1 || Number(v) > 1_000_000) {
          ctx.addIssue({
            code: "custom",
            message: "Maximum uses must be a whole number",
          });
          return z.NEVER;
        }
        return Number(v);
      }),
    startsAt: sastDate("Start date", false),
    endsAt: sastDate("End date", true),
    active: z
      .string()
      .optional()
      .transform((v) => v === "on"),
  })
  .transform((v, ctx) => {
    let valueNumber: number;
    if (v.type === "PERCENT") {
      if (!/^\d{1,3}$/.test(v.value) || Number(v.value) < 1 || Number(v.value) > 100) {
        ctx.addIssue({
          code: "custom",
          path: ["value"],
          message: "Percentage must be a whole number from 1 to 100",
        });
        return z.NEVER;
      }
      valueNumber = Number(v.value);
    } else {
      const cents = parseRandsToCents(v.value);
      if (cents === null || cents < 100) {
        ctx.addIssue({
          code: "custom",
          path: ["value"],
          message: "Amount must be at least R1.00, like 50 or 49.90",
        });
        return z.NEVER;
      }
      valueNumber = cents;
    }
    if (v.startsAt && v.endsAt && v.endsAt < v.startsAt) {
      ctx.addIssue({
        code: "custom",
        path: ["endsAt"],
        message: "The end date must be after the start date",
      });
      return z.NEVER;
    }
    return { ...v, value: valueNumber, minSubtotal: v.minSubtotal ?? 0 };
  });

export type DiscountFormData = z.infer<typeof discountFormSchema>;
