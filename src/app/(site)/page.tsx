import Link from "next/link";
import { home } from "@content/home";
import { ProductCard } from "@/components/catalogue/ProductCard";
import { NewsletterForm } from "@/components/forms/NewsletterForm";
import { getActiveProducts, type CatalogueProduct } from "@/lib/catalogue";

export const dynamic = "force-dynamic";

/** Featured products; if the database is unreachable the home page still renders. */
async function loadFeatured(): Promise<CatalogueProduct[]> {
  try {
    return await getActiveProducts();
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "home.featured_failed",
        error: error instanceof Error ? error.message : String(error),
      }),
    );
    return [];
  }
}

export default async function HomePage() {
  const featured = await loadFeatured();
  return (
    <div className="space-y-16">
      <section className="py-8">
        <h1 className="max-w-2xl text-4xl font-semibold">{home.hero.heading}</h1>
        <p className="mt-4 max-w-2xl text-lg text-ink-muted">{home.hero.body}</p>
        <Link
          href={home.hero.cta.href}
          className="mt-6 inline-block rounded-control bg-brand px-6 py-3 font-medium text-brand-contrast"
        >
          {home.hero.cta.label}
        </Link>
      </section>

      {home.trustBadges.length > 0 && (
        <section aria-label="Why Kunta Nia">
          <ul className="grid gap-4 sm:grid-cols-3">
            {home.trustBadges.map((b) => (
              <li key={b.title} className="rounded-card border border-line p-4">
                <p className="font-semibold">{b.title}</p>
                <p className="mt-1 text-sm text-ink-muted">{b.body}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="featured-heading">
        <h2 id="featured-heading" className="text-2xl font-semibold">
          {home.featured.heading}
        </h2>
        {featured.length > 0 ? (
          <ul className="mt-4 grid gap-6 sm:grid-cols-2">
            {featured.map((p) => (
              <li key={p.id}>
                <ProductCard product={p} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2">
            <Link href="/shop" className="underline">
              Browse the shop
            </Link>
          </p>
        )}
      </section>

      {home.routine.steps.length > 0 && (
        <section aria-labelledby="routine-heading">
          <h2 id="routine-heading" className="text-2xl font-semibold">
            {home.routine.heading}
          </h2>
          <ol className="mt-4 grid gap-4 sm:grid-cols-3">
            {home.routine.steps.map((s, i) => (
              <li key={s.title} className="rounded-card border border-line p-4">
                <p className="font-semibold">
                  {i + 1}. {s.title}
                </p>
                <p className="mt-1 text-sm text-ink-muted">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section
        aria-labelledby="newsletter-heading"
        className="max-w-xl rounded-card bg-surface-muted p-6"
      >
        <h2 id="newsletter-heading" className="text-2xl font-semibold">
          {home.newsletter.heading}
        </h2>
        <p className="mt-2 mb-4 text-ink-muted">{home.newsletter.body}</p>
        <NewsletterForm source="home" />
      </section>
    </div>
  );
}
