import { business, site, social } from "@content/site";

const isPlaceholder = (v: string | null | undefined): boolean =>
  !v || v.includes("TODO(CLIENT)");

/**
 * schema.org Organization. Fields that are still `TODO(CLIENT)` placeholders are left out
 * so unfinished placeholder text never reaches search engines.
 */
export function organizationJsonLd(siteUrl: string, logoUrl?: string) {
  const sameAs = Object.values(social).filter((u) => u.startsWith("http"));
  const email = isPlaceholder(business.email) ? undefined : business.email;
  const phone = isPlaceholder(business.phone) ? undefined : business.phone;

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.name,
    url: siteUrl,
    ...(logoUrl ? { logo: logoUrl } : {}),
    ...(sameAs.length ? { sameAs } : {}),
    ...(email || phone
      ? {
          contactPoint: {
            "@type": "ContactPoint",
            contactType: "customer service",
            areaServed: "ZA",
            ...(email ? { email } : {}),
            ...(phone ? { telephone: phone } : {}),
          },
        }
      : {}),
  };
}
