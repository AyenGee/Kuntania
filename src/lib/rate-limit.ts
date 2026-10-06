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
 * Fixed-window per-IP rate limit stored in Postgres.
 * Returns true if the request is allowed. The IP is stored only as a SHA-256 hash.
 */
export async function checkRateLimit(
  action: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  const ip = await getClientIp();
  const key = `${action}:${createHash("sha256").update(ip).digest("hex")}`;
  const windowMs = windowSeconds * 1000;
  const windowStart = new Date(Math.floor(Date.now() / windowMs) * windowMs);

  const row = await getDb().rateLimit.upsert({
    where: { key_windowStart: { key, windowStart } },
    create: { key, windowStart },
    update: { count: { increment: 1 } },
  });
  return row.count <= limit;
}
