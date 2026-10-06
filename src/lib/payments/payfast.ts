import { createHash, timingSafeEqual } from "node:crypto";
import { centsToDecimalString } from "@/lib/money";
import type { PayableOrder, PaymentProvider, PaymentRedirect } from "./types";

/**
 * PayFast (https://developers.payfast.co.za) custom integration.
 *
 * Signature rules (matching PayFast's reference behaviour):
 *  - values are trimmed and URL-encoded the way PHP's urlencode() does (spaces -> "+",
 *    everything except letters, digits and "-_." percent-encoded with UPPERCASE hex);
 *  - payment request: fields in the order they are sent, blank values left out;
 *  - ITN: fields in the order received (blank values included), "signature" excluded;
 *  - if a passphrase is set, "passphrase=<encoded>" is appended last; then MD5 (lowercase hex).
 */

export type PayfastMode = "sandbox" | "live";

export const PAYFAST_PROCESS_URL: Record<PayfastMode, string> = {
  live: "https://www.payfast.co.za/eng/process",
  sandbox: "https://sandbox.payfast.co.za/eng/process",
};

export const PAYFAST_VALIDATE_URL: Record<PayfastMode, string> = {
  live: "https://www.payfast.co.za/eng/query/validate",
  sandbox: "https://sandbox.payfast.co.za/eng/query/validate",
};

/** Hostnames ITN requests may legitimately come from. */
export const PAYFAST_VALID_HOSTS = [
  "www.payfast.co.za",
  "sandbox.payfast.co.za",
  "w1w.payfast.co.za",
  "w2w.payfast.co.za",
] as const;

/** PHP-compatible urlencode(): JS encodeURIComponent leaves !'()*~ alone, PHP does not. */
export function phpUrlencode(value: string): string {
  return encodeURIComponent(value)
    .replace(/[!'()*~]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)
    .replace(/%20/g, "+");
}

export type Pair = readonly [string, string];

function toParamString(pairs: readonly Pair[], passphrase?: string): string {
  const parts = pairs.map(([k, v]) => `${k}=${phpUrlencode(v.trim())}`);
  if (passphrase) parts.push(`passphrase=${phpUrlencode(passphrase.trim())}`);
  return parts.join("&");
}

function md5(input: string): string {
  return createHash("md5").update(input).digest("hex");
}

/** Signature for an outgoing payment request. Blank values are omitted. */
export function signPayment(pairs: readonly Pair[], passphrase?: string): string {
  return md5(
    toParamString(
      pairs.filter(([, v]) => v.trim() !== ""),
      passphrase,
    ),
  );
}

/** Expected signature for a received ITN (all fields in received order, minus "signature"). */
export function expectedItnSignature(
  pairs: readonly Pair[],
  passphrase?: string,
): string {
  return md5(
    toParamString(
      pairs.filter(([k]) => k !== "signature"),
      passphrase,
    ),
  );
}

/** Constant-time comparison of two hex signatures. */
export function signaturesMatch(received: string | undefined, expected: string): boolean {
  if (!received) return false;
  const a = Buffer.from(received.toLowerCase());
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Parse a PayFast decimal amount ("123.45") to integer cents without using floats. */
export function parseAmountToCents(value: string | undefined): number | null {
  if (!value) return null;
  const m = /^(\d{1,9})(?:\.(\d{1,2}))?$/.exec(value.trim());
  if (!m) return null;
  return Number(m[1]) * 100 + Number((m[2] ?? "").padEnd(2, "0"));
}

/** The body PayFast expects when we confirm an ITN with its server (no signature, no passphrase). */
export function validationBody(pairs: readonly Pair[]): string {
  return toParamString(pairs.filter(([k]) => k !== "signature"));
}

export function isValidSourceIp(ip: string, validIps: readonly string[]): boolean {
  return validIps.includes(ip.trim());
}

export type PayfastConfig = {
  mode: PayfastMode;
  merchantId: string;
  merchantKey: string;
  passphrase?: string;
  siteUrl: string;
};

/** Build the signed form fields that send the customer to PayFast. */
export function buildPayfastRedirect(
  order: PayableOrder,
  cfg: PayfastConfig,
): PaymentRedirect {
  const site = cfg.siteUrl.replace(/\/+$/, "");
  const orderRef = encodeURIComponent(order.orderNumber);
  // Order matters: this is the order the signature is computed in.
  const pairs: Pair[] = [
    ["merchant_id", cfg.merchantId],
    ["merchant_key", cfg.merchantKey],
    ["return_url", `${site}/checkout/success?order=${orderRef}`],
    ["cancel_url", `${site}/checkout/cancelled?order=${orderRef}`],
    ["notify_url", `${site}/api/payments/payfast/notify`],
    ["name_first", order.firstName.slice(0, 100)],
    ["name_last", order.lastName.slice(0, 100)],
    ["email_address", order.email],
    ["m_payment_id", order.orderNumber],
    ["amount", centsToDecimalString(order.totalCents)],
    ["item_name", `Kunta Nia order ${order.orderNumber}`.slice(0, 100)],
  ];
  const fields: Record<string, string> = {};
  for (const [k, v] of pairs) if (v.trim() !== "") fields[k] = v.trim();
  // Insertion order is preserved, and "signature" must come last.
  fields.signature = signPayment(pairs, cfg.passphrase);
  return { method: "POST", url: PAYFAST_PROCESS_URL[cfg.mode], fields };
}

export function createPayfastProvider(cfg: PayfastConfig): PaymentProvider {
  return {
    id: "payfast",
    createPayment: (order) => buildPayfastRedirect(order, cfg),
  };
}
