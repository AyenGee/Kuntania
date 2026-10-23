import { Analytics } from "@/components/Analytics";
import { JsonLd } from "@/components/JsonLd";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { organizationJsonLd } from "@/lib/organization-jsonld";
import { siteUrl } from "@/lib/site-url";

/**
 * Public storefront chrome. Pages choose their own width: the home and shop pages run
 * full-bleed, everything else sits in the (narrow) column. The admin has its own layout.
 */
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
      <AnnouncementBar />
      <Header />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
    </>
  );
}
