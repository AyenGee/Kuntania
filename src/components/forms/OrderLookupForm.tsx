"use client";

import { useActionState } from "react";
import { lookupOrder, type OrderStatusState } from "@/app/(site)/order-status/actions";
import { Field, Honeypot, SubmitButton } from "./Field";
import { FormAlert } from "./FormAlert";

const initial: OrderStatusState = { ok: false };

export function OrderLookupForm() {
  const [state, action, pending] = useActionState(lookupOrder, initial);
  const errors = state.fieldErrors ?? {};
  const v = state.values ?? {};
  const result = state.result;

  return (
    <div className="space-y-8">
      <form action={action} className="relative space-y-4" noValidate>
        <Honeypot />
        <FormAlert message={state.message} className="text-danger" />
        <Field
          id="orderNumber"
          label="Order number"
          required
          placeholder="KN-10042"
          autoComplete="off"
          defaultValue={v.orderNumber}
          error={errors.orderNumber}
        />
        <Field
          id="email"
          label="Email used for the order"
          type="email"
          required
          autoComplete="email"
          defaultValue={v.email}
          error={errors.email}
        />
        <SubmitButton pending={pending}>Check order</SubmitButton>
      </form>

      {result && (
        <section
          aria-labelledby="order-result"
          className="space-y-3 rounded-card border border-line bg-surface-muted p-5"
        >
          <h2 id="order-result" className="text-xl font-semibold">
            Order {result.orderNumber}
          </h2>
          <p>
            Status: <strong>{result.statusLabel}</strong>
          </p>
          <p className="text-sm text-ink-muted">Placed on {result.placedOn}</p>
          <ul className="list-disc pl-5">
            {result.items.map((i) => (
              <li key={i.name}>
                {i.name} × {i.quantity}
              </li>
            ))}
          </ul>
          {(result.courierName || result.trackingNumber) && (
            <p>
              Courier: {result.courierName ?? "TBC"}
              {result.trackingNumber && <> · Tracking number: {result.trackingNumber}</>}
              {result.trackingUrl && (
                <>
                  {" "}
                  ·{" "}
                  <a
                    href={result.trackingUrl}
                    rel="noopener noreferrer"
                    target="_blank"
                    className="underline"
                  >
                    Track your parcel
                  </a>
                </>
              )}
            </p>
          )}
        </section>
      )}
    </div>
  );
}
