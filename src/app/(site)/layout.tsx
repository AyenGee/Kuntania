import { Analytics } from "@/components/Analytics";
import { JsonLd } from "@/components/JsonLd";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { organizationJsonLd } from "@/lib/organization-jsonld";
import { siteUrl } from "@/lib/site-url";

/** Public storefront chrome. The admin area has its own layout (see app/admin). */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={organizationJsonLd(siteUrl())} />
      <Analytics />
      <a
        href="#main"
        className="sr-only z-50 bg-brand p-3 text-brand-contrast focus:not-sr-only focus:absolute"
      >
        Skip to content
      </a>
      <Header />
      <main id="main" className="mx-auto w-full max-w-site flex-1 px-4 py-8">
        {children}
      </main>
      <Footer />
    </>
  );
}
