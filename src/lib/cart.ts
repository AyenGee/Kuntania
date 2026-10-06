/**
 * Client-side cart. Stores ONLY { productId, quantity } in localStorage.
 * Prices, names and stock are never stored here: the server re-fetches and recomputes
 * everything at checkout, so a tampered cart can't change what is charged.
 */

export type CartItem = { productId: string; quantity: number };

export const CART_STORAGE_KEY = "kuntania.cart.v1";
export const CART_EVENT = "kuntania:cart-changed";

/** Validate untrusted data (from localStorage) into a clean cart. */
export function sanitiseCart(input: unknown, perProductMax: number): CartItem[] {
  if (!Array.isArray(input)) return [];
  const merged = new Map<string, number>();
  for (const raw of input) {
    if (!raw || typeof raw !== "object") continue;
    const { productId, quantity } = raw as Record<string, unknown>;
    if (typeof productId !== "string" || productId === "" || productId.length > 64)
      continue;
    if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 1)
      continue;
    merged.set(
      productId,
      Math.min((merged.get(productId) ?? 0) + quantity, perProductMax),
    );
  }
  return [...merged].map(([productId, quantity]) => ({ productId, quantity }));
}

/** Add `quantity` of a product, never exceeding `max` units of it. */
export function addItem(
  cart: CartItem[],
  productId: string,
  quantity: number,
  max: number,
): CartItem[] {
  if (!Number.isInteger(quantity) || quantity < 1 || max < 1) return cart;
  const existing = cart.find((i) => i.productId === productId);
  if (!existing) return [...cart, { productId, quantity: Math.min(quantity, max) }];
  return cart.map((i) =>
    i.productId === productId
      ? { ...i, quantity: Math.min(i.quantity + quantity, max) }
      : i,
  );
}

/** Set an exact quantity (0 or less removes the line). */
export function setQuantity(
  cart: CartItem[],
  productId: string,
  quantity: number,
  max: number,
): CartItem[] {
  if (!Number.isInteger(quantity) || quantity < 1) return removeItem(cart, productId);
  return cart.map((i) =>
    i.productId === productId ? { ...i, quantity: Math.min(quantity, max) } : i,
  );
}

export function removeItem(cart: CartItem[], productId: string): CartItem[] {
  return cart.filter((i) => i.productId !== productId);
}

export function cartCount(cart: CartItem[]): number {
  return cart.reduce((sum, i) => sum + i.quantity, 0);
}

// --- Browser storage (guarded: storage can be blocked or throw) -------------

export function loadCart(perProductMax: number): CartItem[] {
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    return raw ? sanitiseCart(JSON.parse(raw), perProductMax) : [];
  } catch {
    return [];
  }
}

export function saveCart(cart: CartItem[]): void {
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch {
    // Storage unavailable (private mode, quota): the cart simply won't persist.
  }
  window.dispatchEvent(new Event(CART_EVENT));
}
