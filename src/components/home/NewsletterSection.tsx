import { home } from "@content/home";
import { NewsletterForm } from "@/components/forms/NewsletterForm";

/** Newsletter signup panel for the home page (the footer has a second one). */
export function NewsletterSection() {
  return (
    <section
      aria-labelledby="newsletter-heading"
      className="mx-auto max-w-site px-4 py-16"
    >
      <div className="mx-auto max-w-xl rounded-card bg-surface-muted p-6 md:p-8">
        <h2 id="newsletter-heading" className="text-3xl">
          {home.newsletter.heading}
        </h2>
        <p className="mt-2 mb-5 text-ink-muted">{home.newsletter.body}</p>
        <NewsletterForm source="home" />
      </div>
    </section>
  );
}
