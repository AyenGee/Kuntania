"use client";

import { useEffect, useRef } from "react";
import type { PaymentRedirect } from "@/lib/payments/types";

/**
 * Sends the customer to the payment provider's page. A visible link is the fallback if
 * scripts are blocked.
 */
export function PaymentRedirectForm({ payment }: { payment: PaymentRedirect }) {
  const redirected = useRef(false);

  useEffect(() => {
    if (redirected.current) return; // never redirect twice (Strict Mode / re-renders)
    redirected.current = true;
    window.location.assign(payment.url);
  }, [payment.url]);

  return (
    <div role="status" className="mx-auto max-w-xl py-8 text-center">
      <h2 className="text-2xl font-semibold">Taking you to secure payment…</h2>
      <p className="mt-2 text-ink-muted">
        Please don&rsquo;t close this page. If nothing happens, use the button below.
      </p>
      <a
        href={payment.url}
        className="mt-6 inline-block rounded-control bg-brand px-6 py-3 font-medium text-brand-contrast"
      >
        Continue to payment
      </a>
    </div>
  );
}
