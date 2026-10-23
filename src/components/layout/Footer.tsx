import Link from "next/link";
import { business, nav, site, social } from "@content/site";
import { NewsletterForm } from "@/components/forms/NewsletterForm";

/** Maroon footer. The newsletter sits in a cream panel so the form stays readable. */
export function Footer() {
  const socials = Object.entries(social).filter(([, url]) => url);

  return (
    <footer className="mt-16 bg-brand text-brand-contrast">
      <div className="mx-auto grid max-w-site gap-10 px-4 py-12 text-sm md:grid-cols-[1.2fr_1fr_1fr_1.2fr]">
        <div>
          <p className="font-heading text-xl tracking-[0.2em] text-gold uppercase">
            {site.name}
          </p>
          <p className="mt-2 text-brand-contrast/90">{site.tagline}</p>
          {socials.length > 0 && (
            <ul className="mt-4 flex gap-4">
              {socials.map(([name, url]) => (
                <li key={name}>
                  <a
                    href={url}
                    rel="noopener noreferrer"
                    className="capitalize underline"
                  >
                    {name}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <nav aria-label="Shop">
          <p className="font-semibold text-gold">Shop</p>
          <ul className="mt-3 space-y-2">
            {nav.main.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:underline">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Policies">
          <p className="font-semibold text-gold">Information</p>
          <ul className="mt-3 space-y-2">
            {nav.footerPolicies.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:underline">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <section aria-labelledby="footer-newsletter-heading">
          <h2 id="footer-newsletter-heading" className="font-semibold text-gold">
            Newsletter
          </h2>
          <div className="mt-3 rounded-card bg-surface p-4 text-ink">
            <NewsletterForm source="footer" />
          </div>
        </section>
      </div>

      {/* ECT Act s43 business disclosures */}
      <div className="border-t border-brand-contrast/20">
        <address className="mx-auto max-w-site px-4 py-6 text-xs leading-relaxed text-brand-contrast/80 not-italic">
          {business.registeredName} ({business.legalForm})
          {business.registrationNumber && <> · Reg. no. {business.registrationNumber}</>}
          {business.vatNumber && <> · VAT no. {business.vatNumber}</>} ·{" "}
          {business.physicalAddress} · {business.email} · {business.phone}
        </address>
        <p className="mx-auto flex max-w-site flex-wrap items-center justify-between gap-2 px-4 pb-6 text-xs text-brand-contrast/80">
          <span>
            &copy; {new Date().getFullYear()} {site.name}. All rights reserved.
          </span>
          {/* Owner shortcut. The page behind it is protected by the admin password. */}
          <Link href="/admin" rel="nofollow" className="underline">
            Admin login
          </Link>
        </p>
      </div>
    </footer>
  );
}
