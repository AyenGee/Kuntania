import type { Metadata } from "next";
import { business } from "@content/site";
import { pageMeta } from "@content/pages";
import { ContactForm } from "@/components/forms/ContactForm";

export const metadata: Metadata = {
  title: pageMeta.contact.title,
  description: pageMeta.contact.description,
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <div className="mx-auto grid max-w-4xl gap-10 md:grid-cols-[2fr_1fr]">
      <div>
        <h1 className="text-3xl font-semibold">{pageMeta.contact.title}</h1>
        <p className="mt-2 mb-6 text-ink-muted">
          Questions about an order or our products? Send us a message.
        </p>
        <ContactForm />
      </div>
      <address className="text-ink-muted not-italic">
        <h2 className="text-xl font-semibold text-ink">Business details</h2>
        <p className="mt-3">{business.registeredName}</p>
        <p>{business.physicalAddress}</p>
        <p className="mt-3">{business.email}</p>
        <p>{business.phone}</p>
      </address>
    </div>
  );
}
