"use client";

import Image from "next/image";
import Link from "next/link";
import { removeItem, saveCart, setQuantity } from "@/lib/cart";
import { formatZar } from "@/lib/money";
import { usePricedCart } from "@/lib/use-priced-cart";
import { useCart } from "@/lib/use-cart";
import { Totals } from "./Totals";

export function CartView() {
  const { items, ready } = useCart();
  const { state, notices, dismissNotices } = usePricedCart(items, "COURIER", null);

  if (!ready) return <p aria-busy="true">Loading your cart…</p>;

  if (items.length === 0) {
    return (
      <div>
        {notices.length > 0 && <Notices notices={notices} onDismiss={dismissNotices} />}
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

  if (state.status === "error") {
    return (
      <p role="alert" className="text-danger">
        We couldn&rsquo;t load your cart just now. Please refresh the page and try again.
      </p>
    );
  }
  if (state.status === "loading") return <p aria-busy="true">Loading your cart…</p>;

  const { resolution } = state;
  const threshold = resolution.freeShippingThresholdCents;
  const remaining = resolution.freeShippingRemainingCents;

  return (
    <div className="grid gap-8 md:grid-cols-[2fr_1fr]">
      <div>
        {notices.length > 0 && <Notices notices={notices} onDismiss={dismissNotices} />}
        <ul className="divide-y divide-line">
          {resolution.lines.map((line) => (
            <li key={line.productId} className="flex gap-4 py-4">
              {line.imageSrc && (
                <Image
                  src={line.imageSrc}
                  alt={line.imageAlt}
                  width={96}
                  height={96}
                  className="h-24 w-24 rounded-control bg-surface-muted object-cover"
                />
              )}
              <div className="flex-1">
                <Link
                  href={`/products/${line.slug}`}
                  className="font-semibold hover:underline"
                >
                  {line.name}
                </Link>
                <p className="text-sm text-ink-muted">{line.sizeLabel}</p>
                <p className="text-sm">{formatZar(line.unitPriceCents)} each</p>
                <div className="mt-2 flex items-center gap-4">
                  <label className="text-sm">
                    <span className="sr-only">Quantity for {line.name}</span>
                    <select
                      value={line.quantity}
                      onChange={(e) => {
                        dismissNotices();
                        saveCart(
                          setQuantity(
                            items,
                            line.productId,
                            Number(e.target.value),
                            line.maxQuantity,
                          ),
                        );
                      }}
                      className="rounded-control border border-control bg-surface px-2 py-1"
                    >
                      {Array.from({ length: line.maxQuantity }, (_, i) => i + 1).map(
                        (n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ),
                      )}
                    </select>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      dismissNotices();
                      saveCart(removeItem(items, line.productId));
                    }}
                    className="text-sm underline"
                  >
                    Remove<span className="sr-only"> {line.name}</span>
                  </button>
                </div>
              </div>
              <p className="font-semibold">{formatZar(line.lineTotalCents)}</p>
            </li>
          ))}
        </ul>
      </div>

      <aside className="h-fit space-y-4 rounded-card border border-line bg-surface-muted p-5">
        <h2 className="text-xl font-semibold">Order summary</h2>
        {threshold !== null && (
          <p role="status" className="text-sm">
            {remaining !== null
              ? `Spend ${formatZar(remaining)} more for free shipping.`
              : "You've qualified for free shipping!"}
          </p>
        )}
        <Totals resolution={resolution} shippingLabel="Shipping (courier estimate)" />
        <p className="text-sm text-ink-muted">
          Final shipping is confirmed at checkout. Discount codes can be added there.
        </p>
        <Link
          href="/checkout"
          className="block rounded-control bg-brand px-5 py-3 text-center font-medium text-brand-contrast"
        >
          Checkout
        </Link>
      </aside>
    </div>
  );
}

function Notices({ notices, onDismiss }: { notices: string[]; onDismiss: () => void }) {
  return (
    <div role="alert" className="mb-4 rounded-control border-2 border-accent p-4">
      <ul className="space-y-1">
        {notices.map((n) => (
          <li key={n}>{n}</li>
        ))}
      </ul>
      <button type="button" onClick={onDismiss} className="mt-2 text-sm underline">
        Dismiss
      </button>
    </div>
  );
}
