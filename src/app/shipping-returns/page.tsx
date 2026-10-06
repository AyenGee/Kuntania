import type { Metadata } from "next";
import { pageMeta } from "@content/pages";
import { PolicyPage } from "@/components/PolicyPage";

export const metadata: Metadata = {
  title: pageMeta.shippingReturns.title,
  description: pageMeta.shippingReturns.description,
  alternates: { canonical: "/shipping-returns" },
};

export default function ShippingReturnsPage() {
  return <PolicyPage slug="shipping-returns" title={pageMeta.shippingReturns.title} />;
}
