import { getEnv } from "@/lib/env";
import { createPayfastProvider } from "./payfast";
import type { PaymentProvider } from "./types";

export class PaymentsNotConfiguredError extends Error {
  constructor() {
    super("Payments are not configured (PAYFAST_MERCHANT_ID / PAYFAST_MERCHANT_KEY).");
  }
}

/** The active payment provider (PayFast). Throws PaymentsNotConfiguredError if keys are missing. */
export function getPaymentProvider(): PaymentProvider {
  const env = getEnv();
  if (!env.PAYFAST_MERCHANT_ID || !env.PAYFAST_MERCHANT_KEY) {
    throw new PaymentsNotConfiguredError();
  }
  return createPayfastProvider({
    mode: env.PAYFAST_MODE,
    merchantId: env.PAYFAST_MERCHANT_ID,
    merchantKey: env.PAYFAST_MERCHANT_KEY,
    passphrase: env.PAYFAST_PASSPHRASE,
    siteUrl: env.SITE_URL,
  });
}

export type { PayableOrder, PaymentProvider, PaymentRedirect } from "./types";
