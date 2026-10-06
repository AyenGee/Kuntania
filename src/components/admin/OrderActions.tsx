"use client";

import { useActionState } from "react";
import { orderAction } from "@/app/admin/(protected)/orders/[id]/actions";
import { Field } from "@/components/forms/Field";
import { canTransition } from "@/lib/admin/order-transitions";
import type { OrderStatusValue } from "@/lib/order-status";
import type { FormState } from "@/lib/validation/forms";
import { Card, buttonClass, dangerButtonClass, secondaryButtonClass } from "./ui";

const initial: FormState = { ok: false };

function IntentButton({
  orderId,
  intent,
  label,
  className,
  confirm,
  pending,
  action,
}: {
  action: (formData: FormData) => void;
  orderId: string;
  intent: string;
  label: string;
  className: string;
  confirm?: string;
  pending: boolean;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="intent" value={intent} />
      <button type="submit" disabled={pending} className={className}>
        {label}
      </button>
    </form>
  );
}

export function OrderActions({
  orderId,
  status,
  adminNotes,
}: {
  orderId: string;
  status: OrderStatusValue;
  adminNotes: string | null;
}) {
  const [state, action, pending] = useActionState(orderAction, initial);
  const can = (to: OrderStatusValue) => canTransition(status, to);
  const errors = state.fieldErrors ?? {};

  return (
    <div className="space-y-4">
      <div aria-live="polite">
        {state.message && (
          <p
            role={state.ok ? "status" : "alert"}
            className={`rounded-control border-2 p-3 ${state.ok ? "border-success" : "border-danger text-danger"}`}
          >
            {state.message}
          </p>
        )}
      </div>

      <Card title="Update this order">
        <div className="flex flex-wrap gap-3">
          {can("PROCESSING") && (
            <IntentButton
              action={action}
              orderId={orderId}
              intent="processing"
              label="Mark as processing"
              className={secondaryButtonClass}
              pending={pending}
            />
          )}
          {can("DELIVERED") && (
            <IntentButton
              action={action}
              orderId={orderId}
              intent="delivered"
              label="Mark as delivered"
              className={buttonClass}
              pending={pending}
            />
          )}
          {can("REFUNDED") && (
            <IntentButton
              action={action}
              orderId={orderId}
              intent="refund"
              label="Mark as refunded"
              className={dangerButtonClass}
              confirm="Record this order as refunded and email the customer? This only records it: you still have to make the refund in the PayFast dashboard."
              pending={pending}
            />
          )}
          {can("CANCELLED") && (
            <IntentButton
              action={action}
              orderId={orderId}
              intent="cancel"
              label="Cancel order"
              className={dangerButtonClass}
              confirm="Cancel this order? This can't be undone."
              pending={pending}
            />
          )}
          {!can("PROCESSING") &&
            !can("DELIVERED") &&
            !can("REFUNDED") &&
            !can("CANCELLED") &&
            !can("SHIPPED") && (
              <p className="text-ink-muted">
                No further actions: this order is finished.
              </p>
            )}
        </div>
      </Card>

      {can("SHIPPED") && (
        <Card title="Mark as shipped">
          <form action={action} className="space-y-3">
            <input type="hidden" name="orderId" value={orderId} />
            <input type="hidden" name="intent" value="ship" />
            <Field
              id="courierName"
              label="Courier"
              required
              placeholder="e.g. The Courier Guy"
              error={errors.courierName}
            />
            <Field
              id="trackingNumber"
              label="Tracking number"
              error={errors.trackingNumber}
            />
            <Field
              id="trackingUrl"
              label="Tracking link (optional)"
              type="url"
              placeholder="https://"
              error={errors.trackingUrl}
            />
            <p className="text-sm text-ink-muted">
              The customer is emailed these details straight away.
            </p>
            <button type="submit" disabled={pending} className={buttonClass}>
              Mark as shipped and email customer
            </button>
          </form>
        </Card>
      )}

      <Card title="Notes (only you can see these)">
        <form action={action} className="space-y-3">
          <input type="hidden" name="orderId" value={orderId} />
          <input type="hidden" name="intent" value="notes" />
          <label htmlFor="adminNotes" className="sr-only">
            Admin notes
          </label>
          <textarea
            id="adminNotes"
            name="adminNotes"
            rows={4}
            defaultValue={adminNotes ?? ""}
            className="w-full rounded-control border border-control bg-surface px-3 py-2"
          />
          <button type="submit" disabled={pending} className={secondaryButtonClass}>
            Save notes
          </button>
        </form>
      </Card>

      {status !== "PENDING_PAYMENT" && (
        <IntentButton
          action={action}
          orderId={orderId}
          intent="resend"
          label="Resend order confirmation email"
          className={secondaryButtonClass}
          pending={pending}
        />
      )}
    </div>
  );
}
