import { z } from "zod";

const bool = z
  .enum(["true", "false"])
  .default("false")
  .transform((v) => v === "true");

const optionalString = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() !== "" ? v : undefined));

const schema = z.object({
  SITE_URL: z.url().default("http://localhost:3000"),
  DATABASE_URL: z.string().min(1),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be at least 32 characters"),
  CRON_SECRET: optionalString,

  VAT_REGISTERED: bool,
  POLICIES_APPROVED: bool,

  /** Yoco secret key: sk_test_... for testing, sk_live_... for real payments. */
  YOCO_SECRET_KEY: optionalString,
  /** Signing secret (whsec_...) returned when the webhook is registered. */
  YOCO_WEBHOOK_SECRET: optionalString,
  /** TEST ONLY: replaces Yoco's API address, and only ever honoured with a sk_test_ key. */
  YOCO_API_URL: optionalString,

  SMTP_HOST: optionalString,
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: bool,
  SMTP_USER: optionalString,
  SMTP_PASS: optionalString,
  EMAIL_FROM: optionalString,
  OWNER_EMAIL: optionalString,

  ANALYTICS_SCRIPT_URL: optionalString,
  ANALYTICS_DOMAIN: optionalString,
  ANALYTICS_WEBSITE_ID: optionalString,
});

export type Env = z.infer<typeof schema>;

let cached: Env | undefined;

/**
 * Validated server-side environment. Parsed lazily on first use (not at import time)
 * so `next build` and unit tests don't need every variable set.
 * Never import this from client components.
 */
export function getEnv(): Env {
  if (cached) return cached;
  const result = schema.safeParse(process.env);
  if (!result.success) {
    const details = result.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error(`Invalid environment configuration: ${details}`);
  }
  if (result.data.YOCO_SECRET_KEY && !result.data.YOCO_WEBHOOK_SECRET) {
    throw new Error(
      "YOCO_WEBHOOK_SECRET is required with YOCO_SECRET_KEY: without it payments could never be confirmed",
    );
  }
  cached = result.data;
  return cached;
}
