import { getDb } from "@/lib/db";
import { getEnv } from "@/lib/env";
import {
  orderCancelledOrRefundedEmail,
  orderConfirmationEmail,
  orderShippedEmail,
  ownerNewOrderEmail,
  type OrderEmailData,
} from "./order-templates";
import { sendMail, type MailInput } from "./send";

/**
 * Order emails: load the order, build the message, send it, and record the outcome in the
 * order's event log ("emails sent" audit trail). Every function here NEVER throws: an email
 * problem must never break payment processing or an admin action. Each returns true only if
 * the email was actually sent.
 */

async function loadOrder(orderId: string): Promise<OrderEmailData | null> {
  const o = await getDb().order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!o) return null;
  return {
    id: o.id,
    orderNumber: o.orderNumber,
    email: o.email,
    firstName: o.firstName,
    lastName: o.lastName,
    phone: o.phone,
    addressLine1: o.addressLine1,
    addressLine2: o.addressLine2,
    suburb: o.suburb,
    city: o.city,
    province: o.province,
    postalCode: o.postalCode,
    deliveryMethod: o.deliveryMethod,
    deliveryNotes: o.deliveryNotes,
    items: o.items.map((i) => ({
      name: i.productNameSnapshot,
      size: i.sizeSnapshot,
      quantity: i.quantity,
      lineTotalCents: i.lineTotalCents,
    })),
    subtotalCents: o.subtotalCents,
    discountCents: o.discountCents,
    shippingCents: o.shippingCents,
    totalCents: o.totalCents,
    vatIncludedCents: o.vatIncludedCents,
    courierName: o.courierName,
    trackingNumber: o.trackingNumber,
    trackingUrl: o.trackingUrl,
    stockShortfall: o.stockShortfall,
  };
}

async function recordEmailEvent(
  orderId: string,
  label: string,
  sent: boolean,
): Promise<void> {
  try {
    await getDb().orderEvent.create({
      data: {
        orderId,
        type: sent ? "email_sent" : "email_failed",
        message: sent ? `Email sent: ${label}.` : `Email FAILED to send: ${label}.`,
      },
    });
  } catch {
    // the audit entry is best-effort
  }
}

async function deliver(
  orderId: string,
  label: string,
  build: (order: OrderEmailData, env: ReturnType<typeof getEnv>) => MailInput | null,
): Promise<boolean> {
  try {
    const order = await loadOrder(orderId);
    if (!order) return false;
    const mail = build(order, getEnv());
    if (!mail) return false;
    const sent = await sendMail(mail);
    await recordEmailEvent(orderId, label, sent);
    return sent;
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "email.order_failed",
        label,
        error: error instanceof Error ? error.message : String(error),
      }),
    );
    await recordEmailEvent(orderId, label, false);
    return false;
  }
}

/** Customer order confirmation. Also used by the admin "resend confirmation" button. */
export function sendOrderConfirmation(orderId: string): Promise<boolean> {
  return deliver(orderId, "order confirmation to customer", (o, env) =>
    orderConfirmationEmail(o, { siteUrl: env.SITE_URL, replyTo: env.OWNER_EMAIL }),
  );
}

/** New-order alert to the owner (loudly flags stock shortfalls). */
export function sendOwnerNewOrderAlert(orderId: string): Promise<boolean> {
  return deliver(orderId, "new-order alert to owner", (o, env) =>
    env.OWNER_EMAIL
      ? ownerNewOrderEmail(o, { siteUrl: env.SITE_URL, ownerEmail: env.OWNER_EMAIL })
      : null,
  );
}

/** "Your order has shipped" with courier and tracking. */
export function sendShippedEmail(orderId: string): Promise<boolean> {
  return deliver(orderId, "shipping notification to customer", (o, env) =>
    orderShippedEmail(o, { siteUrl: env.SITE_URL, replyTo: env.OWNER_EMAIL }),
  );
}

/** Order cancelled / refunded notice to the customer. */
export function sendCancelledOrRefundedEmail(
  orderId: string,
  kind: "cancelled" | "refunded",
): Promise<boolean> {
  return deliver(orderId, `${kind} notice to customer`, (o, env) =>
    orderCancelledOrRefundedEmail(o, kind, { replyTo: env.OWNER_EMAIL }),
  );
}
