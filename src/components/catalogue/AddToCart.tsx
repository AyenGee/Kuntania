"use client";

import Link from "next/link";
import { useState } from "react";
import { addItem, loadCart, saveCart } from "@/lib/cart";

/**
 * Quantity selector + Add to cart. `maxQuantity` is computed on the server from stock and
 * the per-order cap. The server re-validates everything again at checkout.
 */
export function AddToCart({
  productId,
  productName,
  maxQuantity,
}: {
  productId: string;
  productName: string;
  maxQuantity: number;
}) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const soldOut = maxQuantity < 1;

  function handleAdd() {
    saveCart(addItem(loadCart(maxQuantity), productId, quantity, maxQuantity));
    setAdded(true);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-4">
        <div>
          <label htmlFor="quantity" className="mb-1 block text-sm font-medium">
            Quantity
          </label>
          <select
            id="quantity"
            value={quantity}
            disabled={soldOut}
            onChange={(e) => {
              setQuantity(Number(e.target.value));
              setAdded(false);
            }}
            className="rounded-control border border-control bg-surface px-3 py-2"
          >
            {Array.from({ length: Math.max(maxQuantity, 1) }, (_, i) => i + 1).map(
              (n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ),
            )}
          </select>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={soldOut}
          className="rounded-control bg-brand px-6 py-2.5 font-medium text-brand-contrast disabled:cursor-not-allowed disabled:opacity-50"
        >
          {soldOut ? "Sold out" : "Add to cart"}
        </button>
      </div>
      <p role="status" className="text-sm">
        {added && (
          <>
            Added {productName} to your cart.{" "}
            <Link href="/cart" className="underline">
              View cart
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
