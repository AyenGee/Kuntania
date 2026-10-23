import { defineConfig } from "@playwright/test";

/**
 * End-to-end tests (tests/e2e).
 *
 *  - smoke.spec.ts needs NO database: public pages, headers, SEO files, admin gate.
 *  - checkout.spec.ts needs a real, migrated test database. Set E2E_DATABASE_URL to enable it.
 *    WARNING: that spec creates orders and seeds data. Use a disposable database, never production.
 *
 * Uses your installed Google Chrome by default (no browser download). Set
 * PLAYWRIGHT_CHANNEL=chromium after `npx playwright install chromium` to use Playwright's own.
 */

const PORT = 3100;
const BASE_URL = `http://localhost:${PORT}`;
export const E2E_DATABASE_URL = process.env.E2E_DATABASE_URL;
export const MOCK_YOCO_PORT = 3101;
/** Signing secret the e2e test uses to sign webhooks (base64 of a throwaway key). */
export const E2E_WEBHOOK_SECRET =
  "whsec_" + Buffer.from("e2e-webhook-key-0123456789").toString("base64");

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: BASE_URL,
    channel: process.env.PLAYWRIGHT_CHANNEL === "chromium" ? undefined : "chrome",
    trace: "retain-on-failure",
  },
  webServer: {
    // Builds, then serves the production build with a throwaway test configuration.
    command: `npm run build && npx next start -p ${PORT}`,
    // robots.txt needs no database, so it works for the database-free smoke tests too
    // (/api/health correctly answers 503 when the database is unreachable).
    url: `${BASE_URL}/robots.txt`,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    env: {
      NODE_ENV: "production",
      SITE_URL: BASE_URL,
      DATABASE_URL: E2E_DATABASE_URL ?? "postgresql://x:x@127.0.0.1:1/x",
      SESSION_SECRET: "e2e-session-secret-e2e-session-secret-0123456789",
      CRON_SECRET: "e2e-cron-secret",
      YOCO_SECRET_KEY: "sk_test_e2e",
      YOCO_WEBHOOK_SECRET: E2E_WEBHOOK_SECRET,
      // Stand-in for Yoco's API (only honoured with a sk_test_ key).
      YOCO_API_URL: `http://127.0.0.1:${MOCK_YOCO_PORT}/api`,
      OWNER_EMAIL: "owner@example.test",
      VAT_REGISTERED: "false",
    },
  },
});
