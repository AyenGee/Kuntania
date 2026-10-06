import { expect, test } from "@playwright/test";

/** Database-free checks: the site renders, is hardened, and the admin is locked. */

const PUBLIC_PAGES: [string, RegExp][] = [
  ["/about", /Our Story/i],
  ["/faq", /Frequently asked questions/i],
  ["/contact", /Contact us/i],
  ["/privacy", /Privacy Policy/i],
  ["/terms", /Terms & Conditions/i],
  ["/shipping-returns", /Shipping & Returns/i],
  ["/cart", /Your cart/i],
  ["/order-status", /Check your order/i],
];

test.describe("public pages", () => {
  for (const [path, heading] of PUBLIC_PAGES) {
    test(`${path} renders with a single h1`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading);
      await expect(page).toHaveTitle(/Kunta Nia/);
    });
  }

  test("policy pages show the DRAFT banner until approved", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.getByRole("note")).toContainText("DRAFT");
  });

  test("unknown URLs give a friendly 404 with the site header", async ({ page }) => {
    const response = await page.goto("/definitely-not-a-page");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Go to the shop" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();
  });
});

test.describe("accessibility basics", () => {
  test("the skip link is first in the tab order and jumps to the content", async ({
    page,
  }) => {
    await page.goto("/about");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Skip to content" });
    await expect(skip).toBeFocused();
    await expect(skip).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#main$/);
  });

  test("landmarks are present and the document has a language", async ({ page }) => {
    await page.goto("/faq");
    await expect(page.locator("html")).toHaveAttribute("lang", "en-ZA");
    await expect(page.getByRole("banner")).toHaveCount(1);
    await expect(page.getByRole("main")).toHaveCount(1);
    await expect(page.getByRole("contentinfo")).toHaveCount(1);
  });

  test("every form field on the contact page has an accessible name", async ({
    page,
  }) => {
    await page.goto("/contact");
    const form = page.locator("main form");
    for (const name of ["Name", "Email", "Phone (optional)", "Subject", "Message"]) {
      await expect(form.getByLabel(name, { exact: false }).first()).toBeVisible();
    }
    // The honeypot must be hidden from people and assistive tech.
    await expect(form.locator('input[name="website"]')).toHaveAttribute("tabindex", "-1");
    await expect(
      form.locator('input[name="website"]').locator("xpath=ancestor::div[1]"),
    ).toHaveAttribute("aria-hidden", "true");
  });

  test("keyboard focus is visible", async ({ page }) => {
    await page.goto("/contact");
    await page.getByLabel("Name", { exact: false }).first().focus();
    const outline = await page
      .getByLabel("Name", { exact: false })
      .first()
      .evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(outline).not.toBe("none");
  });
});

test.describe("security and SEO", () => {
  test("responses carry the security headers", async ({ request }) => {
    const res = await request.get("/about");
    const h = res.headers();
    expect(h["x-frame-options"]).toBe("DENY");
    expect(h["x-content-type-options"]).toBe("nosniff");
    expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(h["content-security-policy"]).toContain(
      "form-action 'self' https://www.payfast.co.za",
    );
    expect(h["x-powered-by"]).toBeUndefined();
  });

  test("robots.txt hides private areas and points at the sitemap", async ({
    request,
  }) => {
    const body = await (await request.get("/robots.txt")).text();
    expect(body).toContain("Disallow: /admin");
    expect(body).toContain("Disallow: /api/");
    expect(body).toContain("Disallow: /checkout");
    expect(body).toMatch(/Sitemap: .*\/sitemap\.xml/);
  });

  test("sitemap.xml lists the static pages even without a database", async ({
    request,
  }) => {
    const res = await request.get("/sitemap.xml");
    expect(res.status()).toBe(200);
    const body = await res.text();
    for (const path of ["/about", "/faq", "/contact", "/shop", "/privacy"]) {
      expect(body).toContain(`${path}</loc>`);
    }
    expect(body).not.toContain("/admin");
  });

  test("pages have a canonical URL and Open Graph tags", async ({ page }) => {
    await page.goto("/about");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      /\/about$/,
    );
    await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute(
      "content",
      "Kunta Nia",
    );
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      /.+/,
    );
  });

  test("Organization JSON-LD has no TODO placeholders", async ({ page }) => {
    await page.goto("/about");
    const json = await page
      .locator('script[type="application/ld+json"]')
      .first()
      .textContent();
    const data = JSON.parse(json ?? "{}");
    expect(data["@type"]).toBe("Organization");
    expect(json).not.toContain("TODO(CLIENT)");
  });

  test("no analytics script loads when none is configured", async ({ page }) => {
    await page.goto("/about");
    await expect(
      page.locator("script[data-domain], script[data-website-id]"),
    ).toHaveCount(0);
  });

  test("no cookies are set for anonymous visitors", async ({ page, context }) => {
    await page.goto("/about");
    await page.goto("/faq");
    expect(await context.cookies()).toEqual([]);
  });

  test("/api/health answers with a JSON status and never leaks details", async ({
    request,
  }) => {
    const res = await request.get("/api/health");
    expect([200, 503]).toContain(res.status());
    const body = await res.json();
    expect(Object.keys(body).sort()).toEqual(["db", "status"]);
    expect(res.headers()["cache-control"]).toContain("no-store");
  });
});

test.describe("admin is locked", () => {
  test("visitors are sent to the login page", async ({ page }) => {
    await page.goto("/admin/orders");
    await expect(page).toHaveURL(/\/admin\/login$/);
    await expect(page.getByRole("heading", { name: "Admin sign in" })).toBeVisible();
  });

  test("a forged session cookie does not open the admin", async ({ page, context }) => {
    await context.addCookies([
      { name: "kn_admin", value: "forged", url: "http://localhost:3100/admin" },
    ]);
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login$/);
  });

  test("CSV exports refuse anonymous and forged requests", async ({ request }) => {
    const anon = await request.get("/admin/subscribers/export", { maxRedirects: 0 });
    expect([307, 401]).toContain(anon.status());
    const forged = await request.get("/admin/subscribers/export", {
      headers: { cookie: "kn_admin=forged" },
      maxRedirects: 0,
    });
    expect(forged.status()).toBe(401);
  });

  test("cross-site POSTs to the admin are refused", async ({ request }) => {
    const evil = await request.post("/admin/login", {
      headers: {
        origin: "https://evil.example",
        "content-type": "application/x-www-form-urlencoded",
      },
      data: "email=a@b.co&password=x",
      maxRedirects: 0,
    });
    expect(evil.status()).toBe(403);
    const noOrigin = await request.post("/admin/login", {
      headers: { "content-type": "application/x-www-form-urlencoded" },
      data: "email=a@b.co&password=x",
      maxRedirects: 0,
    });
    expect(noOrigin.status()).toBe(403);
  });

  test("the admin login page is not indexable or cacheable", async ({ request }) => {
    const res = await request.get("/admin/login");
    expect(res.headers()["x-robots-tag"]).toContain("noindex");
    expect(res.headers()["cache-control"]).toContain("no-store");
  });
});

test.describe("payment notification endpoint", () => {
  test("rejects oversized bodies", async ({ request }) => {
    const res = await request.post("/api/payments/payfast/notify", {
      headers: { "content-type": "application/x-www-form-urlencoded" },
      data: "x=" + "a".repeat(30_000),
    });
    expect(res.status()).toBe(413);
  });

  test("the cron route needs the secret", async ({ request }) => {
    expect((await request.get("/api/cron/cancel-pending")).status()).toBe(401);
    expect(
      (
        await request.get("/api/cron/cancel-pending", {
          headers: { authorization: "Bearer wrong" },
        })
      ).status(),
    ).toBe(401);
  });
});
