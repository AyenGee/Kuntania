/** Public base URL without trailing slash. Safe to use anywhere (does not require full env). */
export function siteUrl(): string {
  return (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}
