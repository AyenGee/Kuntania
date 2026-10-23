import { deliveryArea, shipping } from "@content/site";
import { isServiceablePostalCode } from "@/lib/delivery-area";
import { getDb } from "@/lib/db";
import { devFallback } from "@/lib/catalogue";
import { resolveCart, type ProductForCart, type Resolution } from "@/lib/cart-resolve";
import type { CartItem } from "@/lib/cart";
import { normaliseCode, type DiscountRow } from "@/lib/discounts";
import { getEnv } from "@/lib/env";
import type { ShippingMethod } from "@/lib/shipping";
import type { CheckoutInput } from "@/lib/validation/checkout";
import { z } from "zod";

const imagesSchema = z.array(z.object({ src: z.string(), alt: z.string() }));

/** Load fresh product + discount data and resolve the cart (shared by preview and checkout). */
export async function loadResolution(input: {
  items: CartItem[];
  shippingMethod: ShippingMethod;
  discountCode: string | null;
}): Promise<Resolution> {
  const db = getDb();
  const ids = [...new Set(input.items.map((i) => i.productId))];
  const code = input.discountCode ? normaliseCode(input.discountCode) : null;

  let products: ProductForCart[];
  let discount: DiscountRow | null = null;
  try {
    const rows = ids.length
      ? await db.product.findMany({ where: { id: { in: ids } } })
      : [];
    products = rows.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      sizeLabel: p.sizeLabel,
      priceCents: p.priceCents,
      stock: p.stock,
      active: p.active,
      images: imagesSchema.catch([]).parse(p.images),
    }));
    if (code) discount = await db.discountCode.findUnique({ where: { code } });
  } catch (error) {
    // DEVELOPMENT ONLY (rethrows in production): with no database, price the cart from the
    // seed products so the cart can be previewed. Discount codes can't exist without a database.
    products = devFallback(error)
      .filter((p) => ids.includes(p.id))
      .map((p) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        sizeLabel: p.sizeLabel,
        priceCents: p.priceCents,
        stock: p.stock,
        active: p.active,
        images: p.images,
      }));
    discount = null;
  }

  return resolveCart({
    items: input.items,
    products,
    discountCode: code,
    discount,
    shippingMethod: input.shippingMethod,
    shippingConfig: shipping,
    vatRegistered: getEnv().VAT_REGISTERED,
    now: new Date(),
  });
}

export type PlaceOrderResult =
  | {
      ok: true;
      orderNumber: string;
      totalCents: number;
      email: string;
      firstName: string;
      lastName: string;
    }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

/**
 * Create a PENDING_PAYMENT order. All amounts come from `loadResolution` (database prices),
 * never from the form. Stock is NOT decremented here: only a verified payment does that.
 */
export async function placeOrder(input: CheckoutInput): Promise<PlaceOrderResult> {
  const resolution = await loadResolution({
    items: input.cart,
    shippingMethod: input.deliveryMethod,
    discountCode: input.discountCode ?? null,
  });

  if (resolution.issues.length > 0) {
    return {
      ok: false,
      message: `${resolution.issues.map((i) => i.message).join(" ")} Please review your cart and try again.`,
    };
  }
  if (resolution.lines.length === 0) {
    return { ok: false, message: "Your cart is empty." };
  }
  if (resolution.discountError) {
    return {
      ok: false,
      message: resolution.discountError,
      fieldErrors: { discountCode: resolution.discountError },
    };
  }
  if (!isServiceablePostalCode(input.postalCode, deliveryArea)) {
    return {
      ok: false,
      message: deliveryArea.message,
      fieldErrors: { postalCode: deliveryArea.message },
    };
  }
  if (resolution.shippingError) {
    return {
      ok: false,
      message: resolution.shippingError,
      fieldErrors: { deliveryMethod: resolution.shippingError },
    };
  }

  const { totals } = resolution;
  const db = getDb();

  const order = await db.$transaction(async (tx) => {
    // Race-free, human-friendly number from a Postgres sequence (no user input in the query).
    const [{ n }] = await tx.$queryRaw<
      { n: bigint }[]
    >`SELECT nextval('order_number_seq') AS n`;
    const orderNumber = `KN-${n.toString()}`;

    return tx.order.create({
      data: {
        orderNumber,
        status: "PENDING_PAYMENT",
        email: input.email.toLowerCase(),
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        addressLine1: input.addressLine1,
        addressLine2: input.addressLine2,
        suburb: input.suburb,
        city: input.city,
        province: input.province,
        postalCode: input.postalCode,
        deliveryMethod: input.deliveryMethod,
        deliveryNotes: input.deliveryNotes,
        subtotalCents: totals.subtotalCents,
        shippingCents: totals.shippingCents,
        discountCents: totals.discountCents,
        totalCents: totals.totalCents,
        vatIncludedCents: totals.vatIncludedCents,
        discountCodeId: resolution.discount?.id,
        paymentProvider: "yoco",
        marketingOptIn: input.marketingOptIn,
        termsAcceptedAt: new Date(),
        items: {
          create: resolution.lines.map((l) => ({
            productId: l.productId,
            productNameSnapshot: l.name,
            sizeSnapshot: l.sizeLabel,
            unitPriceCentsSnapshot: l.unitPriceCents,
            quantity: l.quantity,
            lineTotalCents: l.lineTotalCents,
          })),
        },
        events: {
          create: { type: "created", message: "Order created, awaiting payment." },
        },
      },
      select: {
        orderNumber: true,
        totalCents: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });
  });

  console.info(
    JSON.stringify({ event: "checkout.order_created", order: order.orderNumber }),
  );
  return { ok: true, ...order };
}
