import type { Metadata } from "next";
import { pageMeta } from "@content/pages";
import { PolicyPage } from "@/components/PolicyPage";

export const metadata: Metadata = {
  title: pageMeta.privacy.title,
  description: pageMeta.privacy.description,
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return <PolicyPage slug="privacy" title={pageMeta.privacy.title} />;
}
