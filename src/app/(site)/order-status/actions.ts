"use server";

import { z } from "zod";
import { getDb } from "@/lib/db";
import { ORDER_STATUS_LABEL, safeTrackingUrl } from "@/lib/order-status";
import { checkRateLimit } from "@/lib/rate-limit";
import { fieldErrorsFrom, valuesFrom, type FormState } from "@/lib/validation/forms";

const schema = z.object({
  orderNumber: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^KN-\d{4,12}$/, "Enter your order number, e.g. KN-10042"),
  email: z.email("Please enter the email address used for the order").max(254),
  website: z.string().max(0).optional(),
});

export type OrderStatusResult = {
  orderNumber: string;
  statusLabel: string;
  placedOn: string;
  items: { name: string; quantity: number }[];
  courierName: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
};

export type OrderStatusState = FormState & { result?: OrderStatusResult };

const NOT_FOUND =
  "We couldn't find an order matching those details. Please check your order number and email.";

/**
 * Look up an order by order number AND email. Both must match; the answer for "no such
 * order" and "wrong email" is identical so the form can't be used to probe for orders.
 * Only status, items and tracking are returned: never address or contact details.
 */
export async function lookupOrder(
  _prev: OrderStatusState,
  formData: FormData,
): Promise<OrderStatusState> {
  try {
    if (String(formData.get("website") ?? "") !== "")
      return { ok: false, message: NOT_FOUND };
    if (!(await checkRateLimit("order-lookup", 15, 60 * 60))) {
      return { ok: false, message: "Too many attempts. Please try again later." };
    }
    const parsed = schema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
      return {
        ok: false,
        fieldErrors: fieldErrorsFrom(parsed.error),
        values: valuesFrom(formData),
      };
    }

    const order = await getDb().order.findUnique({
      where: { orderNumber: parsed.data.orderNumber },
      include: { items: { select: { productNameSnapshot: true, quantity: true } } },
    });
    if (!order || order.email.toLowerCase() !== parsed.data.email.toLowerCase()) {
      return { ok: false, message: NOT_FOUND, values: valuesFrom(formData) };
    }

    return {
      ok: true,
      result: {
        orderNumber: order.orderNumber,
        statusLabel: ORDER_STATUS_LABEL[order.status],
        placedOn: order.createdAt.toISOString().slice(0, 10),
        items: order.items.map((i) => ({
          name: i.productNameSnapshot,
          quantity: i.quantity,
        })),
        courierName: order.courierName,
        trackingNumber: order.trackingNumber,
        trackingUrl: safeTrackingUrl(order.trackingUrl),
      },
    };
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "order_lookup.failed",
        error: error instanceof Error ? error.message : String(error),
      }),
    );
    return { ok: false, message: "Sorry, something went wrong. Please try again." };
  }
}
