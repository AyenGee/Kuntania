import { getDb } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { applyCompletedPayment } from "@/lib/payments/apply-payment";
import { verifyItn } from "@/lib/payments/itn";
import { confirmWithPayfast, resolvePayfastIps } from "@/lib/payments/payfast-io";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 20_000;

function log(event: string, extra: Record<string, unknown> = {}) {
  console.info(JSON.stringify({ event, ...extra }));
}

/**
 * PayFast Instant Transaction Notification (ITN). This is the ONLY code path that marks an
 * order paid. Flow: log the raw payload -> verify (signature, source host, amount, PayFast
 * server confirmation) -> if COMPLETE, mark paid idempotently.
 *
 * Responses: 200 once the notification has been recorded and handled (including when it was
 * rejected as invalid, so PayFast stops retrying); 5xx only for transient problems
 * (database or PayFast unreachable) so PayFast retries later.
 */
export async function POST(request: Request): Promise<Response> {
  const body = await request.text();
  if (body.length > MAX_BODY_BYTES) return new Response("Too large", { status: 413 });

  const pairs = [...new URLSearchParams(body).entries()] as [string, string][];
  const fields = Object.fromEntries(pairs);
  const db = getDb();

  let notificationId: string;
  try {
    const row = await db.paymentNotification.create({
      data: { provider: "payfast", rawPayload: fields },
      select: { id: true },
    });
    notificationId = row.id;
  } catch (error) {
    log("itn.log_failed", { error: String(error) });
    return new Response("Temporary error", { status: 503 });
  }

  const finish = (data: {
    verified?: boolean;
    failureReason?: string;
    orderId?: string;
  }) => db.paymentNotification.update({ where: { id: notificationId }, data });

  try {
    const env = getEnv();
    if (!env.PAYFAST_MERCHANT_ID) {
      await finish({ failureReason: "payments_not_configured" });
      log("itn.rejected", { reason: "payments_not_configured" });
      return new Response("Not configured", { status: 503 });
    }

    const orderNumber = fields.m_payment_id ?? "";
    const order = orderNumber
      ? await db.order.findUnique({
          where: { orderNumber },
          select: { id: true, totalCents: true },
        })
      : null;

    const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const sourceIp = forwarded || request.headers.get("x-real-ip") || "unknown";

    const verification = await verifyItn(
      pairs,
      sourceIp,
      {
        mode: env.PAYFAST_MODE,
        merchantId: env.PAYFAST_MERCHANT_ID,
        passphrase: env.PAYFAST_PASSPHRASE,
      },
      {
        resolveValidIps: resolvePayfastIps,
        getExpectedAmountCents: async () => order?.totalCents ?? null,
        confirmWithPayfast: (b) => confirmWithPayfast(env.PAYFAST_MODE, b),
      },
    );

    if (!verification.ok) {
      await finish({ failureReason: verification.reason, orderId: order?.id });
      if (order) {
        await db.orderEvent.create({
          data: {
            orderId: order.id,
            type: "payment_rejected",
            message: `Payment notification rejected (${verification.reason}). Check PayFast before shipping.`,
          },
        });
      }
      // Never log payload contents: only the reason and order reference.
      log("itn.rejected", { reason: verification.reason, order: orderNumber });
      return new Response("OK", { status: 200 });
    }

    const status = verification.fields.payment_status;
    if (status !== "COMPLETE") {
      await finish({
        verified: true,
        failureReason: `status:${status}`,
        orderId: order?.id,
      });
      if (order && (status === "FAILED" || status === "CANCELLED")) {
        await db.orderEvent.create({
          data: {
            orderId: order.id,
            type: `payment_${status.toLowerCase()}`,
            message: `PayFast reported the payment as ${status}.`,
          },
        });
      }
      log("itn.non_complete", { status, order: orderNumber });
      return new Response("OK", { status: 200 });
    }

    await finish({ verified: true, orderId: order?.id });
    const result = await applyCompletedPayment({
      orderNumber,
      paymentReference: verification.fields.pf_payment_id ?? "",
    });
    log("itn.processed", { order: orderNumber, applied: result.applied });
    return new Response("OK", { status: 200 });
  } catch (error) {
    // Transient failure: record it and let PayFast retry.
    const message = error instanceof Error ? error.message : String(error);
    log("itn.error", { error: message });
    await finish({ failureReason: `error:${message}`.slice(0, 300) }).catch(() => {});
    return new Response("Temporary error", { status: 503 });
  }
}
