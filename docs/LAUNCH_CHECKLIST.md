# Pre-launch checklist

Work through this top to bottom. **Do not launch with any box unticked** unless you've decided,
and written down, why that's acceptable. Items marked **(blocker)** mean customers' money, legal
position or reputation is at stake.

Legend: _Dev_ = developer · _Client_ = business owner.

---

## 1. Content and business details

- [ ] **(blocker)** Every `TODO(CLIENT)` resolved. Check with:
      `grep -rn "TODO(CLIENT)" content src` (should print nothing that customers can see) and work
      through [`CLIENT_TODO.md`](CLIENT_TODO.md) until every box is ticked. _Dev + Client_
- [ ] **(blocker)** Business details in the footer are real and correct: registered name, legal
      form, registration number, VAT number (if any), physical address, email, phone
      (`content/site.ts`, required by the ECT Act s43). _Client_
- [ ] **(blocker)** Product pages contain **no placeholder text**: the admin shows a note on any
      product that still has "TODO(CLIENT)". Real INCI ingredient lists, sizes, prices, allergen
      notices, shelf life / period after opening. _Client_
- [ ] **(blocker)** Cosmetic **claim wording approved** by the client (table in CLIENT_TODO section 3),
      including the "Hair Growth" product name and "Cruelty-Free" (no certification logo unless
      certified). Confirm "castor oil" is really in the oil. _Client_
- [ ] **(blocker)** **Real product photos** replace the placeholder SVGs: files added to
      `public/images/products/`, and each product's photos and descriptions updated in the admin.
      Confirm licensing for any stock photos taken from the brochure. _Dev + Client_
- [ ] Brand logo and share image added (`public/og.jpg`), fonts and colours confirmed. _Dev + Client_
- [ ] Shipping set up in `content/site.ts`: courier fee, free-shipping threshold, optional
      pick-up/collection. **A courier fee of R0 means free shipping on everything.** _Client + Dev_
- [ ] FAQ answers reviewed, including the children and pregnancy answers ("consult your doctor"). _Client_

## 2. Legal and policies (South Africa)

- [ ] **(blocker)** Terms & Conditions, Privacy Policy and Shipping & Returns **reviewed by a
      legal professional** and approved by the client. _Client_
- [ ] **(blocker)** Have the adviser confirm how the **ECT Act s44 cooling-off right** (and the
      Consumer Protection Act) applies to **opened cosmetics**, and make the returns wording match.
      The current draft says opened products can't be returned unless defective; that must be
      checked against the law before launch. _Client_
- [ ] Privacy Policy names the real service providers (courier, email, hosting, analytics), where
      data is stored, and retention periods. The **Information Officer** is named and reachable
      (POPIA). Ask the adviser whether the Information Officer must be **registered with the
      Information Regulator**. _Client_
- [ ] `POLICIES_APPROVED=true` set in Vercel **only after** the three policies are approved (this
      removes the red DRAFT banner). Open each policy page afterwards and confirm the banner is gone. _Dev_
- [ ] Marketing consent check: the newsletter box and the checkout marketing box are **unticked by
      default**, and the unsubscribe page works (subscribe, then unsubscribe with a test address). _Dev_
- [ ] No cookie banner needed: confirm nothing that sets cookies has been added (see README,
      "Cookies and consent"). _Dev_

## 3. Payments (PayFast)

- [ ] **(blocker)** Live PayFast account approved. Live merchant ID, merchant key and a
      **passphrase** set in the PayFast dashboard; the same values entered in Vercel
      (`PAYFAST_MERCHANT_ID`, `PAYFAST_MERCHANT_KEY`, `PAYFAST_PASSPHRASE`). ITN (notifications)
      enabled on the live account. _Client + Dev_
- [ ] **(blocker)** `PAYFAST_MODE=live` in production, and `PAYFAST_VALIDATE_URL` is **blank**. _Dev_
- [ ] **(blocker)** Sandbox test passed first: order placed, paid in the sandbox, order shows
      **Payment received**, stock reduced, both emails arrived, a repeat notification changed nothing. _Dev_
- [ ] **(blocker)** **Full real-money test order** (small amount) placed on the live site: order
      shows paid in the admin, emails arrive, then **refunded in the PayFast dashboard** and marked
      refunded in the admin. Confirm the money actually came back. _Client + Dev_
- [ ] Test orders and test discount codes removed or clearly cancelled, so reports are clean. _Dev_
- [ ] Prices include VAT as intended and `VAT_REGISTERED` is correct (`true` only if VAT registered;
      the VAT number appears in the footer). _Client + Dev_

## 4. Email

- [ ] **(blocker)** SMTP configured (`SMTP_*`, `EMAIL_FROM`, `OWNER_EMAIL`). _Dev_
- [ ] **(blocker)** **SPF, DKIM and DMARC** set on the sending domain. Send test emails to Gmail
      and Outlook and confirm they land in the **inbox**, not spam. _Dev_
- [ ] All six customer/owner emails received and read through for wording: order confirmation,
      new-order alert, shipped, cancelled, refunded, contact acknowledgement, newsletter welcome. _Client_
- [ ] Reply-To on customer emails reaches the owner. _Dev_

## 5. Security and access

- [ ] **(blocker)** Admin user created with the owner's email and a **strong, unique password**
      (12+ characters); no default or shared accounts. _Dev + Client_
- [ ] **(blocker)** `SESSION_SECRET` is a fresh random 32+ character value (not the one used in
      testing) and `CRON_SECRET` is set. No secrets in the Git repository
      (`git log -p | grep -i secret` shows nothing real). _Dev_
- [ ] **(blocker)** Production `DATABASE_URL` is used by production only. The E2E test has never
      been run against it. _Dev_
- [ ] `/admin` redirects to the login page when signed out, and a wrong password is refused. _Dev_
- [ ] Vercel project access limited to the people who need it; two-factor authentication on the
      Vercel, GitHub, database, PayFast and email provider accounts. _Client + Dev_

## 6. Infrastructure

- [ ] **(blocker)** **Database backups are on and tested**: confirm the plan's backup/restore
      window, take a manual `pg_dump`, and restore it once into an empty database. _Dev_
- [ ] Migrations applied in production (`npx prisma migrate deploy` ran as part of the build) and
      the two products seeded. _Dev_
- [ ] Domain connected, **HTTPS** working, `www`/non-`www` redirect chosen, `SITE_URL` set to the
      final address and redeployed. _Dev_
- [ ] `/api/health` returns `{"status":"ok","db":"up"}` and is monitored by an uptime service that
      alerts the owner or developer. _Dev_
- [ ] The daily clean-up job is registered in Vercel (Cron Jobs) and succeeded at least once
      (check the logs for `cron.cancel_pending`). _Dev_

## 7. Search, analytics and quality

- [ ] **Google Search Console** set up for the domain; `sitemap.xml` submitted and accepted. _Dev_
- [ ] `robots.txt` checked: it hides `/admin`, `/api`, `/cart`, `/checkout`, `/order-status`. _Dev_
- [ ] **Analytics working** (Plausible or Umami): visit the live site and see yourself appear.
      No cookies are set for visitors (browser dev tools, Application tab). _Dev_
- [ ] **404 and error pages** checked: a made-up address shows the friendly 404 with a link back to
      the shop. _Dev_
- [ ] Run Lighthouse on the **live** site (mobile) for the home, shop, a product and checkout:
      aim for 90+ in every category. (Local builds scored 100 for accessibility, best practices and
      SEO and roughly 88 to 93 for mobile performance.) _Dev_
- [ ] Automated tests green: `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:smoke`,
      and the full `npm run test:e2e` against a **disposable** database. _Dev_
- [ ] **Tested by hand on a real Android phone and a real iPhone**: browse, add to cart, apply a
      discount code, complete checkout, pay, receive emails, look up the order on the site. Also test
      the admin on a phone. _Client + Dev_
- [ ] Keyboard-only check of checkout (Tab through, errors are announced and focus moves to the
      message). _Dev_

## 8. Hand-over

- [ ] The owner has read [`OWNER_GUIDE.md`](OWNER_GUIDE.md) and has done a practice order from
      "Orders to ship" through **Mark as shipped** (using a test order, then cancel it). _Client_
- [ ] The owner knows who to contact for each problem (website down, emails missing, payment
      stuck) and where the PayFast, hosting, database and email accounts are. _Dev_
- [ ] Account ownership is in the **client's** name (domain, hosting, database, PayFast, email,
      analytics), with the developer added as a collaborator. _Client_
- [ ] After go-live: watch the first real orders closely for the first week (emails arriving,
      orders marked paid, stock reducing), and check the logs for `itn.rejected` or `email.failed`. _Dev_
