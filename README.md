# Kunta Nia online shop

A small, secure e-commerce site for **Kunta Nia**, a South African natural hair care brand. Guest
checkout, payments through **Yoco**, and a simple admin area for the owner (orders, stock,
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
Yoco · Nodemailer (SMTP) · iron-session + bcrypt (admin login) · Vitest + Playwright.
Hosting target: Vercel (app) + Supabase (managed Postgres).

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
npm run admin:create -- you@example.com "Your Name"   # or create/reset an admin
npm run dev                      # http://localhost:3000
```

The minimum `.env` for local work is `DATABASE_URL` (the default in `.env.example` matches
`docker-compose.yml`) and `SESSION_SECRET` (generate one:
`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`).
Without SMTP settings emails are skipped (a warning is logged); without Yoco keys checkout
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
| `SITE_URL`                                                         | yes                 | Public base URL, no trailing slash. Used for canonical URLs, emails and Yoco callbacks.                             |
| `DATABASE_URL`                                                     | yes                 | PostgreSQL connection string used by the running app.                                                               |
| `DIRECT_DATABASE_URL`                                              | for migrations      | Used only by `prisma migrate`. On Supabase: the **Session pooler** string (port 5432).                              |
| `SESSION_SECRET`                                                   | yes                 | 32+ random characters; signs the admin session cookie.                                                              |
| `CRON_SECRET`                                                      | yes in production   | Authorises the daily clean-up job (`Authorization: Bearer ...`). Vercel Cron sends it automatically once set.       |
| `VAT_REGISTERED`                                                   | yes                 | `true` if VAT registered (prices are VAT-inclusive, 15%). Shows "VAT included" lines and stores the VAT amount.     |
| `POLICIES_APPROVED`                                                | yes                 | `true` **only** once the client has approved the policy pages. Until then a red "DRAFT" banner shows in production. |
| `YOCO_SECRET_KEY`                                                  | yes                 | Yoco Checkout API secret key: `sk_test_...` while testing, `sk_live_...` for real payments.                         |
| `YOCO_WEBHOOK_SECRET`                                              | yes                 | The `whsec_...` value printed by `npm run yoco:webhook` (shown once).                                               |
| `YOCO_API_URL`                                                     | never in production | Test-only stand-in for Yoco's API. Ignored unless the key starts with `sk_test_`. Leave blank.                      |
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
  home.ts faq.ts pages.ts emails.ts   Page and email wording
  products.ts         Seed data for the two products (the database is the source of truth afterwards)
  policies/*.md       Terms, Privacy (POPIA), Shipping & Returns drafts
prisma/             Schema, migrations, seed
src/app/(site)/     Public pages (home, shop, product, cart, checkout, content pages, order lookup)
src/app/admin/      Admin: login, dashboard, orders, products, discounts, messages, subscribers
src/app/api/        Yoco payment webhook, cron clean-up, health check
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
   `KN-` number from a database sequence), and a Yoco checkout is created for the exact total and the browser is sent to its payment page.
4. **Yoco calls back** (`/api/payments/yoco/webhook`). This is the **only** thing that marks an
   order paid. It first checks the webhook's **signature** (HMAC with the signing secret, and a
   timestamp no more than 3 minutes old, so replays fail). Then it logs the notification, finds the
   order by Yoco's checkout id, and checks that the **amount matches to the cent**, the currency is
   ZAR and the payment is in the **same mode** as our key (a test payment can never pay a real
   order). Only then, for `payment.succeeded`, it marks the order `PAID`, reduces stock, counts the
   discount use and sends the emails: all in one idempotent step, so a repeated webhook does nothing.
5. The success page never marks anything paid; it shows "confirming your payment" until the
   webhook has landed.
6. Unpaid orders are cancelled after 48 hours by a daily job (`/api/cron/cancel-pending`,
   scheduled in [`vercel.json`](vercel.json)). A late payment on a cancelled order reinstates it.
7. If stock ran out between checkout and payment, the order is still marked paid, and flagged
   "Stock problem" in the admin and in the owner's alert email.

---

## 5. Database (Supabase) and deploying to Vercel

### Supabase database setup

The app uses plain PostgreSQL, so any Postgres works. Supabase is the chosen host.

1. **Create the project** at supabase.com. Name it `kunta-nia`, set a strong database password
   (save it in a password manager), and pick the region **closest to South Africa**. Supabase has
   no Africa region; use **Central EU (Frankfurt, `eu-central-1`)** or **West Europe (London,
   `eu-west-2`)**. Then set Vercel's function region to the matching one (Frankfurt `fra1` or
   London `lhr1`) so the app and database sit close together. Because customer data is stored
   outside South Africa, the Privacy Policy must say so (POPIA).
2. **Get two connection strings** from the project's **Connect** dialog:

   | Use                           | Which one              | Port | Goes in               |
   | ----------------------------- | ---------------------- | ---- | --------------------- |
   | The running website           | **Transaction pooler** | 6543 | `DATABASE_URL`        |
   | Migrations (`prisma migrate`) | **Session pooler**     | 5432 | `DIRECT_DATABASE_URL` |

   Both use the host `aws-<n>-<region>.pooler.supabase.com` and the username
   `postgres.<project-ref>`. Do **not** use the "Direct connection" string: that host is
   IPv6-only on most plans, so Vercel and many home networks can't reach it.

3. **Finish the strings.** Add `?sslmode=require&uselibpqcompat=true` to `DATABASE_URL` and
   `?sslmode=require&sslaccept=accept_invalid_certs` to `DIRECT_DATABASE_URL` (the extra part is for the Prisma CLI: without it `prisma migrate` can fail with "P1001 Can't reach database server" on Windows even though the network is fine). Without `uselibpqcompat=true` the connection fails
   with "self-signed certificate in certificate chain". If the password contains `@`, `/`, `#` or
   similar, URL-encode it (`@` becomes `%40`). The app logs a warning (`db.config_warning`) if it
   spots these mistakes.
4. **Create the tables and data** (from your computer, with those two strings in `.env`):

   ```bash
   npm run db:deploy      # creates the tables (applies the migrations)
   npm run db:seed        # adds the three products
   npm run admin:create -- you@example.com "Your Name"
   ```

5. **Security: the public API.** Supabase publishes tables in the `public` schema through an
   automatic REST API, and new tables are not protected by default. This app never uses that API
   (it connects directly as the table owner), so a migration turns on row level security for every
   table with no policies, which locks the API out. A test fails if a new table is added without
   it. As a second layer you can also turn the Data API off in the project's API settings.
6. **Backups.** Supabase's **Free plan has no automatic backups**; the **Pro plan** keeps daily
   backups for the last 7 days (Point-in-Time Recovery is a separate, costly add-on and is not
   needed for a shop this size). Move to Pro before taking real orders, and see "Backups" below.
   Free projects can also pause when inactive, which would take the shop offline: check Supabase's
   current terms.

### Deploying

1. **Database.** Done above. In Vercel you'll paste the same `DATABASE_URL` and
   `DIRECT_DATABASE_URL`.
2. **Push the code** to a Git repository and **import it in Vercel** (framework: Next.js).
3. **Environment variables.** In Vercel, Project Settings, Environment Variables, add everything
   from the table above for _Production_ (and _Preview_ if you want preview deployments to work).
   Set `SITE_URL` to the final public URL (for example `https://www.yourdomain.co.za`).
4. **Build command.** Set it to `npx prisma migrate deploy && npm run build` so the database is
   migrated on every deploy. (`DATABASE_URL` / `DIRECT_DATABASE_URL` must be available at build time.)
5. **Deploy.** Then, **once**, from your own computer with the _production_ connection string:

   ```bash
   DATABASE_URL="<production url>" npm run db:seed          # creates the two products
   DATABASE_URL="<production url>" npm run admin:create -- owner@yourdomain.co.za "Owner"
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

### Yoco: test to live

1. **Test first.** In the client's Yoco account open _Yoco Connect > Checkout API_ and copy the
   **test** secret key (`sk_test_...`; test keys need no domain verification, and payments under
   R2.00 are refused). Put it in `YOCO_SECRET_KEY`.
2. **Register the webhook.** Yoco must be able to reach `SITE_URL/api/payments/yoco/webhook`, so
   do this on the deployed https address, **not** `localhost`. With `SITE_URL` and
   `YOCO_SECRET_KEY` set, run `npm run yoco:webhook`. It prints a `whsec_...` signing secret **once**:
   save it as `YOCO_WEBHOOK_SECRET` and redeploy. Yoco allows one webhook per account.
3. Place a test order and pay with a Yoco test card (the _Test card details_ page in the Yoco
   app). Confirm the order turns **Payment received** and the emails arrive.
4. **Go live.** Verify the domain in Yoco, replace `YOCO_SECRET_KEY` with the **live** key
   (`sk_live_...`), delete the old webhook and run `npm run yoco:webhook` again against the live
   key to get the live signing secret, update `YOCO_WEBHOOK_SECRET`, and redeploy.
5. Do one **real-money test order** (a small amount), confirm it shows as paid, then **refund** it
   in the Yoco portal and mark the order refunded in the admin.

### Backups

Turn on and verify automated backups **before launch**; orders and customers live only in this
database.

- **Supabase Pro:** daily backups, kept for 7 days. Restore from Dashboard, Database, Backups (the
  project is unavailable while it restores). The **Free plan has no automatic backups**.
- Whatever the plan, also take a **manual export** regularly as a second copy (monthly at
  minimum, and before any risky change), using the **session pooler** string:

  ```bash
  pg_dump "<DIRECT_DATABASE_URL>" --format=custom --file=kuntania-$(date +%F).dump
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
  only be posted to the site itself (customers reach Yoco by a plain redirect).
- **Abuse:** honeypot fields and Postgres-backed per-IP rate limits on checkout, contact,
  newsletter, order lookup, discount codes and login. Only a hash of the IP is stored.
- **Payments:** the webhook checks listed above; prices and totals never come from the browser.
- **Logs:** structured JSON events (`checkout.*`, `yoco.*`, `payment.*`, `email.*`, `admin.*`,
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

- **Unit tests (`npm test`):** pricing, shipping, discounts, VAT, cart resolution, Yoco
  webhook signatures and payment checks, the checkout request, idempotency, order
  status rules, emails, CSV safety, validation, security headers.
- **Smoke tests (`npm run test:smoke`):** drive a real production build in Chrome, **no database
  needed**: pages render, accessibility basics, security headers, SEO files, admin lock-out, the
  payment endpoint's guards.
- **Full checkout test (`npm run test:e2e`):** browse, add to cart, check out, Yoco
  hand-off, forged webhooks ignored, a genuine one marks the order paid, a replay does nothing,
  and the order shows as paid in the admin. It needs a **disposable** migrated database:

  ```bash
  E2E_DATABASE_URL="postgresql://kuntania:kuntania@localhost:5432/kuntania_e2e" npm run test:e2e
  ```

  **Never point it at production**: it creates orders and an admin user.
  Playwright uses your installed Google Chrome. To use Playwright's own browser instead, run
  `npx playwright install chromium` and set `PLAYWRIGHT_CHANNEL=chromium`.

---

## 8. Troubleshooting

| Symptom                                                   | Likely cause                                                                                                                                                                                                                                                     |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Orders stay "Awaiting payment" after paying               | Yoco couldn't reach `SITE_URL/api/payments/yoco/webhook`, the webhook isn't registered, or `YOCO_WEBHOOK_SECRET` is wrong (Yoco gets a 401). Check the order's history, the Vercel logs (`yoco.rejected`) and the `PaymentNotification` table (`failureReason`). |
| Order history shows "Payment notification rejected (...)" | `amount_mismatch`, `wrong_currency`, `mode_mismatch` (test payment against a live key or the reverse) or `status_not_succeeded`. Verify in the Yoco portal before shipping.                                                                                      |
| No emails                                                 | SMTP variables missing or wrong (logged as `email.skipped` / `email.failed`); check SPF/DKIM/DMARC if they arrive in spam.                                                                                                                                       |
| "Online payment isn't available" at checkout              | `YOCO_SECRET_KEY` / `YOCO_WEBHOOK_SECRET` not set.                                                                                                                                                                                                               |
| Can't sign in to the admin                                | Reset with `npm run admin:create -- <email>` (it resets the password if the user exists).                                                                                                                                                                        |
| Database connection fails with "self-signed certificate"  | `DATABASE_URL` must end with `?sslmode=require&uselibpqcompat=true`.                                                                                                                                                                                             |
| Database connection fails or hangs on Supabase            | Use the **pooler** strings (host ends `.pooler.supabase.com`), not the IPv6-only "Direct connection". Migrations use the Session pooler (5432), the website the Transaction pooler (6543).                                                                       |
| Shop page shows an error locally                          | Database not running or not migrated (`npm run db:up`, `npm run db:migrate`).                                                                                                                                                                                    |

## 9. Known limits (v1)

Guest checkout only (no customer accounts) · couriers are booked by hand (no courier API) ·
refunds are made in the Yoco portal and only _recorded_ in the admin · product photos are
files in the repository (the admin edits the list, not the files) · one currency (ZAR) · Yoco
is the only payment provider (the code is behind a `PaymentProvider` interface).
