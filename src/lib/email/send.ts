import nodemailer from "nodemailer";
import { getEnv } from "@/lib/env";

export type MailInput = {
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
};

/** Escape user-supplied text before interpolating it into an HTML email. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Send an email. Never throws: failures are logged and reported via the return value,
 * so an email problem can never break an order, contact or signup flow.
 */
export async function sendMail(input: MailInput): Promise<boolean> {
  try {
    const env = getEnv();
    if (!env.SMTP_HOST || !env.EMAIL_FROM) {
      console.warn(
        JSON.stringify({ event: "email.skipped", reason: "SMTP not configured" }),
      );
      return false;
    }
    const transport = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    });
    await transport.sendMail({ from: env.EMAIL_FROM, ...input });
    console.info(JSON.stringify({ event: "email.sent", subject: input.subject }));
    return true;
  } catch (error) {
    // Log the subject and error only: never recipient addresses or message bodies.
    console.error(
      JSON.stringify({
        event: "email.failed",
        subject: input.subject,
        error: error instanceof Error ? error.message : String(error),
      }),
    );
    return false;
  }
}
