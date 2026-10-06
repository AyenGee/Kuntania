import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Payment cancelled",
  robots: { index: false },
};

/** Customer backed out of the payment page. Their cart is untouched (it's only cleared after an order is placed and returned from payment). */
export default function CheckoutCancelledPage() {
  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-3xl font-semibold">Payment cancelled</h1>
      <p className="mt-4">
        No payment was taken. Your cart is still saved, so you can try again whenever
        you&rsquo;re ready.
      </p>
      <div className="mt-6 flex flex-wrap gap-4">
        <Link
          href="/checkout"
          className="rounded-control bg-brand px-6 py-3 font-medium text-brand-contrast"
        >
          Try again
        </Link>
        <Link href="/cart" className="rounded-control border border-control px-6 py-3">
          Review cart
        </Link>
      </div>
      <p className="mt-6 text-sm text-ink-muted">
        Having trouble paying?{" "}
        <Link href="/contact" className="underline">
          Contact us
        </Link>
        .
      </p>
    </div>
  );
}
