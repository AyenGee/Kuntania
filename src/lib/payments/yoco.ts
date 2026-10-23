import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import type { PayableOrder, PaymentProvider, PaymentRedirect } from "./types";

/**
 * Yoco Checkout API (https://developer.yoco.com/api-reference/checkout-api).
 *
 *  - We create a checkout for the order total and send the customer to its `redirectUrl`.
 *  - Yoco tells us the result with a signed webhook (Standard Webhooks): the signed content is
 *    `<webhook-id>.<webhook-timestamp>.<raw body>`, HMAC-SHA256 with the base64-decoded
 *    `whsec_` secret, base64-encoded, sent as `v1,<signature>` (several may be listed).
 *  - The customer returning to our site proves nothing; only the verified webhook marks paid.
 */

export const YOCO_API_URL = "https://payments.yoco.com/api";

/** How far the webhook timestamp may drift from our clock (Yoco recommends up to 3 minutes). */
export const WEBHOOK_TOLERANCE_SECONDS = 180;

export type YocoMode = "test" | "live";

/** Test keys start with sk_test_, live keys with sk_live_. */
export function yocoModeOf(secretKey: string): YocoMode {
  return secretKey.startsWith("sk_test_") ? "test" : "live";
}

export function verifyWebhookSignature(input: {
  id: string | null;
  timestamp: string | null;
  signatureHeader: string | null;
  body: string;
  secret: string;
  /** Unix seconds; injectable for tests. */
  now?: number;
}): boolean {
  const { id, timestamp, signatureHeader, body, secret } = input;
  if (!id || !timestamp || !signatureHeader) return false;

  const ts = Number(timestamp);
  const now = input.now ?? Math.floor(Date.now() / 1000);
  if (!Number.isFinite(ts) || Math.abs(now - ts) > WEBHOOK_TOLERANCE_SECONDS)
    return false;

  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = Buffer.from(
    createHmac("sha256", key).update(`${id}.${timestamp}.${body}`).digest("base64"),
  );

  return signatureHeader.split(" ").some((entry) => {
    const [version, signature] = entry.split(",");
    if (version !== "v1" || !signature) return false;
    const given = Buffer.from(signature);
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
}

const eventSchema = z.object({
  id: z.string().optional(),
  type: z.string(),
  payload: z.object({
    id: z.string().min(1),
    amount: z.number().int(),
    currency: z.string(),
    status: z.string().optional(),
    mode: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).default({}),
  }),
});

export type YocoEvent = z.infer<typeof eventSchema>;

/** Parse a webhook body. Returns null if it isn't a payment event we understand. */
export function parseYocoEvent(body: string): YocoEvent | null {
  try {
    const parsed = eventSchema.safeParse(JSON.parse(body));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export type PaymentCheck = { ok: true } | { ok: false; reason: string };

/**
 * Checks on a payment.succeeded event against the order it claims to pay for. Nothing here
 * changes state: the caller marks the order paid only on `ok: true`.
 */
export function checkSucceededPayment(
  event: YocoEvent,
  order: { totalCents: number },
  expectedMode: YocoMode,
): PaymentCheck {
  const p = event.payload;
  if (p.status && p.status !== "succeeded")
    return { ok: false, reason: "status_not_succeeded" };
  if (p.currency !== "ZAR") return { ok: false, reason: "wrong_currency" };
  if (p.amount !== order.totalCents) return { ok: false, reason: "amount_mismatch" };
  // A test-mode payment must never mark a real order paid (and vice versa).
  if (p.mode && p.mode !== expectedMode) return { ok: false, reason: "mode_mismatch" };
  return { ok: true };
}

const checkoutResponse = z.object({
  id: z.string().min(1),
  redirectUrl: z.url(),
});

export function createYocoProvider(config: {
  secretKey: string;
  siteUrl: string;
  /** TEST ONLY: replaces Yoco's API address (the end-to-end test stands in for Yoco). */
  apiUrl?: string;
}): PaymentProvider {
  const apiUrl = config.apiUrl ?? YOCO_API_URL;

  return {
    id: "yoco",
    async createPayment(order: PayableOrder): Promise<PaymentRedirect> {
      const orderRef = encodeURIComponent(order.orderNumber);
      const response = await fetch(`${apiUrl}/checkouts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.secretKey}`,
          "Content-Type": "application/json",
          // A retried request for the same order returns the same checkout.
          "Idempotency-Key": `kunta-nia-${order.orderNumber}`,
        },
        body: JSON.stringify({
          amount: order.totalCents,
          currency: "ZAR",
          successUrl: `${config.siteUrl}/checkout/success?order=${orderRef}`,
          cancelUrl: `${config.siteUrl}/checkout/cancelled?order=${orderRef}`,
          failureUrl: `${config.siteUrl}/checkout/cancelled?order=${orderRef}`,
          externalId: order.orderNumber,
          clientReferenceId: order.orderNumber,
          metadata: { orderNumber: order.orderNumber },
        }),
        signal: AbortSignal.timeout(15_000),
        cache: "no-store",
      });
      if (!response.ok) {
        // Never include the response body or key in errors that may be logged.
        throw new Error(`Yoco checkout was refused (HTTP ${response.status})`);
      }
      const data = checkoutResponse.parse(await response.json());
      return { url: data.redirectUrl, checkoutId: data.id };
    },
  };
}
