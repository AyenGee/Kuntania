import { execSync } from "node:child_process";
import { createHmac } from "node:crypto";
import { createServer, type Server } from "node:http";
import { expect, test, type Page } from "@playwright/test";
import {
  E2E_DATABASE_URL,
  E2E_WEBHOOK_SECRET,
  MOCK_YOCO_PORT,
} from "../../playwright.config";

/**
 * Full purchase: browse -> add to cart -> checkout -> (stubbed) Yoco -> signed webhook ->
 * order shows PAID in the admin.
 *
 * Needs a disposable, migrated database: set E2E_DATABASE_URL. The spec seeds the products and
 * an admin user. Yoco is stood in for by (a) a local server answering the "create checkout"
 * API call with a payment page address, and (b) webhooks signed here with the shared secret.
 */

const ADMIN_EMAIL = "e2e-admin@example.test";
const ADMIN_PASSWORD = "e2e-admin-password-123";
const CHECKOUT_ID = "ch_e2e_123";

test.skip(
  !E2E_DATABASE_URL,
  "Set E2E_DATABASE_URL (a disposable, migrated database) to run this test",
);

let yocoServer: Server;
let checkoutRequest: {
  headers: Record<string, unknown>;
  body: Record<string, unknown>;
} | null = null;

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
  // Stand-in for Yoco's POST /api/checkouts.
  yocoServer = createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      checkoutRequest = {
        headers: req.headers,
        body: JSON.parse(Buffer.concat(chunks).toString() || "{}"),
      };
      res.writeHead(200, { "Content-Type": "application/json" }).end(
        JSON.stringify({
          id: CHECKOUT_ID,
          redirectUrl: `http://127.0.0.1:${MOCK_YOCO_PORT}/pay/${CHECKOUT_ID}`,
        }),
      );
    });
  });
  await new Promise<void>((resolve) =>
    yocoServer.listen(MOCK_YOCO_PORT, "127.0.0.1", resolve),
  );
});

test.afterAll(async () => {
  await new Promise((resolve) => yocoServer?.close(resolve));
});

/** A Yoco-style webhook for an order, signed the way Yoco signs (Standard Webhooks). */
function webhook(
  fields: { orderNumber: string; amountCents: number },
  opts: { secret?: string; type?: string } = {},
) {
  const body = JSON.stringify({
    id: "evt_e2e",
    type: opts.type ?? "payment.succeeded",
    payload: {
      id: "pay_e2e_1",
      amount: fields.amountCents,
      currency: "ZAR",
      status: "succeeded",
      mode: "test",
      metadata: { checkoutId: CHECKOUT_ID, orderNumber: fields.orderNumber },
    },
  });
  const id = "msg_e2e";
  const timestamp = String(Math.floor(Date.now() / 1000));
  const key = Buffer.from(
    (opts.secret ?? E2E_WEBHOOK_SECRET).replace(/^whsec_/, ""),
    "base64",
  );
  const signature = createHmac("sha256", key)
    .update(`${id}.${timestamp}.${body}`)
    .digest("base64");
  return {
    headers: {
      "content-type": "application/json",
      "webhook-id": id,
      "webhook-timestamp": timestamp,
      "webhook-signature": `v1,${signature}`,
    },
    data: body,
  };
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

test("customer buys, Yoco confirms, owner sees a paid order", async ({
  page,
  request,
}) => {
  // The browser is sent to Yoco's payment page: stub the page.
  await page.route(`http://127.0.0.1:${MOCK_YOCO_PORT}/pay/**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/html",
      body: "<html><body><h1>Yoco checkout (test stub)</h1></body></html>",
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

  // 4. The browser was handed to Yoco, and the checkout we created has the exact total.
  await expect(page.getByText("Yoco checkout (test stub)")).toBeVisible({
    timeout: 20_000,
  });
  expect(checkoutRequest).not.toBeNull();
  expect(checkoutRequest!.headers.authorization).toBe("Bearer sk_test_e2e");
  const sent = checkoutRequest!.body as {
    amount: number;
    currency: string;
    metadata: { orderNumber: string };
    successUrl: string;
  };
  expect(sent.currency).toBe("ZAR");
  expect(Number.isInteger(sent.amount)).toBe(true);
  expect(sent.metadata.orderNumber).toMatch(/^KN-\d+$/);
  expect(sent.successUrl).toMatch(/\/checkout\/success\?order=KN-\d+$/);
  const orderNumber = sent.metadata.orderNumber;
  const amountCents = sent.amount;

  // 5. Coming back before Yoco has confirmed must NOT show the order as paid.
  await page.goto(`/checkout/success?order=${orderNumber}`);
  await expect(page.getByText(orderNumber)).toBeVisible();
  await expect(page.getByText(/confirming your payment/i)).toBeVisible();
  // ...and the cart is cleared once an order has been placed.
  await expect(page.getByRole("navigation", { name: "Main" })).not.toContainText(/\d/);

  // 6. Forged notifications are ignored: wrong signing secret, and a tampered amount.
  const otherSecret =
    "whsec_" + Buffer.from("not-the-real-secret-000000").toString("base64");
  const forged = await request.post("/api/payments/yoco/webhook", {
    ...webhook({ orderNumber, amountCents }, { secret: otherSecret }),
  });
  expect(forged.status()).toBe(401);
  const wrongAmount = await request.post("/api/payments/yoco/webhook", {
    ...webhook({ orderNumber, amountCents: 100 }),
  });
  expect(wrongAmount.status()).toBe(200);
  await page.goto(`/checkout/success?order=${orderNumber}`);
  await expect(page.getByText(/confirming your payment/i)).toBeVisible();

  // 7. The genuine, correctly signed webhook marks the order paid.
  const ok = await request.post("/api/payments/yoco/webhook", {
    ...webhook({ orderNumber, amountCents }),
  });
  expect(ok.status()).toBe(200);
  await page.goto(`/checkout/success?order=${orderNumber}`);
  await expect(page.getByText(/Payment received/i)).toBeVisible();

  // 8. A repeated webhook changes nothing (idempotent).
  const replay = await request.post("/api/payments/yoco/webhook", {
    ...webhook({ orderNumber, amountCents }),
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
  await expect(page.getByText(/Payment received \(Yoco payment pay_e2e_1\)/)).toHaveCount(
    1,
  );
});
