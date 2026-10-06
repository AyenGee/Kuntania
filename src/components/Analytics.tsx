import { originOf } from "@/lib/security-headers";

/**
 * Cookieless analytics (Plausible or Umami) as ONE script tag, configured by environment
 * variables. If ANALYTICS_SCRIPT_URL isn't set (or isn't a valid http(s) URL) nothing is
 * loaded at all. These tools set no cookies, which is why the site needs no cookie banner.
 * The Content Security Policy only allows the script's own host.
 */
export function Analytics() {
  const src = process.env.ANALYTICS_SCRIPT_URL;
  if (!src || !originOf(src)) return null;

  const domain = process.env.ANALYTICS_DOMAIN;
  const websiteId = process.env.ANALYTICS_WEBSITE_ID;
  return (
    <script
      defer
      src={src}
      {...(domain ? { "data-domain": domain } : {})}
      {...(websiteId ? { "data-website-id": websiteId } : {})}
    />
  );
}
