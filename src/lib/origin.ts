/**
 * CSRF defence in depth for admin mutations. Next.js server actions already compare the
 * Origin header with the Host; the proxy applies the same rule to every non-GET request under
 * /admin. A state-changing request must carry an Origin that matches the site's own host
 * (browsers always send Origin on cross-site and same-site POSTs). Combined with the
 * SameSite=Lax session cookie, a third-party page cannot make the owner's browser act.
 */
export function isSameOrigin(
  origin: string | null,
  host: string | null,
  forwardedHost: string | null,
): boolean {
  if (!origin) return false;
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    return false;
  }
  const candidates = [host, forwardedHost?.split(",")[0]?.trim()].filter(
    (h): h is string => Boolean(h),
  );
  return candidates.includes(originHost);
}

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function isMutation(method: string): boolean {
  return !SAFE_METHODS.has(method.toUpperCase());
}
