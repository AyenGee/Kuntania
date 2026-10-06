"use server";

import { redirect } from "next/navigation";
import { placeOrder } from "@/lib/checkout";
import { checkRateLimit } from "@/lib/rate-limit";
import { checkoutSchema } from "@/lib/validation/checkout";
import { fieldErrorsFrom, valuesFrom, type FormState } from "@/lib/validation/forms";

const GENERIC_ERROR = "Sorry, something went wrong placing your order. Please try again.";

/**
 * Validate the checkout form, create the order, then redirect.
 * (Phase 5 replaces the redirect target with the PayFast payment page.)
 */
export async function placeOrderAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  let orderNumber: string;

  try {
    // Honeypot: bots get a generic failure, real users never see this field.
    if (String(formData.get("website") ?? "") !== "") {
      return { ok: false, message: GENERIC_ERROR };
    }
    if (!(await checkRateLimit("checkout", 10, 60 * 60))) {
      return {
        ok: false,
        message: "Too many orders from your connection. Please try again later.",
      };
    }

    const parsed = checkoutSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
      return {
        ok: false,
        message: "Please check the highlighted fields.",
        fieldErrors: fieldErrorsFrom(parsed.error),
        values: valuesFrom(formData),
      };
    }

    const result = await placeOrder(parsed.data);
    if (!result.ok) return { ...result, values: valuesFrom(formData) };
    orderNumber = result.orderNumber;
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "checkout.failed",
        error: error instanceof Error ? error.message : String(error),
      }),
    );
    return { ok: false, message: GENERIC_ERROR, values: valuesFrom(formData) };
  }

  // redirect() throws, so it must stay outside the try/catch above.
  redirect(`/checkout/success?order=${encodeURIComponent(orderNumber)}`);
}
