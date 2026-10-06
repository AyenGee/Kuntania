import { store } from "@content/site";
import { getDb } from "@/lib/db";

/**
 * Cancel PENDING_PAYMENT orders older than the configured expiry (default 48 hours).
 * Safe against a payment arriving at the same moment: the cancel is a conditional update on
 * status, and a late COMPLETE payment re-opens a cancelled order (see applyCompletedPayment).
 */
export async function cancelStalePendingOrders(
  now: Date = new Date(),
  expiryHours: number = store.pendingOrderExpiryHours,
): Promise<number> {
  const cutoff = new Date(now.getTime() - expiryHours * 60 * 60 * 1000);
  const db = getDb();

  const stale = await db.order.findMany({
    where: { status: "PENDING_PAYMENT", createdAt: { lt: cutoff } },
    select: { id: true },
  });
  if (stale.length === 0) return 0;

  return db.$transaction(async (tx) => {
    const result = await tx.order.updateMany({
      where: { id: { in: stale.map((o) => o.id) }, status: "PENDING_PAYMENT" },
      data: { status: "CANCELLED" },
    });
    await tx.orderEvent.createMany({
      data: stale.map((o) => ({
        orderId: o.id,
        type: "auto_cancelled",
        message: `Cancelled automatically: no payment received within ${expiryHours} hours.`,
      })),
    });
    return result.count;
  });
}
