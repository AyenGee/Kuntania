import { execSync } from "node:child_process";
import { createServer, type Server } from "node:http";
import { expect, test, type Page } from "@playwright/test";
import {
  expectedItnSignature,
  phpUrlencode,
  signPayment,
  type Pair,
} from "../../src/lib/payments/payfast";
import { E2E_DATABASE_URL, MOCK_PAYFAST_PORT } from "../../playwright.config";

/**
 * Full purchase: browse -> add to cart -> checkout -> (stubbed) PayFast -> signed ITN ->
 * order shows PAID in the admin.
 *
 * Needs a disposable, migrated database: set E2E_DATABASE_URL. The spec seeds the products and
 * an admin user. PayFast is stood in for by (a) intercepting the browser's POST to the sandbox
 * payment page, and (b) a local server answering VALID to the ITN server-confirmation call.
 */

const ADMIN_EMAIL = "e2e-admin@example.test";
const ADMIN_PASSWORD = "e2e-admin-password-123";
const MERCHANT_ID = "10000100";
const PASSPHRASE = "e2e-passphrase";

test.skip(
  !E2E_DATABASE_URL,
  "Set E2E_DATABASE_URL (a disposable, migrated database) to run this test",
);

let validateServer: Server;
let validateCalls = 0;

test.beforeAll(async () => {
  execSync("npx tsx prisma/seed.ts", {
    stdio: "inherit",
    env: {
      ...process.env,
      DATABASE_URL: E2E_DATABASE_URL,
      ADMIN_EMAIL,
      ADMIN_PASSWORD,
      ADMIN_NAME: "E2E Admin",
    },
  });
  // Stand-in for PayFast's /eng/query/validate endpoint.
  validateServer = createServer((req, res) => {
    req.resume();
    validateCalls++;
    res.writeHead(200, { "Content-Type": "text/plain" }).end("VALID");
  });
  await new Promise<void>((resolve) =>
    validateServer.listen(MOCK_PAYFAST_PORT, "127.0.0.1", resolve),
  );
});

test.afterAll(async () => {
  await new Promise((resolve) => validateServer?.close(resolve));
});

function parseForm(body: string): Record<string, string> {
  return Object.fromEntries(new URLSearchParams(body).entries());
}

/** A PayFast-style ITN body for an order, signed with the shared passphrase. */
function itnBody(
  fields: { orderNumber: string; amount: string },
  overrides: Record<string, string> = {},
) {
  const base: Record<string, string> = {
    m_payment_id: fields.orderNumber,
    pf_payment_id: "1089250",
    payment_status: "COMPLETE",
    item_name: `Kunta Nia order ${fields.orderNumber}`,
    amount_gross: fields.amount,
    amount_fee: "-5.00",
    amount_net: "0.00",
    merchant_id: MERCHANT_ID,
    ...overrides,
  };
  const pairs = Object.entries(base) as Pair[];
  const signature = overrides.signature ?? expectedItnSignature(pairs, PASSPHRASE);
  const withSig: Pair[] = [
    ...pairs.filter(([k]) => k !== "signature"),
    ["signature", signature],
  ];
  return withSig.map(([k, v]) => `${k}=${phpUrlencode(v)}`).join("&");
}

async function fillCheckout(page: Page) {
  const form = page.locator("main form");
  await form.getByLabel("Email", { exact: false }).fill("thandi.e2e@example.test");
  await form.getByLabel("Mobile number", { exact: false }).fill("082 123 4567");
  await form.getByLabel("First name", { exact: false }).fill("Thandi");
  await form.getByLabel("Last name", { exact: false }).fill("Nkosi");
  await form.getByLabel("Street address", { exact: false }).fill("12 Main Road");
  await form.getByLabel("Suburb", { exact: false }).fill("Parktown");
  await form.getByLabel("City / town", { exact: false }).fill("Johannesburg");
  await form.getByLabel("Province", { exact: false }).selectOption({ label: "Gauteng" });
  await form.getByLabel("Postal code", { exact: false }).fill("2193");
  await form.getByRole("checkbox", { name: /Terms/ }).check();
}

test("customer buys, PayFast confirms, owner sees a paid order", async ({
  page,
  request,
}) => {
  // The browser is sent to PayFast's sandbox with a signed form POST: capture it and stub the page.
  let payfastPost = "";
  await page.route("https://sandbox.payfast.co.za/**", async (route) => {
    payfastPost = route.request().postData() ?? "";
    await route.fulfill({
      status: 200,
      contentType: "text/html",
      body: "<html><body><h1>PayFast sandbox (test stub)</h1></body></html>",
    });
  });

  // 1. Browse and add to cart.
  await page.goto("/shop");
  await page
    .getByRole("link", { name: /Hair Growth Oil/ })
    .first()
    .click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Hair Growth Oil");
  await page.getByRole("button", { name: "Add to cart" }).click();
  await expect(page.getByText(/Added .* to your cart/)).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Main" })).toContainText("1");

  // 2. Cart shows the item priced by the server.
  await page.goto("/cart");
  await expect(page.getByText("Hair Growth Oil").first()).toBeVisible();
  await page.getByRole("link", { name: "Checkout" }).click();

  // 3. Checkout.
  await expect(page.getByRole("heading", { name: "Checkout" })).toBeVisible();
  await fillCheckout(page);
  await page.getByRole("button", { name: "Place order and pay" }).click();

  // 4. The browser was handed to PayFast with a correctly signed request.
  await expect.poll(() => payfastPost, { timeout: 20_000 }).not.toBe("");
  const sent = parseForm(payfastPost);
  expect(sent.merchant_id).toBe(MERCHANT_ID);
  expect(sent.m_payment_id).toMatch(/^KN-\d+$/);
  expect(sent.amount).toMatch(/^\d+\.\d{2}$/);
  expect(sent.notify_url).toMatch(/\/api\/payments\/payfast\/notify$/);
  const sentPairs = Object.entries(sent).filter(([k]) => k !== "signature") as Pair[];
  expect(sent.signature).toBe(signPayment(sentPairs, PASSPHRASE));
  const orderNumber = sent.m_payment_id;

  // 5. Coming back before PayFast has confirmed must NOT show the order as paid.
  await page.goto(`/checkout/success?order=${orderNumber}`);
  await expect(page.getByText(orderNumber)).toBeVisible();
  await expect(page.getByText(/confirming your payment/i)).toBeVisible();
  // ...and the cart is cleared once an order has been placed.
  await expect(page.getByRole("navigation", { name: "Main" })).not.toContainText(/\d/);

  // 6. Forged notifications are ignored: bad signature, and a tampered amount.
  const forged = await request.post("/api/payments/payfast/notify", {
    headers: { "content-type": "application/x-www-form-urlencoded" },
    data: itnBody({ orderNumber, amount: sent.amount }, { signature: "0".repeat(32) }),
  });
  expect(forged.status()).toBe(200);
  const wrongAmount = await request.post("/api/payments/payfast/notify", {
    headers: { "content-type": "application/x-www-form-urlencoded" },
    data: itnBody({ orderNumber, amount: "1.00" }),
  });
  expect(wrongAmount.status()).toBe(200);
  await page.goto(`/checkout/success?order=${orderNumber}`);
  await expect(page.getByText(/confirming your payment/i)).toBeVisible();

  // 7. The genuine, correctly signed notification marks the order paid.
  const callsBefore = validateCalls;
  const itn = await request.post("/api/payments/payfast/notify", {
    headers: { "content-type": "application/x-www-form-urlencoded" },
    data: itnBody({ orderNumber, amount: sent.amount }),
  });
  expect(itn.status()).toBe(200);
  expect(validateCalls).toBeGreaterThan(callsBefore); // the server asked "PayFast" to confirm
  await page.goto(`/checkout/success?order=${orderNumber}`);
  await expect(page.getByText(/Payment received/i)).toBeVisible();

  // 8. A repeated notification changes nothing (idempotent).
  const replay = await request.post("/api/payments/payfast/notify", {
    headers: { "content-type": "application/x-www-form-urlencoded" },
    data: itnBody({ orderNumber, amount: sent.amount }),
  });
  expect(replay.status()).toBe(200);

  // 9. The owner signs in and sees the order as paid, with exactly one payment event.
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login$/);
  await page.getByLabel("Email").fill(ADMIN_EMAIL);
  await page.getByLabel("Password").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByText("Orders to ship")).toBeVisible();

  await page.goto("/admin/orders");
  await page.getByRole("link", { name: orderNumber }).click();
  await expect(page.getByRole("heading", { name: `Order ${orderNumber}` })).toBeVisible();
  await expect(page.getByText("Payment received").first()).toBeVisible();
  await expect(page.getByText(/Payment received \(PayFast ref 1089250\)/)).toHaveCount(1);
});
