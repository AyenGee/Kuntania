"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { getAdminSession } from "@/lib/admin/session";
import { checkRateLimit } from "@/lib/rate-limit";
import type { FormState } from "@/lib/validation/forms";

const schema = z.object({
  email: z.email().max(254),
  password: z.string().min(1).max(200),
});

// Compared against when the email is unknown, so response time doesn't reveal which emails exist.
const DUMMY_HASH = "$2b$12$YnK3MjoGviMYDogouSLRGeTrNK3xh8boWB0nJc96MobTCqk70TysG";

const FAILED = "Incorrect email or password.";
const WINDOW_SECONDS = 15 * 60;

export async function loginAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    const parsed = schema.safeParse({
      email: String(formData.get("email") ?? "")
        .trim()
        .toLowerCase(),
      password: String(formData.get("password") ?? ""),
    });

    // Per-IP limit first (cheap), then per-account limit once we know the email.
    if (!(await checkRateLimit("admin-login-ip", 20, WINDOW_SECONDS))) {
      return { ok: false, message: "Too many sign-in attempts. Please wait 15 minutes." };
    }
    if (!parsed.success) return { ok: false, message: FAILED };
    const { email, password } = parsed.data;
    if (!(await checkRateLimit("admin-login-email", 8, WINDOW_SECONDS, email))) {
      return { ok: false, message: "Too many sign-in attempts. Please wait 15 minutes." };
    }

    const db = getDb();
    const admin = await db.adminUser.findUnique({ where: { email } });
    const passwordOk = await bcrypt.compare(password, admin?.passwordHash ?? DUMMY_HASH);
    if (!admin || !passwordOk) {
      console.warn(JSON.stringify({ event: "admin.login_failed" }));
      return { ok: false, message: FAILED };
    }

    const session = await getAdminSession();
    session.adminId = admin.id;
    await session.save();
    await db.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });
    console.info(JSON.stringify({ event: "admin.login_ok" }));
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "admin.login_error",
        error: error instanceof Error ? error.message : String(error),
      }),
    );
    return { ok: false, message: "Sorry, something went wrong. Please try again." };
  }
  // redirect() throws, so it stays outside the try/catch.
  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  const session = await getAdminSession();
  session.destroy();
  redirect("/admin/login");
}
