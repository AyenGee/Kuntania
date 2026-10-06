"use client";

import { useMemo, useSyncExternalStore } from "react";
import { store } from "@content/site";
import { CART_EVENT, CART_STORAGE_KEY, sanitiseCart, type CartItem } from "@/lib/cart";

function subscribe(onChange: () => void) {
  window.addEventListener(CART_EVENT, onChange);
  window.addEventListener("storage", onChange); // other tabs
  return () => {
    window.removeEventListener(CART_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function getSnapshot(): string {
  try {
    return window.localStorage.getItem(CART_STORAGE_KEY) ?? "[]";
  } catch {
    return "[]";
  }
}

/** Live cart from localStorage (empty on the server and during hydration). */
export function useCart(): { items: CartItem[]; ready: boolean } {
  const raw = useSyncExternalStore(subscribe, getSnapshot, () => "[]");
  const ready = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const items = useMemo(() => {
    try {
      return sanitiseCart(JSON.parse(raw), store.maxQuantityPerOrder);
    } catch {
      return [];
    }
  }, [raw]);
  return { items, ready };
}
