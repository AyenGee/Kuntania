"use client";

import Link from "next/link";
import { cartCount } from "@/lib/cart";
import { useCart } from "@/lib/use-cart";

/** Cart link with a count badge. Sits on the maroon header, so the badge is cream. */
export function CartCount() {
  const { items, ready } = useCart();
  const count = ready ? cartCount(items) : 0;
  return (
    <Link href="/cart" className="py-1 hover:underline">
      Cart
      {count > 0 && (
        <>
          {" "}
          <span
            aria-hidden="true"
            className="rounded-full bg-brand-contrast px-2 py-0.5 text-xs font-semibold text-brand"
          >
            {count}
          </span>
          <span className="sr-only">, {count} items</span>
        </>
      )}
    </Link>
  );
}
