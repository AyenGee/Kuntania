"use server";

import { randomBytes } from "node:crypto";
import { getDb } from "@/lib/db";
import { sendMail } from "@/lib/email/send";
import { newsletterWelcomeEmail } from "@/lib/email/templates";
import { getEnv } from "@/lib/env";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  fieldErrorsFrom,
  newsletterSchema,
  type FormState,
} from "@/lib/validation/forms";

export async function subscribeToNewsletter(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    if (String(formData.get("website") ?? "") !== "") return { ok: true };

    if (!(await checkRateLimit("newsletter", 5, 60 * 60))) {
      return { ok: false, message: "Too many attempts. Please try again later." };
    }

    const parsed = newsletterSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
      return {
        ok: false,
        message: "Please check the highlighted fields.",
        fieldErrors: fieldErrorsFrom(parsed.error),
      };
    }
    const email = parsed.data.email.toLowerCase();

    const db = getDb();
    const existing = await db.newsletterSubscriber.findUnique({ where: { email } });

    // Already subscribed: respond identically and send nothing (no email enumeration).
    if (existing && !existing.unsubscribedAt) {
      return { ok: true, message: "Thanks! You're subscribed." };
    }

    const token = existing?.unsubscribeToken ?? randomBytes(24).toString("base64url");
    await db.newsletterSubscriber.upsert({
      where: { email },
      create: { email, source: parsed.data.source ?? "footer", unsubscribeToken: token },
      update: { unsubscribedAt: null, consentAt: new Date() },
    });

    const unsubscribeUrl = `${getEnv().SITE_URL}/unsubscribe?token=${token}`;
    await sendMail(newsletterWelcomeEmail(email, unsubscribeUrl));

    return { ok: true, message: "Thanks! You're subscribed." };
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "newsletter.failed",
        error: error instanceof Error ? error.message : String(error),
      }),
    );
    return { ok: false, message: "Sorry, something went wrong. Please try again." };
  }
}

export async function unsubscribeFromNewsletter(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const token = String(formData.get("token") ?? "");
  if (!token || token.length > 100)
    return { ok: false, message: "This unsubscribe link is not valid." };
  try {
    const result = await getDb().newsletterSubscriber.updateMany({
      where: { unsubscribeToken: token, unsubscribedAt: null },
      data: { unsubscribedAt: new Date() },
    });
    // updateMany count 0 means unknown token OR already unsubscribed; treat both as done
    // unless the token is unknown.
    if (result.count === 0) {
      const exists = await getDb().newsletterSubscriber.findUnique({
        where: { unsubscribeToken: token },
        select: { id: true },
      });
      if (!exists) return { ok: false, message: "This unsubscribe link is not valid." };
    }
    return { ok: true, message: "You have been unsubscribed." };
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "newsletter.unsubscribe_failed",
        error: error instanceof Error ? error.message : String(error),
      }),
    );
    return { ok: false, message: "Sorry, something went wrong. Please try again." };
  }
}
