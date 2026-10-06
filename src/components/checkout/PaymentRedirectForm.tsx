"use client";

import { useEffect, useRef } from "react";
import type { PaymentRedirect } from "@/lib/payments/types";

/**
 * Sends the customer to the payment provider by submitting the signed form automatically.
 * A visible button is the fallback if scripts are blocked.
 */
export function PaymentRedirectForm({ payment }: { payment: PaymentRedirect }) {
  const formRef = useRef<HTMLFormElement>(null);
  const submitted = useRef(false);

  useEffect(() => {
    if (submitted.current) return; // never submit twice (Strict Mode / re-renders)
    submitted.current = true;
    formRef.current?.submit();
  }, []);

  return (
    <div role="status" className="mx-auto max-w-xl py-8 text-center">
      <h2 className="text-2xl font-semibold">Taking you to secure payment…</h2>
      <p className="mt-2 text-ink-muted">
        Please don&rsquo;t close this page. If nothing happens, use the button below.
      </p>
      <form ref={formRef} action={payment.url} method={payment.method} className="mt-6">
        {Object.entries(payment.fields).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
        <button
          type="submit"
          className="rounded-control bg-brand px-6 py-3 font-medium text-brand-contrast"
        >
          Continue to payment
        </button>
      </form>
    </div>
  );
}
