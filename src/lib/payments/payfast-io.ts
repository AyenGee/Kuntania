import { resolve4 } from "node:dns/promises";
import { PAYFAST_VALID_HOSTS, PAYFAST_VALIDATE_URL, type PayfastMode } from "./payfast";

let cache: { ips: string[]; expires: number } | undefined;
const TTL_MS = 10 * 60 * 1000;

/** IPs PayFast's hostnames currently resolve to (cached for 10 minutes). */
export async function resolvePayfastIps(): Promise<string[]> {
  if (cache && cache.expires > Date.now()) return cache.ips;
  const results = await Promise.allSettled(PAYFAST_VALID_HOSTS.map((h) => resolve4(h)));
  const ips = [
    ...new Set(results.flatMap((r) => (r.status === "fulfilled" ? r.value : []))),
  ];
  if (ips.length > 0) cache = { ips, expires: Date.now() + TTL_MS };
  return ips;
}

/** Ask PayFast to confirm the ITN data is valid. True only for an exact "VALID" answer. */
export async function confirmWithPayfast(
  mode: PayfastMode,
  body: string,
  testOverrideUrl?: string,
): Promise<boolean> {
  // The override exists only so the end-to-end test can stand in for PayFast. It is never
  // honoured in live mode, so it can't be used to bypass PayFast's own confirmation.
  const url =
    mode === "sandbox" && testOverrideUrl ? testOverrideUrl : PAYFAST_VALIDATE_URL[mode];
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    signal: AbortSignal.timeout(10_000),
    cache: "no-store",
  });
  if (!response.ok) return false;
  return (await response.text()).trim() === "VALID";
}
