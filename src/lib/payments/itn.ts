import {
  expectedItnSignature,
  isValidSourceIp,
  parseAmountToCents,
  signaturesMatch,
  validationBody,
  type Pair,
  type PayfastMode,
} from "./payfast";

export type ItnConfig = {
  mode: PayfastMode;
  merchantId: string;
  passphrase?: string;
};

/** IO the verification needs, injected so the logic is testable without the network or DB. */
export type ItnDeps = {
  /** IPs that PayFast's hostnames currently resolve to. */
  resolveValidIps: () => Promise<string[]>;
  /** The order total in cents for an order number, or null if there is no such order. */
  getExpectedAmountCents: (orderNumber: string) => Promise<number | null>;
  /** POST the ITN back to PayFast's validate endpoint; true only if it answers VALID. */
  confirmWithPayfast: (body: string) => Promise<boolean>;
};

export type ItnVerification =
  | { ok: true; fields: Record<string, string>; amountCents: number }
  | { ok: false; reason: string };

/**
 * The four PayFast ITN security checks, in order, plus a merchant-id sanity check.
 * Nothing here changes any state: the caller only marks an order paid on `ok: true`
 * AND payment_status === "COMPLETE".
 *
 *  1. signature matches (with the passphrase)
 *  2. request comes from a valid PayFast host (live mode; sandbox ITNs come from other IPs)
 *  3. the amount matches the order total exactly (integer cents)
 *  4. PayFast's own server confirms the data is valid
 */
export async function verifyItn(
  pairs: readonly Pair[],
  sourceIp: string,
  cfg: ItnConfig,
  deps: ItnDeps,
): Promise<ItnVerification> {
  const fields: Record<string, string> = {};
  for (const [k, v] of pairs) fields[k] = v;

  if (!signaturesMatch(fields.signature, expectedItnSignature(pairs, cfg.passphrase))) {
    return { ok: false, reason: "invalid_signature" };
  }

  if (cfg.mode === "live") {
    const validIps = await deps.resolveValidIps();
    if (!isValidSourceIp(sourceIp, validIps)) {
      return { ok: false, reason: "invalid_source_ip" };
    }
  }

  if (fields.merchant_id !== cfg.merchantId) {
    return { ok: false, reason: "merchant_mismatch" };
  }

  const orderNumber = fields.m_payment_id;
  if (!orderNumber) return { ok: false, reason: "missing_order_reference" };

  const expected = await deps.getExpectedAmountCents(orderNumber);
  if (expected === null) return { ok: false, reason: "unknown_order" };

  const amountCents = parseAmountToCents(fields.amount_gross);
  if (amountCents === null || amountCents !== expected) {
    return { ok: false, reason: "amount_mismatch" };
  }

  if (!(await deps.confirmWithPayfast(validationBody(pairs)))) {
    return { ok: false, reason: "server_validation_failed" };
  }

  return { ok: true, fields, amountCents };
}
