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

  PAYFAST_MODE: z.enum(["sandbox", "live"]).default("sandbox"),
  PAYFAST_MERCHANT_ID: optionalString,
  PAYFAST_MERCHANT_KEY: optionalString,
  PAYFAST_PASSPHRASE: optionalString,
  /** TEST ONLY: replaces PayFast's validate URL, and only ever honoured in sandbox mode. */
  PAYFAST_VALIDATE_URL: optionalString,

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
  if (result.data.PAYFAST_MODE === "live" && !result.data.PAYFAST_PASSPHRASE) {
    throw new Error("PAYFAST_PASSPHRASE is required when PAYFAST_MODE=live");
  }
  cached = result.data;
  return cached;
}
