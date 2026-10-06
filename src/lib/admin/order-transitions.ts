import type { OrderStatusValue } from "@/lib/order-status";

/**
 * Which status changes the admin may make. Anything not listed is refused server-side.
 * PENDING_PAYMENT can only become PAID through a verified payment notification (never manually).
 * CANCELLED and REFUNDED are final.
 */
export const ALLOWED_TRANSITIONS: Record<OrderStatusValue, readonly OrderStatusValue[]> =
  {
    PENDING_PAYMENT: ["CANCELLED"],
    PAID: ["PROCESSING", "SHIPPED", "CANCELLED", "REFUNDED"],
    PROCESSING: ["SHIPPED", "CANCELLED", "REFUNDED"],
    SHIPPED: ["DELIVERED", "REFUNDED"],
    DELIVERED: ["REFUNDED"],
    CANCELLED: [],
    REFUNDED: [],
  };

export function canTransition(from: OrderStatusValue, to: OrderStatusValue): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

/** Statuses where the goods were paid for and are still in the owner's hands. */
export const UNSHIPPED_PAID_STATUSES: readonly OrderStatusValue[] = [
  "PAID",
  "PROCESSING",
];

/** Paid orders that count towards revenue (a refund or cancellation removes revenue). */
export const REVENUE_STATUSES: readonly OrderStatusValue[] = [
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
];

/** Orders waiting for the owner to ship. */
export const NEEDS_ACTION_STATUSES: readonly OrderStatusValue[] = ["PAID", "PROCESSING"];
