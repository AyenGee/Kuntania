"use client";

import { useEffect } from "react";
import { saveCart } from "@/lib/cart";

/** Empties the local cart once an order has been placed. */
export function ClearCartOnMount() {
  useEffect(() => {
    saveCart([]);
  }, []);
  return null;
}
