import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { getDb } from "@/lib/db";

/** Best-effort client IP. On Vercel the first x-forwarded-for entry is set by the platform. */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown"
  );
}

/**
 * Fixed-window rate limit stored in Postgres, per client IP by default.
 * Pass `subject` to limit per something else instead (for example a login email), so one
 * attacker can't lock out everyone and many IPs can't hammer one account.
 * Returns true if the request is allowed. Only a SHA-256 hash of the IP/subject is stored.
 */
export async function checkRateLimit(
  action: string,
  limit: number,
  windowSeconds: number,
  subject?: string,
): Promise<boolean> {
  const who = subject ?? (await getClientIp());
  const key = `${action}:${createHash("sha256").update(who).digest("hex")}`;
  const windowMs = windowSeconds * 1000;
  const windowStart = new Date(Math.floor(Date.now() / windowMs) * windowMs);

  const row = await getDb().rateLimit.upsert({
    where: { key_windowStart: { key, windowStart } },
    create: { key, windowStart },
    update: { count: { increment: 1 } },
  });
  return row.count <= limit;
}
