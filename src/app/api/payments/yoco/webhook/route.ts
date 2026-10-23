import { getDb } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { applyCompletedPayment } from "@/lib/payments/apply-payment";
import {
  checkSucceededPayment,
  parseYocoEvent,
  verifyWebhookSignature,
  yocoModeOf,
} from "@/lib/payments/yoco";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 20_000;

function log(event: string, extra: Record<string, unknown> = {}) {
  console.info(JSON.stringify({ event, ...extra }));
}

/**
 * Yoco payment webhook. This is the ONLY code path that marks an order paid. Flow: check the
 * signature (nothing is stored for unsigned requests) -> log the payload -> find the order ->
 * check amount, currency and test/live mode -> mark paid idempotently.
 *
 * Responses: 200 once the event has been recorded and handled (including when it was rejected
 * as not matching an order, so Yoco stops retrying); 401 for a bad signature; 5xx only for
 * transient problems (database) so Yoco retries later.
 */
export async function POST(request: Request): Promise<Response> {
  const body = await request.text();
  if (body.length > MAX_BODY_BYTES) return new Response("Too large", { status: 413 });

  const env = getEnv();
  if (!env.YOCO_SECRET_KEY || !env.YOCO_WEBHOOK_SECRET) {
    log("yoco.rejected", { reason: "payments_not_configured" });
    return new Response("Not configured", { status: 503 });
  }

  const signed = verifyWebhookSignature({
    id: request.headers.get("webhook-id"),
    timestamp: request.headers.get("webhook-timestamp"),
    signatureHeader: request.headers.get("webhook-signature"),
    body,
    secret: env.YOCO_WEBHOOK_SECRET,
  });
  if (!signed) {
    log("yoco.rejected", { reason: "invalid_signature" });
    return new Response("Invalid signature", { status: 401 });
  }

  const event = parseYocoEvent(body);
  if (!event) {
    log("yoco.ignored", { reason: "unrecognised_payload" });
    return new Response("OK", { status: 200 });
  }

  const db = getDb();
  let notificationId: string;
  try {
    const row = await db.paymentNotification.create({
      data: { provider: "yoco", rawPayload: JSON.parse(body) },
      select: { id: true },
    });
    notificationId = row.id;
  } catch (error) {
    log("yoco.log_failed", { error: String(error) });
    return new Response("Temporary error", { status: 503 });
  }

  const finish = (data: {
    verified?: boolean;
    failureReason?: string;
    orderId?: string;
  }) => db.paymentNotification.update({ where: { id: notificationId }, data });

  try {
    const meta = event.payload.metadata;
    const checkoutId = typeof meta.checkoutId === "string" ? meta.checkoutId : null;
    const orderNumberMeta =
      typeof meta.orderNumber === "string" ? meta.orderNumber : null;

    // Prefer Yoco's own checkout id (stored when we created the checkout).
    const order =
      (checkoutId
        ? await db.order.findFirst({
            where: { paymentCheckoutId: checkoutId },
            select: { id: true, orderNumber: true, totalCents: true },
          })
        : null) ??
      (orderNumberMeta
        ? await db.order.findUnique({
            where: { orderNumber: orderNumberMeta },
            select: { id: true, orderNumber: true, totalCents: true },
          })
        : null);

    if (!order) {
      await finish({ failureReason: "unknown_order" });
      log("yoco.rejected", { reason: "unknown_order", type: event.type });
      return new Response("OK", { status: 200 });
    }

    if (event.type === "payment.failed") {
      await finish({
        verified: true,
        failureReason: "payment_failed",
        orderId: order.id,
      });
      await db.orderEvent.create({
        data: {
          orderId: order.id,
          type: "payment_failed",
          message: "Yoco reported the payment as failed. The customer can try again.",
        },
      });
      log("yoco.payment_failed", { order: order.orderNumber });
      return new Response("OK", { status: 200 });
    }

    if (event.type !== "payment.succeeded") {
      await finish({
        verified: true,
        failureReason: `ignored:${event.type}`,
        orderId: order.id,
      });
      return new Response("OK", { status: 200 });
    }

    const check = checkSucceededPayment(event, order, yocoModeOf(env.YOCO_SECRET_KEY));
    if (!check.ok) {
      await finish({ failureReason: check.reason, orderId: order.id });
      await db.orderEvent.create({
        data: {
          orderId: order.id,
          type: "payment_rejected",
          message: `Payment notification rejected (${check.reason}). Check Yoco before shipping.`,
        },
      });
      // Never log payload contents: only the reason and order reference.
      log("yoco.rejected", { reason: check.reason, order: order.orderNumber });
      return new Response("OK", { status: 200 });
    }

    await finish({ verified: true, orderId: order.id });
    const result = await applyCompletedPayment({
      orderNumber: order.orderNumber,
      paymentReference: event.payload.id,
    });
    log("yoco.processed", { order: order.orderNumber, applied: result.applied });
    return new Response("OK", { status: 200 });
  } catch (error) {
    // Transient failure: record it and let Yoco retry.
    const message = error instanceof Error ? error.message : String(error);
    log("yoco.error", { error: message });
    await finish({ failureReason: `error:${message}`.slice(0, 300) }).catch(() => {});
    return new Response("Temporary error", { status: 503 });
  }
}
