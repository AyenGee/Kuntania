"use server";

import { getDb } from "@/lib/db";
import { contactAckEmail, contactOwnerEmail } from "@/lib/email/templates";
import { sendMail } from "@/lib/email/send";
import { getEnv } from "@/lib/env";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  contactSchema,
  fieldErrorsFrom,
  valuesFrom,
  type FormState,
} from "@/lib/validation/forms";

const GENERIC_ERROR = "Sorry, something went wrong. Please try again in a moment.";

export async function submitContact(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    // Honeypot: pretend success so bots learn nothing.
    if (String(formData.get("website") ?? "") !== "") return { ok: true };

    if (!(await checkRateLimit("contact", 5, 60 * 60))) {
      return {
        ok: false,
        message: "Too many messages from your connection. Please try again later.",
      };
    }

    const parsed = contactSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
      return {
        ok: false,
        message: "Please check the highlighted fields.",
        fieldErrors: fieldErrorsFrom(parsed.error),
        values: valuesFrom(formData),
      };
    }
    const data = parsed.data;

    await getDb().contactMessage.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        subject: data.subject,
        message: data.message,
      },
    });
    console.info(JSON.stringify({ event: "contact.received" }));

    const ownerEmail = getEnv().OWNER_EMAIL;
    if (ownerEmail) await sendMail(contactOwnerEmail(ownerEmail, data));
    await sendMail(contactAckEmail(data.email, data.name));

    return { ok: true };
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "contact.failed",
        error: error instanceof Error ? error.message : String(error),
      }),
    );
    return { ok: false, message: GENERIC_ERROR, values: valuesFrom(formData) };
  }
}
