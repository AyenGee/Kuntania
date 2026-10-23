import { after } from "next/server";
import { sendOrderConfirmation, sendOwnerNewOrderAlert } from "@/lib/email/order-emails";

async function sendPaidEmails(orderId: string, stockShortfall: boolean): Promise<void> {
  try {
    await Promise.allSettled([
      sendOrderConfirmation(orderId),
      sendOwnerNewOrderAlert(orderId),
    ]);
    if (stockShortfall) {
      console.warn(JSON.stringify({ event: "order.stock_shortfall", orderId }));
    }
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "email.notify_paid_failed",
        error: error instanceof Error ? error.message : String(error),
      }),
    );
  }
}

/**
 * Called once, after an order has been marked PAID: sends the customer confirmation and the
 * owner alert (which flags stock shortfalls).
 *
 * The emails run AFTER the response to Yoco has been sent (Next's `after`), so a slow mail
 * server can never delay or fail the payment notification. Outside a request (for example a
 * script) it simply sends immediately. It never throws; failures are logged and recorded on
 * the order, and the admin can resend the confirmation.
 */
export async function notifyOrderPaid(
  orderId: string,
  stockShortfall: boolean,
): Promise<void> {
  try {
    after(() => sendPaidEmails(orderId, stockShortfall));
  } catch {
    await sendPaidEmails(orderId, stockShortfall);
  }
}
