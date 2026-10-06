"use client";

import Link from "next/link";
import { cartCount } from "@/lib/cart";
import { useCart } from "@/lib/use-cart";

export function CartCount() {
  const { items, ready } = useCart();
  const count = ready ? cartCount(items) : 0;
  return (
    <Link href="/cart" className="hover:underline">
      Cart
      {count > 0 && (
        <>
          {" "}
          <span
            aria-hidden="true"
            className="rounded-full bg-brand px-2 py-0.5 text-xs text-brand-contrast"
          >
            {count}
          </span>
          <span className="sr-only">, {count} items</span>
        </>
      )}
    </Link>
  );
}
