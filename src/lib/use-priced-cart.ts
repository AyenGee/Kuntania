"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { priceCartAction } from "@/app/(site)/cart/actions";
import { saveCart, type CartItem } from "@/lib/cart";
import type { Resolution } from "@/lib/cart-resolve";
import type { ShippingMethod } from "@/lib/shipping";

type Outcome = { key: string; resolution: Resolution | null };
type State =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; resolution: Resolution };

/**
 * Prices the local cart on the server (prices, stock, discount, shipping all come from the
 * database). If the server had to change the cart (item gone, stock dropped), the corrected
 * cart is written back to localStorage and the customer is shown why.
 */
export function usePricedCart(
  items: CartItem[],
  shippingMethod: ShippingMethod,
  discountCode: string | null,
  refreshKey = 0,
) {
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [notices, setNotices] = useState<string[]>([]);

  const itemsKey = useMemo(() => JSON.stringify(items), [items]);
  // Identifies exactly what a response is for; stale responses are ignored.
  const key = `${itemsKey}|${shippingMethod}|${discountCode ?? ""}|${refreshKey}`;

  useEffect(() => {
    if (items.length === 0) return;
    let cancelled = false;
    priceCartAction({ items, shippingMethod, discountCode })
      .then((result) => {
        if (cancelled) return;
        if (!result.ok) {
          setOutcome({ key, resolution: null });
          return;
        }
        const { resolution } = result;
        if (resolution.issues.length > 0) {
          setNotices(resolution.issues.map((i) => i.message));
        }
        if (JSON.stringify(resolution.effectiveCart) !== itemsKey) {
          saveCart(resolution.effectiveCart);
        }
        setOutcome({ key, resolution });
      })
      .catch(() => {
        if (!cancelled) setOutcome({ key, resolution: null });
      });
    return () => {
      cancelled = true;
    };
    // `items` is represented by itemsKey so a new-but-equal array doesn't refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const state: State =
    items.length === 0 || !outcome || outcome.key !== key
      ? { status: "loading" }
      : outcome.resolution
        ? { status: "ready", resolution: outcome.resolution }
        : { status: "error" };

  const dismissNotices = useCallback(() => setNotices([]), []);
  return { state, notices, dismissNotices };
}
