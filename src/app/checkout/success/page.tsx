import type { Metadata } from "next";
import Link from "next/link";
import { ClearCartOnMount } from "@/components/cart/ClearCartOnMount";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Thank you",
  robots: { index: false },
};

const PAID_STATES = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"];

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order: orderNumber } = await searchParams;

  // Only the order number and status are looked up: no personal details are shown here.
  const order =
    orderNumber && /^KN-\d{4,12}$/.test(orderNumber)
      ? await getDb().order.findUnique({
          where: { orderNumber },
          select: { orderNumber: true, status: true },
        })
      : null;

  return (
    <div className="mx-auto max-w-xl">
      <ClearCartOnMount />
      <h1 className="text-3xl font-semibold">Thank you for your order</h1>
      {order ? (
        <div className="mt-4 space-y-3">
          <p>
            Your order number is <strong>{order.orderNumber}</strong>.
          </p>
          {/* Only a verified payment notification marks an order paid; never this page. */}
          {PAID_STATES.includes(order.status) ? (
            <p role="status">
              Payment received. We&rsquo;ll email you your order confirmation.
            </p>
          ) : order.status === "PENDING_PAYMENT" ? (
            <p role="status">
              We&rsquo;re confirming your payment. This usually takes a minute.
              You&rsquo;ll receive an email once it&rsquo;s confirmed.
            </p>
          ) : (
            <p role="status">
              This order is {order.status.toLowerCase().replace("_", " ")}.
            </p>
          )}
          <p>
            You can check your order any time on the{" "}
            <Link href="/order-status" className="underline">
              order status page
            </Link>
            .
          </p>
        </div>
      ) : (
        <p className="mt-4">
          We couldn&rsquo;t find that order. Please contact us if you need help.
        </p>
      )}
      <Link href="/shop" className="mt-6 inline-block underline">
        Continue shopping
      </Link>
    </div>
  );
}
