import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getIronSession, type SessionOptions } from "iron-session";
import { getDb } from "@/lib/db";
import { getEnv } from "@/lib/env";

export type AdminSessionData = { adminId?: string };

/** Absolute session lifetime: the owner signs in again after 8 hours. */
export const ADMIN_SESSION_TTL_SECONDS = 8 * 60 * 60;
export const ADMIN_COOKIE_NAME = "kn_admin";

function sessionOptions(): SessionOptions {
  return {
    cookieName: ADMIN_COOKIE_NAME,
    password: getEnv().SESSION_SECRET,
    ttl: ADMIN_SESSION_TTL_SECONDS,
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      // Only sent to /admin pages, never to the public storefront.
      path: "/admin",
    },
  };
}

export async function getAdminSession() {
  return getIronSession<AdminSessionData>(await cookies(), sessionOptions());
}

export type AdminIdentity = { id: string; email: string; name: string };

/**
 * The signed-in admin, or null. The session cookie is only a pointer: the admin must still
 * exist in the database, so deleting a user signs them out immediately.
 * Cached per request.
 */
export const getAdmin = cache(async (): Promise<AdminIdentity | null> => {
  const session = await getAdminSession();
  if (!session.adminId) return null;
  const admin = await getDb().adminUser.findUnique({
    where: { id: session.adminId },
    select: { id: true, email: true, name: true },
  });
  return admin;
});

/**
 * Server-side guard for every admin page, server action and admin route handler.
 * (The proxy only does a cheap optimistic redirect; this is the real check.)
 */
export async function requireAdmin(): Promise<AdminIdentity> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

/** Same check for route handlers, which should answer 401 rather than redirect. */
export async function adminOrNull(): Promise<AdminIdentity | null> {
  return getAdmin();
}
