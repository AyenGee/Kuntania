import { createHash } from "node:crypto";

/**
 * A short fingerprint of an admin's password hash, stored in their session cookie. Changing the
 * password (for example resetting it after it leaked) changes the fingerprint, so every cookie
 * issued before the change stops working at once instead of living on for the rest of its
 * 8 hours. Only a one-way hash of the stored hash is kept in the cookie.
 */
export function passwordVersion(passwordHash: string): string {
  return createHash("sha256").update(passwordHash).digest("base64url").slice(0, 16);
}
