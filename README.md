# Kunta Nia online shop

A small, secure e-commerce site for **Kunta Nia**, a South African natural hair care brand. Guest
checkout, payments through **PayFast**, and a simple admin area for the owner (orders, stock,
prices, discount codes). All money is **ZAR, stored as integer cents**.

- Priorities, in order: correct and secure checkout, easy for the owner to run, legally
  compliant for South Africa, fast and SEO-friendly, then looks.
- Styling is deliberately neutral and centralised in
  [`src/styles/tokens.css`](src/styles/tokens.css), so a designer can restyle without touching logic.
- Plain-language guide for the shop owner: [`docs/OWNER_GUIDE.md`](docs/OWNER_GUIDE.md).
- Before going live: [`docs/LAUNCH_CHECKLIST.md`](docs/LAUNCH_CHECKLIST.md).
- Everything still needed from the client: [`docs/CLIENT_TODO.md`](docs/CLIENT_TODO.md).

## Stack

Next.js (App Router) + TypeScript (strict) · Tailwind CSS · PostgreSQL + Prisma · Zod ·
PayFast · Nodemailer (SMTP) · iron-session + bcrypt (admin login) · Vitest + Playwright.
Hosting target: Vercel (app) + a managed Postgres (Neon or Supabase).

> **Next.js 16 note:** this is a recent Next.js. Middleware is called **Proxy** (`src/proxy.ts`).
> `node_modules/next/dist/docs/` has the docs for the exact installed version.

---

## 1. Run it locally

You need **Node 22+** and **Docker** (for a local Postgres).

```bash
npm install                      # also generates the Prisma client
cp .env.example .env             # then edit .env (see "Environment variables")
npm run db:up                    # starts Postgres in Docker (docker-compose.yml)
npm run db:migrate               # creates the tables
npm run db:seed                  # creates the two products and (if ADMIN_* are set) an admin
npm run admin:create -- --email you@example.com --name "Your Name"   # or create/reset an admin
npm run dev                      # http://localhost:3000
```

The minimum `.env` for local work is `DATABASE_URL` (the default in `.env.example` matches
`docker-compose.yml`) and `SESSION_SECRET` (generate one:
`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`).
Without SMTP settings emails are skipped (a warning is logged); without PayFast keys checkout
stops with a friendly message instead of creating an order.

The admin is at `/admin`.

### Scripts

| Command                                                  | What it does                                                                           |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `npm run dev` / `build` / `start`                        | Next.js dev server / production build / serve the build                                |
| `npm run lint` · `typecheck` · `format` · `format:check` | ESLint · TypeScript · Prettier                                                         |
| `npm test`                                               | Unit tests (Vitest)                                                                    |
| `npm run test:smoke`                                     | Browser smoke tests that need **no database** (uses your installed Chrome)             |
| `npm run test:e2e`                                       | Everything above plus the full checkout test (needs `E2E_DATABASE_URL`, see "Testing") |
| `npm run db:up`                                          | Start local Postgres (Docker)                                                          |
| `npm run db:migrate`                                     | Create/apply migrations in development                                                 |
| `npm run db:deploy`                                      | Apply existing migrations (production)                                                 |
| `npm run db:seed`                                        | Create the two products and the first admin if they don't exist (never overwrites)     |
| `npm run db:studio`                                      | Browse the database in a browser                                                       |
| `npm run admin:create`                                   | Create an admin user, or reset an existing admin's password                            |

---

## 2. Environment variables

Documented line by line in [`.env.example`](.env.example). Validated at runtime by
[`src/lib/env.ts`](src/lib/env.ts). Never commit real values.

| Variable                                                           | Required            | Purpose                                                                                                             |
| ------------------------------------------------------------------ | ------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `SITE_URL`                                                         | yes                 | Public base URL, no trailing slash. Used for canonical URLs, emails and PayFast callbacks.                          |
| `DATABASE_URL`                                                     | yes                 | PostgreSQL connection string used by the running app.                                                               |
| `DIRECT_DATABASE_URL`                                              | optional            | Direct (non-pooled) connection used only for migrations. Set it if your host gives you a pooled `DATABASE_URL`.     |
| `SESSION_SECRET`                                                   | yes                 | 32+ random characters; signs the admin session cookie.                                                              |
| `CRON_SECRET`                                                      | yes in production   | Authorises the daily clean-up job (`Authorization: Bearer ...`). Vercel Cron sends it automatically once set.       |
| `VAT_REGISTERED`                                                   | yes                 | `true` if VAT registered (prices are VAT-inclusive, 15%). Shows "VAT included" lines and stores the VAT amount.     |
| `POLICIES_APPROVED`                                                | yes                 | `true` **only** once the client has approved the policy pages. Until then a red "DRAFT" banner shows in production. |
| `PAYFAST_MODE`                                                     | yes                 | `sandbox` or `live`.                                                                                                |
| `PAYFAST_MERCHANT_ID`, `PAYFAST_MERCHANT_KEY`                      | yes                 | From your PayFast account (use sandbox credentials in sandbox mode).                                                |
| `PAYFAST_PASSPHRASE`                                               | live: yes           | Must match the passphrase set in the PayFast dashboard.                                                             |
| `PAYFAST_VALIDATE_URL`                                             | never in production | Test-only stand-in for PayFast's validation endpoint. Ignored unless `PAYFAST_MODE=sandbox`. Leave blank.           |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`  | for email           | Any SMTP provider (the client's business email works).                                                              |
| `EMAIL_FROM`                                                       | for email           | e.g. `Kunta Nia <orders@yourdomain.co.za>`.                                                                         |
| `OWNER_EMAIL`                                                      | for email           | Receives new-order alerts and contact messages; also used as Reply-To on customer emails.                           |
| `ANALYTICS_SCRIPT_URL`, `ANALYTICS_DOMAIN`, `ANALYTICS_WEBSITE_ID` | optional            | One cookieless analytics script (Plausible or Umami). Nothing loads if blank.                                       |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`                      | seed only           | Used by `npm run db:seed` to create the first admin.                                                                |
| `E2E_DATABASE_URL`                                                 | tests only          | Disposable database for the Playwright checkout test.                                                               |

---

## 3. How the project is organised

```
content/            All editable copy and business settings (no code changes needed)
  site.ts             Business details (footer, ECT Act), shipping rates, stock settings
  home.ts about.ts faq.ts pages.ts emails.ts   Page and email wording
  products.ts         Seed data for the two products (the database is the source of truth afterwards)
  policies/*.md       Terms, Privacy (POPIA), Shipping & Returns drafts
prisma/             Schema, migrations, seed
src/app/(site)/     Public pages (home, shop, product, cart, checkout, content pages, order lookup)
src/app/admin/      Admin: login, dashboard, orders, products, discounts, messages, subscribers
src/app/api/        PayFast notification, cron clean-up, health check
src/lib/            Business logic: pricing, shipping, discounts, cart, payments/, email/, admin/
src/components/     UI components
src/styles/tokens.css   The ONLY place colours, fonts and radii are defined
docs/               Owner guide, launch checklist, client to-do list
tests/e2e/          Playwright tests
```

**Editing copy:** change the files in `content/`. Every unfinished item is marked
`TODO(CLIENT)`; find them all with `grep -rn "TODO(CLIENT)" content src` and track them in
[`docs/CLIENT_TODO.md`](docs/CLIENT_TODO.md).

**Restyling:** edit `src/styles/tokens.css` (colours, radii, widths) and `src/app/fonts.ts`
(fonts). Email colours are separate (inline styles) in `src/lib/email/layout.ts`.

**Products after launch:** the owner edits name, copy, price, stock, photos and visibility in
`/admin/products`. Re-running the seed never overwrites those edits.

**Site imagery:** the client's phone photos are turned into web-sized images by
`python scripts/prepare-images.py "<folder of originals>"` (needs Pillow), which writes to
`public/images/site` and `public/images/products`. `content/images.ts` lists each image, its alt
text and whether it is a **real** product photo or an **AI-generated mood** image (mood images
must never be used as the product shot).

**Previewing without a database:** under `npm run dev`, if Postgres can't be reached the shop
shows the seed products so the layout can be reviewed. This fallback is disabled in production
builds. Cart and checkout still need a real database.

**Product photos:** put the image files in `public/images/products/` and deploy; then list them
(with a description each) on the product's admin page. The placeholder SVGs must be replaced
before launch.

---

## 4. How an order works

1. **Cart** lives in the browser (`localStorage`) as `{productId, quantity}` only. Prices are never
   trusted from the browser.
2. **Checkout** validates the form (Zod), re-loads products from the database, checks stock,
   applies the discount and shipping, and computes every total **on the server**
   ([`src/lib/cart-resolve.ts`](src/lib/cart-resolve.ts) is shared by the cart preview and order
   creation, so what the customer sees is exactly what is charged).
3. A `PENDING_PAYMENT` order is created in a transaction (with price/name snapshots and a
   `KN-` number from a database sequence), and the browser is sent to PayFast with a signed form.
4. **PayFast calls back** (`/api/payments/payfast/notify`, the "ITN"). This is the **only** thing
   that marks an order paid. It logs the raw notification, then checks the **signature**, that it
   came from a **PayFast address** (live mode), that the **amount matches to the cent**, and asks
   PayFast's own server to **confirm** it. Only then, and only for `COMPLETE`, it marks the order
   `PAID`, reduces stock, counts the discount use and sends the emails: all in one idempotent
   step, so a repeated notification does nothing.
5. The success page never marks anything paid; it shows "confirming your payment" until the
   notification has landed.
6. Unpaid orders are cancelled after 48 hours by a daily job (`/api/cron/cancel-pending`,
   scheduled in [`vercel.json`](vercel.json)). A late payment on a cancelled order reinstates it.
7. If stock ran out between checkout and payment, the order is still marked paid, and flagged
   "Stock problem" in the admin and in the owner's alert email.

---

## 5. Deploying to Vercel

1. **Postgres.** Create a database with Neon or Supabase. Copy the connection string(s).
   If the host offers both a pooled and a direct URL, use the pooled one as `DATABASE_URL` and
   the direct one as `DIRECT_DATABASE_URL`.
2. **Push the code** to a Git repository and **import it in Vercel** (framework: Next.js).
3. **Environment variables.** In Vercel, Project Settings, Environment Variables, add everything
   from the table above for _Production_ (and _Preview_ if you want preview deployments to work).
   Set `SITE_URL` to the final public URL (for example `https://www.yourdomain.co.za`).
4. **Build command.** Set it to `npx prisma migrate deploy && npm run build` so the database is
   migrated on every deploy. (`DATABASE_URL` / `DIRECT_DATABASE_URL` must be available at build time.)
5. **Deploy.** Then, **once**, from your own computer with the _production_ connection string:

   ```bash
   DATABASE_URL="<production url>" npm run db:seed          # creates the two products
   DATABASE_URL="<production url>" npm run admin:create -- --email owner@yourdomain.co.za --name "Owner"
   ```

   (On Windows PowerShell use `$env:DATABASE_URL="<production url>"; npm run db:seed`.)

6. **Cron.** `vercel.json` schedules the daily clean-up. It needs `CRON_SECRET` to be set; Vercel
   then sends it automatically.
7. **Domain.** Project Settings, Domains: add your domain and follow Vercel's DNS instructions.
   HTTPS certificates are issued automatically. Update `SITE_URL` to match, then redeploy.
8. **Health check.** Point an uptime monitor (for example UptimeRobot) at `/api/health`: it
   answers `200` when the app can reach the database and `503` when it can't.

### Email deliverability

Use a real SMTP account on the client's domain. On the sending domain set up **SPF, DKIM and
DMARC** records (your email provider shows the exact values), otherwise order emails land in spam.
Send yourself a test order and check inbox placement in Gmail and Outlook.

### PayFast: sandbox to live

1. **Sandbox first.** Create a PayFast _sandbox_ account (see PayFast's developer documentation),
   set `PAYFAST_MODE=sandbox` and the sandbox merchant ID, key and passphrase. PayFast must be able
   to reach `SITE_URL/api/payments/payfast/notify`, so test on a Vercel preview/production URL or
   through a tunnel (such as ngrok), **not** `localhost`.
2. Place a test order and pay with the sandbox. Confirm the order turns **Payment received** and
   the emails arrive.
3. **Go live.** In Vercel set `PAYFAST_MODE=live` and the **live** merchant ID, key and passphrase
   (the passphrase must be set in the PayFast dashboard _and_ match `PAYFAST_PASSPHRASE`). Make
   sure ITN is enabled on the live account. Redeploy.
4. Do one **real-money test order** (a small amount), confirm it shows as paid, then **refund** it
   in the PayFast dashboard and mark the order refunded in the admin.

### Backups

Turn on and verify automated backups **before launch**; orders and customers live only in this
database.

- **Neon:** uses point-in-time restore; how far back you can restore depends on your plan.
- **Supabase:** daily backups depend on your plan.
- Whatever the host offers, also take a **manual export** regularly as a second copy (monthly at
  minimum, and before any risky change):

  ```bash
  pg_dump "<production url>" --format=custom --file=kuntania-$(date +%F).dump
  ```

  Store the file somewhere safe and off the hosting account. Restoring is tested with
  `pg_restore` into an empty database; try it once so you know it works.

---

## 6. Security and privacy decisions

- **Input:** every form and API input is validated server-side with Zod; the database is only
  accessed through Prisma (no raw SQL with user input).
- **Admin:** signed, encrypted, `httpOnly` cookie session (8-hour lifetime, scoped to `/admin`),
  bcrypt passwords, login rate limiting per IP **and** per account, constant-time-ish failed logins.
  Every admin page, server action and export checks the session itself (the layout check alone is
  not enough); `src/lib/admin/admin-guards.test.ts` fails the build if any admin file forgets.
- **CSRF:** Next.js checks the Origin on server actions; `src/proxy.ts` also rejects any
  non-GET request under `/admin` that doesn't come from the site's own origin.
- **Headers:** Content Security Policy, HSTS (https only), `X-Frame-Options: DENY`, `nosniff`,
  a strict referrer policy and permissions policy ([`src/lib/security-headers.ts`](src/lib/security-headers.ts)).
  _Trade-off:_ the CSP allows inline scripts, because Next.js needs them and a per-request nonce
  would make every page render dynamically. Everything else in the policy is strict, and forms may
  only be posted to the site itself and PayFast.
- **Abuse:** honeypot fields and Postgres-backed per-IP rate limits on checkout, contact,
  newsletter, order lookup, discount codes and login. Only a hash of the IP is stored.
- **Payments:** the ITN checks listed above; prices and totals never come from the browser.
- **Logs:** structured JSON events (`checkout.*`, `itn.*`, `payment.*`, `email.*`, `admin.*`,
  `cron.*`) with no card data, passwords, message bodies or customer email addresses.

### Cookies and consent (POPIA)

**No cookie banner is needed.** The site sets no cookies for visitors. The only cookie is the
admin session cookie (strictly necessary, set only when the owner signs in). Analytics (Plausible
or Umami) is cookieless and loads only if configured. If you add anything that sets cookies
(advertising pixels, chat widgets, non-cookieless analytics), you must add consent handling first.
Marketing email requires the explicit, unticked-by-default opt-in that the checkout and newsletter
forms already use, and every marketing email needs a working unsubscribe link (`/unsubscribe`).

---

## 7. Testing

- **Unit tests (`npm test`):** pricing, shipping, discounts, VAT, cart resolution, PayFast
  signatures and ITN verification (with fixtures computed independently), idempotency, order
  status rules, emails, CSV safety, validation, security headers.
- **Smoke tests (`npm run test:smoke`):** drive a real production build in Chrome, **no database
  needed**: pages render, accessibility basics, security headers, SEO files, admin lock-out, the
  payment endpoint's guards.
- **Full checkout test (`npm run test:e2e`):** browse, add to cart, check out, signed PayFast
  hand-off, forged notifications ignored, a genuine one marks the order paid, a replay does nothing,
  and the order shows as paid in the admin. It needs a **disposable** migrated database:

  ```bash
  E2E_DATABASE_URL="postgresql://kuntania:kuntania@localhost:5432/kuntania_e2e" npm run test:e2e
  ```

  **Never point it at production**: it creates orders and an admin user.
  Playwright uses your installed Google Chrome. To use Playwright's own browser instead, run
  `npx playwright install chromium` and set `PLAYWRIGHT_CHANNEL=chromium`.

---

## 8. Troubleshooting

| Symptom                                                   | Likely cause                                                                                                                                                                                          |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Orders stay "Awaiting payment" after paying               | PayFast couldn't reach `SITE_URL/api/payments/payfast/notify`, or the passphrase/merchant details don't match. Check the order's history and the `PaymentNotification` table (`failureReason`).       |
| Order history shows "Payment notification rejected (...)" | `invalid_signature` (passphrase mismatch), `amount_mismatch`, `server_validation_failed`, `invalid_source_ip`, `merchant_mismatch`, `unknown_order`. Verify in the PayFast dashboard before shipping. |
| No emails                                                 | SMTP variables missing or wrong (logged as `email.skipped` / `email.failed`); check SPF/DKIM/DMARC if they arrive in spam.                                                                            |
| "Online payment isn't available" at checkout              | `PAYFAST_MERCHANT_ID` / `PAYFAST_MERCHANT_KEY` not set.                                                                                                                                               |
| Can't sign in to the admin                                | Reset with `npm run admin:create -- --email <email>` (it resets the password if the user exists).                                                                                                     |
| Migration fails on Neon/Supabase                          | Use the **direct** connection string as `DIRECT_DATABASE_URL`.                                                                                                                                        |
| Shop page shows an error locally                          | Database not running or not migrated (`npm run db:up`, `npm run db:migrate`).                                                                                                                         |

## 9. Known limits (v1)

Guest checkout only (no customer accounts) · couriers are booked by hand (no courier API) ·
refunds are made in the PayFast dashboard and only _recorded_ in the admin · product photos are
files in the repository (the admin edits the list, not the files) · one currency (ZAR) · PayFast
is the only payment provider (the code is behind a `PaymentProvider` interface so Yoco can be
added later).
