import { store } from "@content/site";

/** Pure stock helpers (no database import, so they are safe in any bundle). */

export type StockStatus =
  { state: "in_stock" } | { state: "low"; remaining: number } | { state: "sold_out" };

/** Customer-facing stock state. `threshold` defaults to the configured low-stock level. */
export function stockStatus(
  stock: number,
  threshold: number = store.lowStockThreshold,
): StockStatus {
  if (stock <= 0) return { state: "sold_out" };
  if (stock <= threshold) return { state: "low", remaining: stock };
  return { state: "in_stock" };
}

/** Largest quantity a customer may order: capped by stock and the per-order maximum. */
export function maxOrderQuantity(
  stock: number,
  perOrderMax: number = store.maxQuantityPerOrder,
): number {
  return Math.max(0, Math.min(stock, perOrderMax));
}
