import { z } from "zod";
import { getDb } from "@/lib/db";
import { sendCancelledOrRefundedEmail, sendShippedEmail } from "@/lib/email/order-emails";
import { ORDER_STATUS_LABEL, type OrderStatusValue } from "@/lib/order-status";
import { canTransition, UNSHIPPED_PAID_STATUSES } from "./order-transitions";

export const shipDetailsSchema = z.object({
  courierName: z.string().trim().min(1, "Please enter the courier name").max(60),
  trackingNumber: z
    .string()
    .trim()
    .max(80)
    .transform((v) => (v === "" ? undefined : v)),
  trackingUrl: z
    .string()
    .trim()
    .max(300)
    .transform((v) => (v === "" ? undefined : v))
    .refine((v) => v === undefined || /^https?:\/\/\S+$/i.test(v), {
      message: "Tracking link must start with http:// or https://",
    }),
});
export type ShipDetails = z.infer<typeof shipDetailsSchema>;

export type TransitionResult =
  | { ok: true; email: "sent" | "failed" | "none"; restocked: boolean }
  | { ok: false; message: string };

/**
 * Change an order's status on behalf of an admin.
 *  - only transitions in ALLOWED_TRANSITIONS are permitted (never manually to PAID);
 *  - the change is a conditional UPDATE on the status we read, so two admins (or an admin and
 *    a payment notification) can't both act on the same order state;
 *  - cancelling a paid order that hasn't shipped puts its stock back on the shelf;
 *  - every change is written to the order's event log with the admin's name;
 *  - the customer is emailed for shipped / cancelled-after-payment / refunded. Email failure
 *    never undoes the status change; it is reported so the admin can resend.
 */
export async function transitionOrder(input: {
  orderId: string;
  to: OrderStatusValue;
  adminName: string;
  ship?: ShipDetails;
}): Promise<TransitionResult> {
  const { orderId, to, adminName, ship } = input;
  const db = getDb();

  const outcome = await db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) return { ok: false as const, message: "Order not found." };

    const from = order.status as OrderStatusValue;
    if (!canTransition(from, to)) {
      return {
        ok: false as const,
        message: `An order that is "${ORDER_STATUS_LABEL[from]}" can't be changed to "${ORDER_STATUS_LABEL[to]}".`,
      };
    }
    if (to === "SHIPPED" && !ship) {
      return {
        ok: false as const,
        message: "Courier details are required to ship an order.",
      };
    }

    const claimed = await tx.order.updateMany({
      where: { id: orderId, status: from },
      data: {
        status: to,
        ...(to === "SHIPPED" && ship
          ? {
              courierName: ship.courierName,
              trackingNumber: ship.trackingNumber ?? null,
              trackingUrl: ship.trackingUrl ?? null,
            }
          : {}),
      },
    });
    if (claimed.count === 0) {
      return {
        ok: false as const,
        message:
          "This order was just changed by someone else. Please refresh and try again.",
      };
    }

    let restocked = false;
    if (to === "CANCELLED" && UNSHIPPED_PAID_STATUSES.includes(from)) {
      for (const item of order.items) {
        await tx.product.updateMany({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
      restocked = true;
    }

    await tx.orderEvent.create({
      data: {
        orderId,
        type: `status_${to.toLowerCase()}`,
        message:
          `Marked ${ORDER_STATUS_LABEL[to]} by ${adminName}.` +
          (to === "SHIPPED" && ship
            ? ` Courier: ${ship.courierName}${ship.trackingNumber ? `, tracking ${ship.trackingNumber}` : ""}.`
            : "") +
          (restocked ? " Stock returned to the shelf." : "") +
          (to === "REFUNDED"
            ? " Record only: the refund itself must be made in the PayFast dashboard."
            : "") +
          (to === "CANCELLED" && UNSHIPPED_PAID_STATUSES.includes(from)
            ? " The customer paid: refund them in the PayFast dashboard."
            : ""),
      },
    });

    return { ok: true as const, from, restocked };
  });

  if (!outcome.ok) return outcome;

  let email: "sent" | "failed" | "none" = "none";
  const wasPaid = outcome.from !== "PENDING_PAYMENT";
  if (to === "SHIPPED") {
    email = (await sendShippedEmail(orderId)) ? "sent" : "failed";
  } else if (to === "REFUNDED") {
    email = (await sendCancelledOrRefundedEmail(orderId, "refunded")) ? "sent" : "failed";
  } else if (to === "CANCELLED" && wasPaid) {
    email = (await sendCancelledOrRefundedEmail(orderId, "cancelled"))
      ? "sent"
      : "failed";
  }

  console.info(JSON.stringify({ event: "admin.order_status", to, email }));
  return { ok: true, email, restocked: outcome.restocked };
}
