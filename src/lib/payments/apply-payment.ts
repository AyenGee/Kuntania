import { getDb } from "@/lib/db";
import { notifyOrderPaid } from "./after-paid";

export type ApplyPaymentResult =
  | { applied: true; orderId: string; stockShortfall: boolean }
  | { applied: false; reason: "already_processed" | "not_found" };

/**
 * Mark an order paid after a fully verified COMPLETE notification.
 *
 * Idempotent: the status change is a single conditional UPDATE
 * (... WHERE status IN ('PENDING_PAYMENT','CANCELLED')), so a repeated or concurrent ITN
 * finds nothing to update and does nothing: no double stock decrement, no double
 * discount use, no duplicate emails.
 *
 * A late payment on an order that was auto-cancelled still counts: the customer's money has
 * been taken, so the order becomes PAID and the event log records it.
 *
 * If stock ran out between checkout and payment the order is STILL marked paid, stock is
 * floored at 0, and `stockShortfall` is set so the owner is alerted and can act.
 */
export async function applyCompletedPayment(input: {
  orderNumber: string;
  paymentReference: string;
}): Promise<ApplyPaymentResult> {
  const db = getDb();

  const result = await db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { orderNumber: input.orderNumber },
      include: { items: true },
    });
    if (!order) return { applied: false as const, reason: "not_found" as const };
    const previousStatus = order.status;

    const claimed = await tx.order.updateMany({
      where: { id: order.id, status: { in: ["PENDING_PAYMENT", "CANCELLED"] } },
      data: {
        status: "PAID",
        paidAt: new Date(),
        paymentReference: input.paymentReference,
      },
    });
    if (claimed.count === 0) {
      return { applied: false as const, reason: "already_processed" as const };
    }

    let shortfall = false;
    for (const item of order.items) {
      const decremented = await tx.product.updateMany({
        where: { id: item.productId, stock: { gte: item.quantity } },
        data: { stock: { decrement: item.quantity } },
      });
      if (decremented.count === 0) {
        shortfall = true;
        await tx.product.updateMany({
          where: { id: item.productId },
          data: { stock: 0 },
        });
      }
    }
    if (shortfall) {
      await tx.order.update({ where: { id: order.id }, data: { stockShortfall: true } });
    }

    if (order.discountCodeId) {
      await tx.discountCode.update({
        where: { id: order.discountCodeId },
        data: { usedCount: { increment: 1 } },
      });
    }

    await tx.orderEvent.create({
      data: {
        orderId: order.id,
        type: "payment_received",
        message:
          `Payment received (PayFast ref ${input.paymentReference}).` +
          (previousStatus === "CANCELLED"
            ? " Order had been cancelled; reinstated because payment arrived."
            : "") +
          (shortfall ? " WARNING: stock was insufficient; check the order." : ""),
      },
    });

    return { applied: true as const, orderId: order.id, stockShortfall: shortfall };
  });

  if (result.applied) {
    console.info(
      JSON.stringify({
        event: "payment.applied",
        order: input.orderNumber,
        stockShortfall: result.stockShortfall,
      }),
    );
    // Emails never break payment processing (Phase 6 implements the sending).
    await notifyOrderPaid(result.orderId, result.stockShortfall);
  }
  return result;
}
