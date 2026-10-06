import type { Metadata } from "next";
import { OrderLookupForm } from "@/components/forms/OrderLookupForm";

export const metadata: Metadata = {
  title: "Order status",
  description: "Check the status of your Kunta Nia order.",
  robots: { index: false },
};

export default function OrderStatusPage() {
  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-3xl font-semibold">Check your order</h1>
      <p className="mt-2 mb-6 text-ink-muted">
        Enter your order number and the email address you used at checkout.
      </p>
      <OrderLookupForm />
    </div>
  );
}
