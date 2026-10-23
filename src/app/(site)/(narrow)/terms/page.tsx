import type { Metadata } from "next";
import { pageMeta } from "@content/pages";
import { PolicyPage } from "@/components/PolicyPage";

export const metadata: Metadata = {
  title: pageMeta.terms.title,
  description: pageMeta.terms.description,
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return <PolicyPage slug="terms" title={pageMeta.terms.title} />;
}
