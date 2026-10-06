/**
 * Hook called once, after an order has been marked PAID.
 * Phase 6 sends the customer confirmation and the owner alert from here
 * (and flags stock shortfalls to the owner). It must never throw.
 */
export async function notifyOrderPaid(
  orderId: string,
  stockShortfall: boolean,
): Promise<void> {
  try {
    console.info(
      JSON.stringify({ event: "payment.notify_pending_phase6", orderId, stockShortfall }),
    );
  } catch {
    // never let notification problems affect payment processing
  }
}
