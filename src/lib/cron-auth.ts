import { timingSafeEqual } from "node:crypto";

/**
 * Check an "Authorization: Bearer <secret>" header against the configured secret in
 * constant time. Vercel Cron sends this header automatically when CRON_SECRET is set.
 * An unset secret never authorises anything.
 */
export function isAuthorizedCron(
  header: string | null | undefined,
  secret: string | undefined,
): boolean {
  if (!secret || !header) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(header);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
