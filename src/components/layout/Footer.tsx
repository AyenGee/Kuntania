import Link from "next/link";
import { business, nav, site, social } from "@content/site";

export function Footer() {
  const socials = Object.entries(social).filter(([, url]) => url);

  return (
    <footer className="mt-16 border-t border-line bg-surface-muted">
      <div className="mx-auto grid max-w-site gap-8 px-4 py-10 text-sm md:grid-cols-3">
        <div>
          <p className="font-heading text-lg font-semibold">{site.name}</p>
          <p className="mt-2 text-ink-muted">{site.tagline}</p>
          {socials.length > 0 && (
            <ul className="mt-3 flex gap-4">
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

        <nav aria-label="Policies">
          <p className="font-semibold">Information</p>
          <ul className="mt-2 space-y-1">
            {nav.footerPolicies.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:underline">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* ECT Act s43 business disclosures */}
        <address className="text-ink-muted not-italic">
          <p className="font-semibold text-ink">Business details</p>
          <p className="mt-2">
            {business.registeredName} ({business.legalForm})
          </p>
          <p>Reg. no. {business.registrationNumber}</p>
          {business.vatNumber && <p>VAT no. {business.vatNumber}</p>}
          <p>{business.physicalAddress}</p>
          <p>{business.email}</p>
          <p>{business.phone}</p>
        </address>
      </div>
      {/* Newsletter signup is added in Phase 2 */}
      <p className="border-t border-line py-4 text-center text-xs text-ink-muted">
        &copy; {new Date().getFullYear()} {site.name}. All rights reserved.
      </p>
    </footer>
  );
}
