import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false },
};

export default function CheckoutPage() {
  return (
    <div>
      <h1 className="mb-6 text-3xl font-semibold">Checkout</h1>
      <CheckoutForm />
    </div>
  );
}
