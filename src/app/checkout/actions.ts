"use server";

import { placeOrder } from "@/lib/checkout";
import { getPaymentProvider, PaymentsNotConfiguredError } from "@/lib/payments";
import type { PaymentRedirect } from "@/lib/payments/types";
import { checkRateLimit } from "@/lib/rate-limit";
import { checkoutSchema } from "@/lib/validation/checkout";
import { fieldErrorsFrom, valuesFrom, type FormState } from "@/lib/validation/forms";

const GENERIC_ERROR = "Sorry, something went wrong placing your order. Please try again.";

export type CheckoutState = FormState & { payment?: PaymentRedirect };

/**
 * Validate the checkout form, create the PENDING_PAYMENT order, and return the signed
 * payment redirect for the browser to submit. The order is never marked paid here:
 * only the verified payment notification (ITN) does that.
 *
 * The redirect is returned to the caller (not put behind a URL) so the signed fields,
 * which include the customer's name and email, can't be fetched by guessing an order number.
 */
export async function placeOrderAction(
  _prev: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
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

    // Fail before creating an order if payments aren't set up.
    const provider = getPaymentProvider();

    const result = await placeOrder(parsed.data);
    if (!result.ok) return { ...result, values: valuesFrom(formData) };

    const payment = provider.createPayment({
      orderNumber: result.orderNumber,
      totalCents: result.totalCents,
      email: result.email,
      firstName: result.firstName,
      lastName: result.lastName,
    });
    return { ok: true, payment };
  } catch (error) {
    if (error instanceof PaymentsNotConfiguredError) {
      console.error(JSON.stringify({ event: "checkout.payments_not_configured" }));
      return {
        ok: false,
        message: "Online payment isn't available right now. Please contact us to order.",
        values: valuesFrom(formData),
      };
    }
    console.error(
      JSON.stringify({
        event: "checkout.failed",
        error: error instanceof Error ? error.message : String(error),
      }),
    );
    return { ok: false, message: GENERIC_ERROR, values: valuesFrom(formData) };
  }
}
