"use server";

import { z } from "zod";
import type { Resolution } from "@/lib/cart-resolve";
import { loadResolution } from "@/lib/checkout";
import { checkRateLimit } from "@/lib/rate-limit";

const inputSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1).max(64),
        quantity: z.number().int().min(1).max(1000),
      }),
    )
    .max(50),
  shippingMethod: z.enum(["COURIER", "PICKUP_POINT", "COLLECTION"]),
  discountCode: z.string().trim().max(40).nullable(),
});

export type PriceCartResult = { ok: true; resolution: Resolution } | { ok: false };

/**
 * Price a cart on the server for the cart/checkout pages. The client sends only
 * {productId, quantity}; prices, stock and discounts are always read from the database.
 * Discount-code lookups are rate limited so codes can't be guessed in bulk.
 */
export async function priceCartAction(raw: unknown): Promise<PriceCartResult> {
  const parsed = inputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false };
  const { items, shippingMethod } = parsed.data;
  let discountCode = parsed.data.discountCode || null;

  try {
    if (discountCode && !(await checkRateLimit("discount", 30, 60 * 60))) {
      discountCode = null;
      const resolution = await loadResolution({ items, shippingMethod, discountCode });
      return {
        ok: true,
        resolution: {
          ...resolution,
          discountError: "Too many attempts. Please try again later.",
        },
      };
    }
    return {
      ok: true,
      resolution: await loadResolution({ items, shippingMethod, discountCode }),
    };
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "cart.price_failed",
        error: error instanceof Error ? error.message : String(error),
      }),
    );
    return { ok: false };
  }
}
