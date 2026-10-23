import { getEnv } from "@/lib/env";
import { createYocoProvider, yocoModeOf } from "./yoco";
import type { PaymentProvider } from "./types";

export class PaymentsNotConfiguredError extends Error {
  constructor() {
    super("Payments are not configured (YOCO_SECRET_KEY).");
  }
}

/** The active payment provider (Yoco). Throws PaymentsNotConfiguredError if the key is missing. */
export function getPaymentProvider(): PaymentProvider {
  const env = getEnv();
  if (!env.YOCO_SECRET_KEY) throw new PaymentsNotConfiguredError();
  return createYocoProvider({
    secretKey: env.YOCO_SECRET_KEY,
    siteUrl: env.SITE_URL,
    // The override is only honoured with a test key, so it can't redirect live payments.
    apiUrl: yocoModeOf(env.YOCO_SECRET_KEY) === "test" ? env.YOCO_API_URL : undefined,
  });
}

export type { PayableOrder, PaymentProvider, PaymentRedirect } from "./types";
