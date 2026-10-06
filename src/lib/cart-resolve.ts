import { store } from "@content/site";
import type { CartItem } from "@/lib/cart";
import { maxOrderQuantity } from "@/lib/catalogue-stock";
import { evaluateDiscount, type DiscountRow } from "@/lib/discounts";
import { computeTotals, type Totals } from "@/lib/pricing";
import {
  availableShippingOptions,
  freeShippingRemainingCents,
  shippingCostCents,
  type ShippingConfig,
  type ShippingMethod,
} from "@/lib/shipping";

/** The product facts the resolver needs (loaded fresh from the database, never the client). */
export type ProductForCart = {
  id: string;
  slug: string;
  name: string;
  sizeLabel: string;
  priceCents: number;
  stock: number;
  active: boolean;
  images: { src: string; alt: string }[];
};

export type CartIssue = { productId: string; message: string };

export type ResolvedLine = {
  productId: string;
  slug: string;
  name: string;
  sizeLabel: string;
  imageSrc: string | null;
  imageAlt: string;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
  maxQuantity: number;
};

export type Resolution = {
  lines: ResolvedLine[];
  /** Problems the customer must see (item gone, stock dropped, over per-order limit). */
  issues: CartIssue[];
  /** The cart as it should be after applying the fixes above (for rewriting localStorage). */
  effectiveCart: CartItem[];
  totals: Totals;
  discount: { code: string; id: string } | null;
  discountError: string | null;
  shippingMethod: ShippingMethod;
  /** Set when the chosen method isn't offered. */
  shippingError: string | null;
  shippingOptions: { method: ShippingMethod; label: string; costCents: number }[];
  freeShippingRemainingCents: number | null;
  freeShippingThresholdCents: number | null;
};

/**
 * Pure server-side cart resolution. Used by BOTH the cart/checkout price preview and
 * order creation, so what the customer sees is exactly what is charged.
 *
 * Unavailable products are dropped; quantities above stock or the per-order maximum are
 * clamped. Either case adds an issue, and order creation refuses to proceed while any
 * issue exists, so the customer always sees and accepts the change first.
 */
export function resolveCart(input: {
  items: CartItem[];
  products: ProductForCart[];
  discountCode: string | null;
  discount: DiscountRow | null;
  shippingMethod: ShippingMethod;
  shippingConfig: ShippingConfig;
  vatRegistered: boolean;
  now: Date;
  perOrderMax?: number;
}): Resolution {
  const perOrderMax = input.perOrderMax ?? store.maxQuantityPerOrder;
  const byId = new Map(input.products.map((p) => [p.id, p]));
  const lines: ResolvedLine[] = [];
  const issues: CartIssue[] = [];

  // Merge duplicate product lines defensively.
  const wanted = new Map<string, number>();
  for (const item of input.items) {
    wanted.set(item.productId, (wanted.get(item.productId) ?? 0) + item.quantity);
  }

  for (const [productId, requested] of wanted) {
    const product = byId.get(productId);
    if (!product || !product.active) {
      issues.push({
        productId,
        message: "An item in your cart is no longer available and was removed.",
      });
      continue;
    }
    const maxQuantity = maxOrderQuantity(product.stock, perOrderMax);
    if (maxQuantity < 1) {
      issues.push({ productId, message: `${product.name} is sold out and was removed.` });
      continue;
    }
    let quantity = requested;
    if (requested > maxQuantity) {
      quantity = maxQuantity;
      issues.push({
        productId,
        message:
          product.stock < requested && product.stock <= perOrderMax
            ? `Only ${product.stock} of ${product.name} ${product.stock === 1 ? "is" : "are"} available, so we updated your quantity.`
            : `You can order at most ${maxQuantity} of ${product.name}, so we updated your quantity.`,
      });
    }
    lines.push({
      productId,
      slug: product.slug,
      name: product.name,
      sizeLabel: product.sizeLabel,
      imageSrc: product.images[0]?.src ?? null,
      imageAlt: product.images[0]?.alt ?? product.name,
      unitPriceCents: product.priceCents,
      quantity,
      lineTotalCents: product.priceCents * quantity,
      maxQuantity,
    });
  }

  const subtotalCents = lines.reduce((sum, l) => sum + l.lineTotalCents, 0);

  let discountCents = 0;
  let discountError: string | null = null;
  let discount: Resolution["discount"] = null;
  if (input.discountCode) {
    const result = evaluateDiscount(input.discount, subtotalCents, input.now);
    if (result.ok && input.discount) {
      discountCents = result.amountCents;
      discount = { code: input.discount.code, id: input.discount.id };
    } else if (!result.ok) {
      discountError = result.message;
    }
  }

  const afterDiscount = subtotalCents - discountCents;
  const cfg = input.shippingConfig;
  const shippingOptions = availableShippingOptions(cfg).map((o) => ({
    ...o,
    costCents: shippingCostCents(o.method, afterDiscount, cfg) ?? 0,
  }));
  const chosenCost = shippingCostCents(input.shippingMethod, afterDiscount, cfg);

  return {
    lines,
    issues,
    effectiveCart: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
    totals: computeTotals({
      subtotalCents,
      discountCents,
      shippingCents: chosenCost ?? 0,
      vatRegistered: input.vatRegistered,
    }),
    discount,
    discountError,
    shippingMethod: input.shippingMethod,
    shippingError: chosenCost === null ? "That delivery method isn't available." : null,
    shippingOptions,
    freeShippingRemainingCents: freeShippingRemainingCents(afterDiscount, cfg),
    freeShippingThresholdCents: cfg.freeShippingThresholdCents,
  };
}
