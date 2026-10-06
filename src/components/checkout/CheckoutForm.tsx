"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useState } from "react";
import { placeOrderAction, type CheckoutState } from "@/app/(site)/checkout/actions";
import { Totals } from "@/components/cart/Totals";
import { Field, Honeypot, SelectField, SubmitButton } from "@/components/forms/Field";
import { formatZar } from "@/lib/money";
import { PROVINCES } from "@/lib/provinces";
import type { ShippingMethod } from "@/lib/shipping";
import { useCart } from "@/lib/use-cart";
import { usePricedCart } from "@/lib/use-priced-cart";
import { PaymentRedirectForm } from "./PaymentRedirectForm";

const initial: CheckoutState = { ok: false };

export function CheckoutForm() {
  const { items, ready } = useCart();
  const [method, setMethod] = useState<ShippingMethod>("COURIER");
  const [codeInput, setCodeInput] = useState("");
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [state, action, pending] = useActionState(
    async (prev: CheckoutState, formData: FormData) => {
      const next = await placeOrderAction(prev, formData);
      // A failed submit may mean stock or prices changed: re-check so the page is current.
      setRefreshKey((k) => k + 1);
      return next;
    },
    initial,
  );
  const {
    state: priced,
    notices,
    dismissNotices,
  } = usePricedCart(items, method, appliedCode, refreshKey);

  // Order created: hand the customer to the payment page (the form must not be re-submitted).
  if (state.ok && state.payment) return <PaymentRedirectForm payment={state.payment} />;

  const errors = state.fieldErrors ?? {};
  const v = state.values ?? {};

  if (!ready) return <p aria-busy="true">Loading checkout…</p>;

  if (items.length === 0) {
    return (
      <div>
        <p>Your cart is empty.</p>
        <Link
          href="/shop"
          className="mt-4 inline-block rounded-control bg-brand px-5 py-2.5 text-brand-contrast"
        >
          Continue shopping
        </Link>
      </div>
    );
  }

  if (priced.status === "error") {
    return (
      <p role="alert" className="text-danger">
        We couldn&rsquo;t load your order just now. Please refresh the page and try again.
      </p>
    );
  }
  if (priced.status === "loading") return <p aria-busy="true">Loading checkout…</p>;

  const { resolution } = priced;
  const methodLabel =
    resolution.shippingOptions.find((o) => o.method === method)?.label ?? "Shipping";
  // Only send the code if the server accepted it.
  const codeToSubmit = resolution.discount ? (appliedCode ?? "") : "";

  return (
    <form
      action={action}
      className="relative grid gap-8 md:grid-cols-[3fr_2fr]"
      noValidate
    >
      <Honeypot />
      <input type="hidden" name="cart" value={JSON.stringify(resolution.effectiveCart)} />
      <input type="hidden" name="discountCode" value={codeToSubmit} />

      <div className="space-y-8">
        {(state.message || notices.length > 0) && (
          <div
            role="alert"
            className="space-y-2 rounded-control border-2 border-danger p-4"
          >
            {state.message && <p>{state.message}</p>}
            {notices.map((n) => (
              <p key={n}>{n}</p>
            ))}
            {notices.length > 0 && (
              <button
                type="button"
                onClick={dismissNotices}
                className="text-sm underline"
              >
                Dismiss
              </button>
            )}
          </div>
        )}

        <fieldset className="space-y-4">
          <legend className="mb-2 text-xl font-semibold">Contact</legend>
          <Field
            id="email"
            label="Email"
            type="email"
            required
            autoComplete="email"
            defaultValue={v.email}
            error={errors.email}
          />
          <Field
            id="phone"
            label="Mobile number"
            type="tel"
            required
            autoComplete="tel"
            hint="South African number, e.g. 082 123 4567"
            defaultValue={v.phone}
            error={errors.phone}
          />
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="mb-2 text-xl font-semibold">Delivery address</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="firstName"
              label="First name"
              required
              autoComplete="given-name"
              defaultValue={v.firstName}
              error={errors.firstName}
            />
            <Field
              id="lastName"
              label="Last name"
              required
              autoComplete="family-name"
              defaultValue={v.lastName}
              error={errors.lastName}
            />
          </div>
          <Field
            id="addressLine1"
            label="Street address"
            required
            autoComplete="address-line1"
            defaultValue={v.addressLine1}
            error={errors.addressLine1}
          />
          <Field
            id="addressLine2"
            label="Apartment, complex or building (optional)"
            autoComplete="address-line2"
            defaultValue={v.addressLine2}
            error={errors.addressLine2}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="suburb"
              label="Suburb"
              required
              autoComplete="address-level3"
              defaultValue={v.suburb}
              error={errors.suburb}
            />
            <Field
              id="city"
              label="City / town"
              required
              autoComplete="address-level2"
              defaultValue={v.city}
              error={errors.city}
            />
            <SelectField
              id="province"
              label="Province"
              required
              options={PROVINCES}
              placeholder="Choose a province"
              defaultValue={v.province ?? ""}
              error={errors.province}
            />
            <Field
              id="postalCode"
              label="Postal code"
              required
              inputMode="numeric"
              maxLength={4}
              autoComplete="postal-code"
              defaultValue={v.postalCode}
              error={errors.postalCode}
            />
          </div>
          <Field
            id="deliveryNotes"
            label="Delivery notes (optional)"
            multiline
            hint="For example, gate codes or the best time to deliver."
            defaultValue={v.deliveryNotes}
            error={errors.deliveryNotes}
          />
        </fieldset>

        {resolution.shippingOptions.length > 1 && (
          <fieldset className="space-y-2">
            <legend className="mb-2 text-xl font-semibold">Delivery method</legend>
            {resolution.shippingOptions.map((o) => (
              <label key={o.method} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="deliveryMethod"
                  value={o.method}
                  checked={method === o.method}
                  onChange={() => setMethod(o.method)}
                />
                {o.label} ({o.costCents === 0 ? "Free" : formatZar(o.costCents)})
              </label>
            ))}
          </fieldset>
        )}
        {resolution.shippingOptions.length <= 1 && (
          <input type="hidden" name="deliveryMethod" value={method} />
        )}

        <div className="space-y-3">
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              name="marketingOptIn"
              defaultChecked={v.marketingOptIn === "on"}
              className="mt-1"
            />
            <span>Email me news and offers from Kunta Nia (optional).</span>
          </label>
          <div>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                name="acceptTerms"
                required
                defaultChecked={v.acceptTerms === "on"}
                aria-describedby={errors.acceptTerms ? "acceptTerms-error" : undefined}
                className="mt-1"
              />
              <span>
                I have read and accept the{" "}
                <Link href="/terms" target="_blank" className="underline">
                  Terms &amp; Conditions
                </Link>{" "}
                and{" "}
                <Link href="/privacy" target="_blank" className="underline">
                  Privacy Policy
                </Link>
                . <span aria-hidden="true">*</span>
              </span>
            </label>
            {errors.acceptTerms && (
              <p id="acceptTerms-error" className="mt-1 text-sm text-danger">
                {errors.acceptTerms}
              </p>
            )}
          </div>
        </div>
      </div>

      <aside className="h-fit space-y-4 rounded-card border border-line bg-surface-muted p-5">
        <h2 className="text-xl font-semibold">Order summary</h2>
        <ul className="space-y-3">
          {resolution.lines.map((l) => (
            <li key={l.productId} className="flex items-center gap-3 text-sm">
              {l.imageSrc && (
                <Image
                  src={l.imageSrc}
                  alt=""
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-control object-cover"
                />
              )}
              <span className="flex-1">
                {l.name} × {l.quantity}
              </span>
              <span>{formatZar(l.lineTotalCents)}</span>
            </li>
          ))}
        </ul>

        <div>
          <label htmlFor="discount-code" className="mb-1 block text-sm font-medium">
            Discount code (optional)
          </label>
          <div className="flex gap-2">
            <input
              id="discount-code"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              onKeyDown={(e) => {
                // Enter applies the code instead of submitting the order.
                if (e.key === "Enter") {
                  e.preventDefault();
                  setAppliedCode(codeInput.trim() || null);
                }
              }}
              autoComplete="off"
              aria-describedby="discount-status"
              className="w-full rounded-control border border-control bg-surface px-3 py-2"
            />
            <button
              type="button"
              onClick={() => setAppliedCode(codeInput.trim() || null)}
              className="rounded-control border border-control px-4"
            >
              Apply
            </button>
          </div>
          <p
            id="discount-status"
            role="status"
            className={`mt-1 text-sm ${resolution.discountError || errors.discountCode ? "text-danger" : ""}`}
          >
            {resolution.discountError ??
              errors.discountCode ??
              (resolution.discount ? `Code ${resolution.discount.code} applied.` : "")}
          </p>
        </div>

        <Totals resolution={resolution} shippingLabel={`Shipping (${methodLabel})`} />
        <SubmitButton pending={pending}>Place order and pay</SubmitButton>
        <p className="text-sm text-ink-muted">
          You&rsquo;ll be taken to our secure payment partner to pay.
        </p>
      </aside>
    </form>
  );
}
